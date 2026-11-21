## Summary

Prepare OmniOFM CRM for **Stacked** External API integration. We do **not** have API keys or OAuth credentials yet. Deliver code structure, env wiring, and documentation so Ryan can drop credentials and connect.

## References (read first)

- Contractor spec: `docs/integrations/STACKED.md`
- OpenAPI: https://api.stacked.com/external-service/openapi.json
- Fanvue OAuth pattern in: `src/app/api/integrations/[provider]/connect|callback`

## Tasks

- [ ] Add `STACKED_*` env vars to `src/lib/env.ts` (base URL, client id/secret, redirect URI)
- [ ] Implement Stacked OAuth connect + callback (PKCE S256, same pattern as Fanvue) **or** per-workspace API key connect if we choose `stk_live_` path first
- [ ] Encrypted token storage on `IntegrationConnection`; set `PLATFORM_CONNECTORS` Stacked status to `live` when server config present
- [ ] Smoke test helper: `GET /external-service/v1/creators` after connect (no keys in tests)
- [ ] Update `docs/integrations/STACKED.md` with any implementation notes
- [ ] Integrations UI: actionable errors when creds missing

## Out of scope

- Obtaining Stacked External API approval (Ryan ops issue)

## Acceptance

With test credentials in VPS `.env`, admin can connect Stacked from `/dashboard/integrations` and see at least one creator id from the API.