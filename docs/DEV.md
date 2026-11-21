# OmniOFM CRM — development and staging

## Branch model

| Branch | Deploy target | URL |
|--------|----------------|-----|
| `main` | Production | https://crm.omniofm.com (`/var/www/omniofm-crm`, port **3060**) |
| `develop` | Staging / dev | https://crm-dev.omniofm.com (`/var/www/omniofm-crm-dev`, port **3061**) |

Contractors: open PRs against `develop`; Ryan promotes to `main` after staging smoke test.

## Local (Windows / Mac)

```bash
cp .env.example .env
# AUTH_JWT_SECRET (32+ chars), DATABASE_URL to local Postgres
npm ci
npx prisma migrate dev
npm run dev
```

http://localhost:3060

Fanvue Builder: add redirect `http://localhost:3060/api/integrations/fanvue/callback` on the same Builder app (or a dedicated dev app).

QC bridge: point `QC_BRIDGE_BASE_URL` at public QC or skip and use direct Fanvue OAuth only.

## Staging VPS (Hetzner Omni `91.99.193.212`)

One-time (root):

```bash
cd /var/www/omniofm-crm && git fetch origin develop
bash /var/www/omniofm-crm/deploy/dev-bootstrap.sh
```

Deploy updates:

```bash
sudo -u deploy bash -lc 'cd /var/www/omniofm-crm-dev && git pull origin develop && npm ci && npx prisma migrate deploy && npm run build'
sudo systemctl restart omniofm-crm-dev
```

Env audit:

```bash
bash /var/www/omniofm-crm-dev/deploy/check-env-on-vps.sh /var/www/omniofm-crm-dev/.env
```

### Fanvue on staging

Add redirect URI in Builder:

`https://crm-dev.omniofm.com/api/integrations/fanvue/callback`

Staging `.env` has its own `AUTH_JWT_SECRET` and database (`omniofm_crm_dev`). You may reuse production Fanvue client id/secret on staging only if redirects are registered (never commit secrets).

### systemd

- Production: `omniofm-crm.service`
- Staging: `omniofm-crm-dev.service`

## Do not

- Point staging at production Postgres
- Copy prod `.env` wholesale into git
- Run `systemctl stop fanvue-agency-*` (sibling apps)