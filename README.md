# OmniOFM CRM

Multi-tenant web CRM for creator agencies and solo creators. Fanvue-first (metrics, inbox, QC bridge), chatter focus mode, HQ time sync, and holdco webhooks to Twenty via n8n.

Staging: branch `develop` → https://crm-dev.omniofm.com (see [docs/DEV.md](docs/DEV.md)).

## Local dev

```bash
cp .env.example .env
# Set AUTH_JWT_SECRET (32+ chars) and DATABASE_URL
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3060

## Fanvue Builder checklist

1. Create app **OmniOFM CRM** (off-platform).
2. Redirect URI: `https://crm.omniofm.com/api/integrations/fanvue/callback` (and localhost for dev).
3. Scopes: agency `read:agency`, `read:chat`, `read:insights`, `write:chat`, etc. (see `.env.example`).
4. Set `FANVUE_CLIENT_ID` / `FANVUE_CLIENT_SECRET` on the VPS.

## Omni QC bridge

Set matching tokens on QC and CRM:

- QC: `CRM_BRIDGE_SERVICE_TOKEN`
- CRM: `QC_BRIDGE_SERVICE_TOKEN`, `QC_BRIDGE_BASE_URL=https://fanvue-qc.omniofm.com`

Register workspace with **Use QC bridge** enabled.

## Production (Hetzner Omni VPS)

- Unit: [deploy/omniofm-crm.service](deploy/omniofm-crm.service)
- nginx: [deploy/nginx-snippet.conf](deploy/nginx-snippet.conf)
- Cloudflare Access: [deploy/cloudflare-access.md](deploy/cloudflare-access.md)

## Team

Mark, Umer, Owais: GitHub collaborators on this repo plus Fanvue sibling repos. Discord Dev Team role already grants engineering channels on OmniOFM.