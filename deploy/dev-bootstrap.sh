#!/usr/bin/env bash
# Staging CRM from develop branch (port 3061, separate DB).
set -euo pipefail

APP_DIR=/var/www/omniofm-crm-dev
REPO=https://github.com/TheDevWhoSaysNi/OmniOFM-CRM.git
DB_NAME=omniofm_crm_dev
DB_USER=omniofm_crm_dev
BRANCH=develop
PORT=3061

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root on the Omni VPS"
  exit 1
fi

if ! id deploy &>/dev/null; then
  echo "Missing deploy user"
  exit 1
fi

DB_PASS="$(openssl rand -hex 24)"
AUTH_SECRET="$(openssl rand -hex 32)"
TOKEN_KEY="$(openssl rand -hex 32)"
BRIDGE_TOKEN="$(openssl rand -hex 32)"
CRON_SECRET="$(openssl rand -hex 24)"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

if [ ! -d "$APP_DIR/.git" ]; then
  mkdir -p "$APP_DIR"
  chown deploy:deploy "$APP_DIR"
  sudo -u deploy git clone -b "$BRANCH" "$REPO" "$APP_DIR" 2>/dev/null || {
    sudo -u deploy git clone "$REPO" "$APP_DIR"
    sudo -u deploy bash -lc "cd $APP_DIR && git checkout -b $BRANCH origin/$BRANCH || git checkout -b $BRANCH"
  }
else
  sudo -u deploy bash -lc "cd $APP_DIR && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH"
fi

ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat >"$ENV_FILE" <<EOF
APP_BASE_URL=https://crm-dev.omniofm.com
PORT=${PORT}
NODE_ENV=production
AUTH_JWT_SECRET=${AUTH_SECRET}
TOKEN_ENCRYPTION_KEY=${TOKEN_KEY}
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}

FANVUE_CLIENT_ID=
FANVUE_CLIENT_SECRET=
FANVUE_REDIRECT_URI=https://crm-dev.omniofm.com/api/integrations/fanvue/callback
FANVUE_API_VERSION=2025-06-26

QC_BRIDGE_BASE_URL=http://127.0.0.1:3030
QC_BRIDGE_SERVICE_TOKEN=${BRIDGE_TOKEN}

HQ_API_BASE_URL=https://omniofm.com
HQ_SHARED_SECRET=

HOLDOC_N8N_WEBHOOK_URL=
HOLDOC_WEBHOOK_SECRET=

FEATURE_INBOX=true
FANVUE_SYNC_ENABLED=false
CRON_SHARED_SECRET=${CRON_SECRET}

TELEGRAM_BOT_DEFAULT_WEBHOOK_BASE_URL=https://crm-dev.omniofm.com
SUPER_ADMIN_EMAILS=ryan@suncoastservers.com
EOF
  chown deploy:deploy "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created staging .env (copy FANVUE_* from prod if testing OAuth on staging)"
else
  echo "Staging .env exists; skipped"
fi

# Match QC bridge token if QC env present (optional; same token as prod CRM is OK for read bridge)
QC_ENV=/var/www/fanvue-agency-qc/.env
PROD_CRM_ENV=/var/www/omniofm-crm/.env
if [ -f "$PROD_CRM_ENV" ]; then
  prod_bridge=$(grep '^QC_BRIDGE_SERVICE_TOKEN=' "$PROD_CRM_ENV" | cut -d= -f2- || true)
  if [ -n "$prod_bridge" ]; then
    sed -i "s|^QC_BRIDGE_SERVICE_TOKEN=.*|QC_BRIDGE_SERVICE_TOKEN=${prod_bridge}|" "$ENV_FILE"
    echo "Aligned QC_BRIDGE_SERVICE_TOKEN with production CRM"
  fi
  prod_fv_id=$(grep '^FANVUE_CLIENT_ID=' "$PROD_CRM_ENV" | cut -d= -f2- || true)
  prod_fv_sec=$(grep '^FANVUE_CLIENT_SECRET=' "$PROD_CRM_ENV" | cut -d= -f2- || true)
  if [ -n "$prod_fv_id" ] && [ -n "$prod_fv_sec" ]; then
    sed -i "s|^FANVUE_CLIENT_ID=.*|FANVUE_CLIENT_ID=${prod_fv_id}|" "$ENV_FILE"
    sed -i "s|^FANVUE_CLIENT_SECRET=.*|FANVUE_CLIENT_SECRET=${prod_fv_sec}|" "$ENV_FILE"
    echo "Copied Fanvue OAuth creds from prod for staging (add crm-dev redirect in Builder)"
  fi
fi

chown -R deploy:deploy "$APP_DIR"

sudo -u deploy bash -lc "cd $APP_DIR && npm ci && npx prisma migrate deploy && npm run build"

cp "$APP_DIR/deploy/nginx-dev.conf" /etc/nginx/sites-available/omniofm-crm-dev
ln -sf /etc/nginx/sites-available/omniofm-crm-dev /etc/nginx/sites-enabled/omniofm-crm-dev
nginx -t
systemctl reload nginx

cp "$APP_DIR/deploy/omniofm-crm-dev.service" /etc/systemd/system/omniofm-crm-dev.service
systemctl daemon-reload
systemctl enable omniofm-crm-dev
systemctl restart omniofm-crm-dev

echo "Staging CRM: https://crm-dev.omniofm.com (after DNS + TLS)"
echo "Branch: $BRANCH  Port: $PORT  DB: $DB_NAME"