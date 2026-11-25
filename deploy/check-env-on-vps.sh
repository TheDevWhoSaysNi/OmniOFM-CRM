#!/usr/bin/env bash
set -euo pipefail
ENV_FILE="${1:-/var/www/omniofm-crm/.env}"
secret_len=0
while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^# ]] && continue
  [[ -z "$line" ]] && continue
  k="${line%%=*}"
  v="${line#*=}"
  case "$k" in
    DATABASE_URL|FANVUE_CLIENT_SECRET|AUTH_JWT_SECRET|TOKEN_ENCRYPTION_KEY|QC_BRIDGE_SERVICE_TOKEN|HQ_SHARED_SECRET|CRON_SHARED_SECRET|HOLDOC_*|STACKED_CLIENT_SECRET|STACKED_API_KEY|STACKED_WEBHOOK_SECRET)
      if [ -z "$v" ]; then echo "${k}=<EMPTY>"
      else echo "${k}=<set len=${#v}>"
      fi
      ;;
    *)
      if [ -z "$v" ]; then echo "${k}=<EMPTY>"
      else echo "${k}=${v}"
      fi
      ;;
  esac
done < "$ENV_FILE"