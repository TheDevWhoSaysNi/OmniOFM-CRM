# Product boundaries — CRM vs Chatbot

**Authors:** Ryan Ellenburg + Umer Waqas (scope agreed 2026-11-25).

Mirror doc: [`OmniOFM-Chatbot` `docs/PRODUCT_BOUNDARIES.md`](https://github.com/suncoast-servers/OmniOFM-Chatbot/blob/develope-v3/docs/PRODUCT_BOUNDARIES.md).

## OmniOFM CRM (this repo)

- **Chatter / creator ops** for solo creators and agencies (Infloww / CreatorHero class).
- **Unified inbox** across Fanvue and future platforms; vault; pay-to-view; team permissions.
- **Web-first delivery:** normal HTTPS tab, **installable PWA**, optional **Chrome extension** that opens the same app (no native desktop installer with its own update/re-login pain).
- **Connect chatbots:** OmniOFM Chatbot first via service tokens; other vendors when adapters exist.
- **Not:** LLM auto-reply engine, heat scoring logic, or per-message credit debit (Chatbot + entitlement).

## OmniOFM Chatbot

- Sign up, connect platforms, **configure automation** in a simple UI.
- Bot on/off, persona, credits, handoff **signals** to CRM.
- Integrate via [`CRM.md` in chatbot repo](https://github.com/suncoast-servers/OmniOFM-Chatbot/blob/develope-v3/docs/integrations/CRM.md) (provision, enable/disable).

## Holdco CRM (Twenty)

Marketing signup leads only (n8n). Not this product.