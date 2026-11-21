# Agent notes — OmniOFM CRM


## For Cursor agents

1. **User Rules:** Cursor loads Customize → Rules → User on every chat. Follow them (short replies by default, loop index `ni` in Ryan-owned code, no em dashes in customer-facing copy, run commands yourself unless blocked).
2. **Operator doc:** On Ryan's PC, read `C:\Users\Ryan\.cursor\AGENTS.md` for machines, secrets, fleet, and global never-do (not in git).
3. **This file:** Repo-specific ops only. Keep answers brief unless Ryan asks for depth.

## Fanvue API (do not guess)

1. Start at https://api.fanvue.com/docs/llms.txt
2. Pin HTTP calls with `X-Fanvue-API-Version: 2025-06-26`
3. OAuth is PKCE at https://auth.fanvue.com/oauth2/auth
4. Use a **separate** Fanvue Builder app from `fanvue-agency-qc`, chatbot, intro, and webhooks.

## Hosting (Omni VPS `91.99.193.212`)

| Item | Value |
|------|--------|
| Live target | https://crm.omniofm.com |
| systemd | `omniofm-crm` |
| Port | **3060** |
| Path | `/var/www/omniofm-crm` |
| Postgres DB | `omniofm_crm` |

Never run `systemctl stop fanvue-agency-*` on this box (kills sibling Fanvue apps). Restart units by exact name only.

## Data boundaries

- Omni workspace may use **QC bridge** (`QC_BRIDGE_*`) for read-only metrics. Do not double-poll Fanvue for Omni when bridge is on.
- **Never** push raw chat or `qc_messages` into Twenty. Holdco events are aggregate-only via n8n.
- Token storage uses `TOKEN_ENCRYPTION_KEY` (or `AUTH_JWT_SECRET` fallback). Do not commit `.env`.

## Deploy

```bash
cd /var/www/omniofm-crm && git pull && npm ci && npm run build && npx prisma migrate deploy && sudo systemctl restart omniofm-crm
```

See [README.md](README.md) and [docs/DATA.md](docs/DATA.md).