## Summary

Ryan operator checklist: credentials and vendor access so Umer/Owais can finish Stacked, OnlyFans, and Telegram integrations.

## Stacked

- [ ] Request **External API access** on Stacked (agency/creator account as appropriate)
- [ ] Choose path: `stk_live_` API key **or** Developer OAuth app (internal-only app is fine for Omni CRM)
- [ ] When approved, set on VPS `/var/www/omniofm-crm/.env`:
  - `STACKED_CLIENT_ID` / `STACKED_CLIENT_SECRET` (OAuth), or document API-key-per-workspace approach with devs
- [ ] Redirect (when OAuth): `https://crm.omniofm.com/api/integrations/stacked/callback`
- [ ] `systemctl restart omniofm-crm`

## OnlyFans

- [ ] Decide data path (official partner, approved vendor, or deferred bridge)
- [ ] Obtain credentials per chosen path
- [ ] Set `ONLYFANS_*` in VPS `.env` when available
- [ ] Do not commit secrets to git

## Telegram

- [ ] [@BotFather](https://t.me/BotFather): create dedicated **OmniOFM CRM** funnel bot (not reusing unrelated prod bots unless intentional)
- [ ] In CRM: **Integrations → Telegram**, paste bot token + `@username`
- [ ] Set webhook URL shown by CRM (BotFather or `setWebhook`)
- [ ] Confirm inbound-only use case with team (no blast campaigns)

## Fanvue (done)

- Client ID + secret on VPS; test **Connect Fanvue** at https://crm.omniofm.com/dashboard/integrations

## VPS sanity

```bash
bash /var/www/omniofm-crm/deploy/check-env-on-vps.sh
```