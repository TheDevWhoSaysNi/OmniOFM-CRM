# Telegram integration (readiness)

## Product intent (Omni)

- **Not** outbound spam. Fans **DM first** (organic opt-in).
- Human-like, conversational routing into Fanvue / OF / Stacked funnels.
- Comply with Telegram Bot API rules: bot cannot cold-message users who have not started the bot; inbound-first workflows are correct.

## Phase 1 (implemented)

| Piece | Path |
|-------|------|
| Bot token connect | `POST /api/telegram/connect` |
| Webhook | `GET/POST /api/telegram/webhook?workspaceId=&secret=` |
| Funnel rules | `POST /api/telegram/funnel-rules` |
| UI | `/dashboard/integrations` (Telegram section) |

After connect, admin sets BotFather webhook to the URL the API returns.

## Phase 2 (contractors)

Align with industry funnel stacks (inbound-first, optional user-account inbox later):

1. **Inbound handling**: parse `message`, `edited_message`, `callback_query`; idempotent storage; rate limits.
2. **Chatter-facing**: thread view or handoff events into CRM inbox (Fanvue bridge pattern).
3. **Human-like replies**: typing indicators, delayed sends, template + freeform (no blast to non-starters).
4. **Optional later**: MTProto user-session per creator (Telethon/TDLib) for mirroring a **personal** creator account. Separate worker, heavy compliance; not required for Phase 1 bot webhook.

## Ryan ops

- Create dedicated bot via [@BotFather](https://t.me/BotFather)
- Paste token in CRM Integrations (encrypted at rest)
- Set webhook URL from CRM

## Acceptance (issue)

1. Document webhook payload examples and funnel rule matrix in this file.
2. Harden webhook: replay protection, message dedupe, structured logging (no PII in logs).
3. Admin UX: show webhook status, `getWebhookInfo` health check button.
4. Design note for Phase 2 user-account sync (1-page ADR in `docs/integrations/TELEGRAM-ADR.md`).