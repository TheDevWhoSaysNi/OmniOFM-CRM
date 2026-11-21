#!/usr/bin/env bash
# Run on the Omni VPS only (never on Ryan's PC).
#   ssh root@91.99.193.212
#   bash /var/www/omniofm-crm/deploy/set-fanvue-secret-on-vps.sh
#
# Prompts for the Fanvue client secret on the server; updates .env and restarts CRM.

set -euo pipefail
ENV_FILE="/var/www/omniofm-crm/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

read -r -s -p "Fanvue client secret (input hidden): " secret
echo ""
if [ -z "$secret" ]; then
  echo "Empty secret, aborted."
  exit 1
fi

ENV_FILE="$ENV_FILE" FANVUE_SECRET="$secret" python3 - <<'PY'
import os, re, pathlib
env_file = os.environ["ENV_FILE"]
secret = os.environ["FANVUE_SECRET"]
text = pathlib.Path(env_file).read_text(encoding="utf-8")
line = "FANVUE_CLIENT_SECRET=" + secret
if re.search(r"(?m)^FANVUE_CLIENT_SECRET=", text):
    text = re.sub(r"(?m)^FANVUE_CLIENT_SECRET=.*$", line, text)
else:
    if text and not text.endswith("\n"):
        text += "\n"
    text += line + "\n"
pathlib.Path(env_file).write_text(text, encoding="utf-8")
PY

unset secret FANVUE_SECRET

chown deploy:deploy "$ENV_FILE"
chmod 600 "$ENV_FILE"

grep '^FANVUE_CLIENT_ID=' "$ENV_FILE" || true
echo "FANVUE_CLIENT_SECRET=<set>"

systemctl restart omniofm-crm
systemctl is-active omniofm-crm
echo "Done. Connect Fanvue at https://crm.omniofm.com/dashboard/integrations"