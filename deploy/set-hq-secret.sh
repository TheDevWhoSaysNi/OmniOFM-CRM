#!/usr/bin/env bash
set -euo pipefail
HQ="$(openssl rand -hex 24)"
LOCAL=/var/www/omniofm.com/api/config.local.php
CRM_ENV=/var/www/omniofm-crm/.env

if grep -q "hq_crm_shared_secret" "$LOCAL"; then
  sed -i "s/'hq_crm_shared_secret' =>.*/'hq_crm_shared_secret' => '${HQ}',/" "$LOCAL"
else
  sed -i "s/^];$/    'hq_crm_shared_secret' => '${HQ}',\n];/" "$LOCAL"
fi

if grep -q "^HQ_SHARED_SECRET=" "$CRM_ENV"; then
  sed -i "s/^HQ_SHARED_SECRET=.*/HQ_SHARED_SECRET=${HQ}/" "$CRM_ENV"
else
  echo "HQ_SHARED_SECRET=${HQ}" >> "$CRM_ENV"
fi

systemctl restart omniofm-crm
echo "hq_secret_configured"