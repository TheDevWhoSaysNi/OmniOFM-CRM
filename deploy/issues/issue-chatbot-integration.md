## Summary

Integrate **OmniOFM Chatbot** with OmniOFM CRM: shared identity, license/credits (entitlement service), and optional inbox handoff. Sibling repo: `OmniOFM-Chatbot` on same VPS (`91.99.193.212`).

## Context

- Chatbot uses `ENTITLEMENT_SERVICE_URL` + `ENTITLEMENT_API_KEY` for credits (`packages/billing-client`, `@omniofm/entitlement`)
- CRM owns workspaces, roles, Fanvue OAuth, shift sessions, HQ hour sync
- Product line: CRM = ops + humans; Chatbot = automated Fanvue replies (debited per message when entitlement configured)

## Proposed contract

| Concern | Direction |
|---------|-----------|
| Auth | Service-to-service `X-Omni-Service-Token` or reuse pattern from QC `CRM_BRIDGE_SERVICE_TOKEN` |
| License | CRM workspace stores `chatbotEnabled`, plan tier, link to entitlement customer id |
| Credits | CRM admin UI shows balance (read from entitlement API); grants via internal API (Ryan-only or admin) |
| Inbox | Optional: CRM surfaces bot-on threads via Fanvue `read:chat` (no duplicate polling) |

## Tasks

- [ ] Spec in `docs/integrations/CHATBOT.md` (env vars both sides)
- [ ] CRM: `CHATBOT_ENTITLEMENT_URL`, `CHATBOT_SERVICE_TOKEN` in `env.ts` + `.env.example`
- [ ] API routes: `POST /api/chatbot/license` (provision workspace), `GET /api/chatbot/credits`
- [ ] Admin UI: enable chatbot for workspace, copy service token for chatbot `.env`
- [ ] Chatbot: consume CRM provision endpoint on agency deploy (document in Chatbot repo)
- [ ] E2E on staging: workspace enabled → chatbot debits → CRM shows usage aggregate

## Ryan ops

- Generate shared secrets on VPS only
- Deploy entitlement service if not already on Omni VPS

## Acceptance

Staging workspace can enable chatbot; entitlement calls succeed with shared API key; no secrets in git.