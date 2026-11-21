# OnlyFans integration (readiness)

## Reality check

OnlyFans does **not** ship a public Fanvue-style Builder OAuth for agencies. The CRM already has:

- Env placeholders in `.env.example` (`ONLYFANS_CLIENT_*`, redirect, webhook secret)
- `ONLYFANS` in `IntegrationProvider` and integrations UI shell
- `getOAuthConfig("onlyfans")` stub with `read:messages` default scope
- Connect route returns not configured until env is set

## What “ready” means before keys exist

1. **Research doc** (this file + issue comments): document whichever path Omni will use:
   - Official/partner API (if Stacked-style credentials appear)
   - Approved vendor (e.g. existing agency tooling APIs)
   - Internal bridge (separate service; CRM never stores raw session cookies in git)

2. **Interface parity with Fanvue** (target):
   - OAuth or API-key connect flow per workspace
   - Encrypted token storage on `IntegrationConnection` / `PlatformAccount`
   - Metrics sync job (read-only) and optional inbox when write scope exists
   - Webhook ingress at `/api/webhooks/onlyfans` with signature verification

3. **Do not** commit credentials or scrape-based session dumps.

## CRM env (placeholder)

```bash
ONLYFANS_CLIENT_ID=
ONLYFANS_CLIENT_SECRET=
ONLYFANS_REDIRECT_URI=https://crm.omniofm.com/api/integrations/onlyfans/callback
ONLYFANS_WEBHOOK_SECRET=
```

## Acceptance (issue)

1. Finalize integration contract in `docs/integrations/ONLYFANS.md` once Ryan confirms vendor/API path.
2. Implement connect/callback **or** document why blocked and ship feature-flagged stub that fails with actionable admin message.
3. Prisma/metadata fields for external creator id mapping.
4. UI: keep “coming soon” until `ONLYFANS_CLIENT_ID` set; then enable Connect.

Blocked on Ryan: pick OF data path and obtain credentials (see ops issue).