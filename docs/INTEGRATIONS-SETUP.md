# Integrations setup (Ryan checklist)

## Fanvue (do this now)

Fanvue does **not** use a single static “API key.” OmniOFM CRM uses a **separate Fanvue Builder app** from QC, chatbot, intro, and webhooks.

1. Open [Fanvue Builder](https://api.fanvue.com/docs) and create an app, e.g. **OmniOFM CRM**. Use **API only** (basic OAuth) for a private agency CRM; **off-platform** also works and is only required if you plan an App Store listing (set App URL to `https://crm.omniofm.com`).
2. **Redirect URI:** `https://crm.omniofm.com/api/integrations/fanvue/callback`
3. **Scopes (agency workspace):** include at least  
   `openid offline_access read:agency read:creator read:insights read:chat read:fan write:chat`
4. On the **Omni VPS only** (`/var/www/omniofm-crm/.env`):
   - `FANVUE_CLIENT_ID` (already set for production)
   - `FANVUE_CLIENT_SECRET` — SSH to the server and run:
     `bash /var/www/omniofm-crm/deploy/set-fanvue-secret-on-vps.sh`
     (prompt is on the VPS; nothing is stored on your PC)
   - Or edit with `nano /var/www/omniofm-crm/.env` as root/deploy, then `systemctl restart omniofm-crm`
5. Audit: `bash /var/www/omniofm-crm/deploy/check-env-on-vps.sh`
6. In the CRM: **Integrations → Connect Fanvue** (admin login).

Omni’s metrics can use the **QC bridge** (already wired on the VPS) when the workspace was registered with **Use QC data bridge**. Fanvue OAuth is still required for chatter **inbox** (`write:chat`).

## Telegram (when you want CRM funnel bot)

No global Telegram “API key” for the platform. You need a **bot**:

1. Message [@BotFather](https://t.me/BotFather), create a bot, save the **HTTP API token**.
2. In CRM: **Integrations → Telegram** (admin), paste token and optional `@username`.
3. Set BotFather webhook to the URL the CRM shows after save (includes workspace id and secret).
4. Optional: add funnel rules in the same UI.

You can use a **dedicated** bot for CRM or a separate one from `omni-telegram-bot` on the VPS; do not reuse tokens across unrelated products unless you intend one bot for both.

Contractor specs: [docs/integrations/STACKED.md](integrations/STACKED.md), [ONLYFANS.md](integrations/ONLYFANS.md), [TELEGRAM.md](integrations/TELEGRAM.md).

## Stacked (wait)

The CRM has a **Stacked connector slot** (UI shows “coming soon”). There is no Stacked OAuth wired in this repo yet. Before you create keys somewhere:

- Confirm with Stacked whether they offer **agency API / OAuth** for your account type.
- Send Ryan the doc link or partner contact; we will add env vars and connect flow like Fanvue once the API is confirmed.

**You do not need to do anything on Stacked today** unless they already gave you API credentials to test.

## OnlyFans (ready in code, no action now)

The app already has:

- Env placeholders: `ONLYFANS_CLIENT_*`, `ONLYFANS_REDIRECT_URI`, webhook secret
- Integrations UI shell and connect route (returns not configured until credentials exist)

There is **no public OnlyFans API** for agencies like Fanvue. When you pick a path (official partner, approved vendor, or future official API), we drop credentials into `.env` only. **No Fanvue-style Builder step exists for OF today.**

## Already done on the server

- `https://crm.omniofm.com` (DNS + TLS + systemd on port 3060)
- Postgres `omniofm_crm`
- QC bridge token on QC + CRM `.env`
- HQ hours secret shared between `config.local.php` and CRM (for shift sync)

Fanvue client id/secret from Builder are the main thing **only you** can complete in the Fanvue dashboard.