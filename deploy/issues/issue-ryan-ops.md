## Summary

Ryan operator checklist: credentials and vendor access so Umer/Owais can finish Stacked, OnlyFans, and Telegram integrations.

## Stacked

- [x] **External API** + **Connect Stacked** OAuth app on VPS `.env` (`STACKED_CLIENT_ID`, `STACKED_CLIENT_SECRET`, `STACKED_API_KEY`)
- [x] Redirect: `https://crm.omniofm.com/api/integrations/stacked/callback`
- [ ] **TODO:** `STACKED_WEBHOOK_SECRET` (blank on VPS until Stacked webhook signing secret is issued; wire `GET/POST /api/webhooks/stacked` in issue-stacked-dev)
- [ ] Restart after secret: `systemctl restart omniofm-crm`

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