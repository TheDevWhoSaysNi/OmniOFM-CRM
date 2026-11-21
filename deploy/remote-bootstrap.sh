#!/usr/bin/env bash
# OmniOFM CRM on 91.99.193.212 — port 3060 only.
# Do not stop fanvue-agency-* glob services.
set -euo pipefail

APP_DIR=/var/www/omniofm-crm
DB_NAME=omniofm_crm
DB_USER=omniofm_crm
REPO_URL="${REPO_URL:-https://github.com/TheDevWhoSaysNi/OmniOFM-CRM.git}"
QC_ENV=/var/www/fanvue-agency-qc/.env

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root." >&2
  exit 1
fi

if [ ! -d "$APP_DIR/.git" ]; then
  sudo -u deploy git clone "$REPO_URL" "$APP_DIR"
else
  sudo -u deploy bash -lc "cd $APP_DIR && git pull --ff-only"
fi

DB_PASS="$(openssl rand -hex 24)"
AUTH_SECRET="$(openssl rand -hex 32)"
TOKEN_KEY="$(openssl rand -hex 32)"
CRON_SECRET="$(openssl rand -hex 24)"
BRIDGE_TOKEN="$(openssl rand -hex 32)"

sudo -u postgres psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres createdb "$DB_NAME"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER SCHEMA public OWNER TO ${DB_USER};
SQL

umask 077
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
APP_BASE_URL=https://crm.omniofm.com
PORT=3060
NODE_ENV=production
AUTH_JWT_SECRET=${AUTH_SECRET}
TOKEN_ENCRYPTION_KEY=${TOKEN_KEY}
DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}

FANVUE_CLIENT_ID=
FANVUE_CLIENT_SECRET=
FANVUE_REDIRECT_URI=https://crm.omniofm.com/api/integrations/fanvue/callback
FANVUE_API_VERSION=2025-06-26

QC_BRIDGE_BASE_URL=https://fanvue-qc.omniofm.com
QC_BRIDGE_SERVICE_TOKEN=${BRIDGE_TOKEN}

HQ_API_BASE_URL=https://omniofm.com
HQ_SHARED_SECRET=

HOLDOC_N8N_WEBHOOK_URL=
HOLDOC_WEBHOOK_SECRET=

FEATURE_INBOX=true
FANVUE_SYNC_ENABLED=false
CRON_SHARED_SECRET=${CRON_SECRET}

TELEGRAM_BOT_DEFAULT_WEBHOOK_BASE_URL=https://crm.omniofm.com
SUPER_ADMIN_EMAILS=ryan@suncoastservers.com
EOF
  chown deploy:deploy "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
else
  echo ".env exists; leaving DATABASE_URL and secrets unchanged"
  BRIDGE_TOKEN=""
fi

chown -R deploy:deploy "$APP_DIR"

sudo -u deploy bash -lc "cd $APP_DIR && npm ci && npx prisma migrate deploy && npm run build"

cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/omniofm-crm
ln -sf /etc/nginx/sites-available/omniofm-crm /etc/nginx/sites-enabled/omniofm-crm
nginx -t
systemctl reload nginx

cp "$APP_DIR/deploy/omniofm-crm.service" /etc/systemd/system/omniofm-crm.service
systemctl daemon-reload
systemctl enable omniofm-crm
systemctl restart omniofm-crm

if [ -f "$QC_ENV" ] && [ -n "$BRIDGE_TOKEN" ]; then
  if grep -q '^CRM_BRIDGE_SERVICE_TOKEN=' "$QC_ENV"; then
    sed -i "s/^CRM_BRIDGE_SERVICE_TOKEN=.*/CRM_BRIDGE_SERVICE_TOKEN=${BRIDGE_TOKEN}/" "$QC_ENV"
  else
    echo "CRM_BRIDGE_SERVICE_TOKEN=${BRIDGE_TOKEN}" >> "$QC_ENV"
  fi
  systemctl restart fanvue-agency-qc
  echo "Updated QC CRM_BRIDGE_SERVICE_TOKEN and restarted fanvue-agency-qc"
fi

echo "OmniOFM CRM bootstrap done. Set Fanvue OAuth in $APP_DIR/.env then: systemctl restart omniofm-crm"