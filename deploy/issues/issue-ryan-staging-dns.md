## Summary

Finish public **staging** access for OmniOFM CRM (code is deployed; DNS/TLS/Fanvue pending).

## Already done on VPS

- Path: `/var/www/omniofm-crm-dev`
- Branch: `develop`
- Port: **3061**, systemd `omniofm-crm-dev`
- DB: `omniofm_crm_dev` (isolated from prod)
- Local smoke: `http://127.0.0.1:3061/login` → 200

## Ryan to do

- [ ] Cloudflare: proxied A record **`crm-dev.omniofm.com`** → `91.99.193.212`
- [ ] On VPS: `certbot --nginx -d crm-dev.omniofm.com` (after DNS propagates)
- [ ] Fanvue Builder: add redirect `https://crm-dev.omniofm.com/api/integrations/fanvue/callback` (staging uses same client id as prod today)
- [ ] Optional: Cloudflare Access policy for staging (contractors only)

## Contractor workflow

PRs → `develop` → deploy:

```bash
cd /var/www/omniofm-crm-dev && git pull origin develop && npm ci && npx prisma migrate deploy && npm run build
systemctl restart omniofm-crm-dev
```

See `docs/DEV.md`.