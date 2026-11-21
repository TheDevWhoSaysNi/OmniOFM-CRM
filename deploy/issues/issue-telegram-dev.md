## Summary

Harden **Telegram** for inbound-first, human-like funnel chat (not spam). Fans **DM the bot first**. Align with Telestars/KVIQA-style inbound flows using Bot API (Phase 1); document optional user-account sync (Phase 2).

## References

- `docs/integrations/TELEGRAM.md`
- Implemented: `/api/telegram/connect`, `webhook`, `funnel-rules`

## Tasks

- [ ] Webhook: dedupe updates, validate secret, safe logging (no raw tokens in logs)
- [ ] Handle `message`, `callback_query`; store events for chatter/QC review
- [ ] Reply path: typing delay / single-thread replies (configurable); no bulk outbound to users who never `/start`
- [ ] Admin UI: webhook health (`getWebhookInfo`), copy BotFather instructions
- [ ] Funnel rules: test matrix Fanvue / OF / Stacked targets
- [ ] ADR `docs/integrations/TELEGRAM-ADR.md` for optional MTProto user-session later

## Product rules

- No cold DMs; Bot API compliance
- Realistic pacing for automated replies where used

## Ryan dependency

Telegram bot token from BotFather (ops issue). Until then, dev against Bot API test bot.

## Acceptance

With Ryan's bot token in CRM, webhook receives inbound DMs, funnel rules fire, and automated replies only go to users who have messaged the bot first.