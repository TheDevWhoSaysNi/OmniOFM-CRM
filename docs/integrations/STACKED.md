# Stacked integration (readiness)

## Official references

- UI docs: https://www.stacked.com/developer/api-docs?lang=en
- OpenAPI: https://api.stacked.com/external-service/openapi.json
- Base URL: `https://api.stacked.com`
- External path prefix: `/external-service/v1/...`

## Auth (pick one per workspace)

| Mode | Credential | Header | Notes |
|------|------------|--------|--------|
| API key | `stk_live_...` | `Authorization: Bearer ...` | Requires External API approval on account |
| Connect Stacked (OAuth 2.0) | `client_id` + `client_secret` (generated in dashboard) | Same bearer after token exchange | **PKCE S256 required**; token prefix `stk_at_...` |

OAuth authorize: `https://stacked.com/oauth/authorize`  
Token: `https://api.stacked.com/external-service/v1/oauth/token`

Scopes include: `chat:read`, `chat:write`, `insights:read`, `members:read`, `ppv:send`, `webhooks:manage`, etc. (see OpenAPI `oauth2.flows`).

## CRM env (when wired)

```bash
STACKED_API_BASE_URL=https://api.stacked.com
STACKED_CLIENT_ID=
STACKED_CLIENT_SECRET=
STACKED_REDIRECT_URI=https://crm.omniofm.com/api/integrations/stacked/callback
```

Agency API keys may alternatively be stored encrypted per workspace (like Telegram bot token).

## Code today

- `IntegrationProvider.STACKED` in Prisma
- `PLATFORM_CONNECTORS` → status `coming_soon`, connect path `/api/integrations/stacked/connect` (not implemented)
- `COMING_SOON_PLATFORMS` includes `stacked`

## Acceptance (issue)

1. Document env vars in `.env.example` and `INTEGRATIONS-SETUP.md` (OAuth path aligned with Fanvue PKCE).
2. Implement `/api/integrations/stacked/connect` + `callback` (or API-key POST like Telegram).
3. `GET /external-service/v1/creators` smoke test after connect; store tokens encrypted.
4. Optional: webhook portal subscription for message events.
5. Integrations UI: enable Connect when server config present; clear error when keys missing.

No production keys until Ryan completes External API approval (see parent ops issue).