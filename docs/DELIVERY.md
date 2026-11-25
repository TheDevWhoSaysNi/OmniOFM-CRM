# How users run the CRM (web, not a heavy desktop app)

Ryan requirement (2026-11-25): chatters should get a **solid, always-current** experience without a traditional downloaded app that constantly nags to update and re-login.

## v1 targets

| Surface | Role |
|---------|------|
| **Browser tab** | `https://crm.omniofm.com` (prod), `crm-dev.omniofm.com` (staging) |
| **PWA** | Add manifest + service worker in this repo so "Install app" pins a window; same auth session as the tab |
| **Chrome extension (optional)** | Thin launcher: opens CRM origin in a dedicated window, optional badge for unread. No duplicate business logic in the extension |

## Explicit non-goals

- Electron/Tauri thick clients with a separate release train from the web app.
- Fanvue OAuth or inbox logic inside the extension background page.

## Chatbot pairing

When a workspace uses OmniOFM Chatbot, CRM provisions the link (see chatbot `integrations/CRM.md`). Incentives for using both products together are product/marketing only.