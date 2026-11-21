#!/usr/bin/env bash
set -euo pipefail
QC_ENV=/var/www/fanvue-agency-qc/.env
CRM_ENV=/var/www/omniofm-crm/.env
set -a
# shellcheck disable=SC1090
source "$QC_ENV"
# shellcheck disable=SC1090
source "$CRM_ENV"
set +a
if [ "${CRM_BRIDGE_SERVICE_TOKEN:-}" = "${QC_BRIDGE_SERVICE_TOKEN:-}" ] && [ -n "${CRM_BRIDGE_SERVICE_TOKEN:-}" ]; then
  echo tokens_match
else
  echo tokens_mismatch
  exit 1
fi
code=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Crm-Service-Token: ${CRM_BRIDGE_SERVICE_TOKEN}" http://127.0.0.1:3030/api/crm/creators)
echo "bridge_http=${code}"