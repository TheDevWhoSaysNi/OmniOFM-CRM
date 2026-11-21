## Summary

Prepare OmniOFM CRM for **OnlyFans** integration. No public Builder OAuth like Fanvue. No credentials yet. Ship documentation, env contract, and connect/callback or feature-flagged stub with clear admin messaging.

## References

- `docs/integrations/ONLYFANS.md`
- Existing stubs: `getOAuthConfig("onlyfans")`, integrations UI, `.env.example`

## Tasks

- [ ] Confirm integration approach in `ONLYFANS.md` (vendor API vs future official OAuth vs bridge service)
- [ ] Complete server env validation and connect route behavior (fail with explicit “configure ONLYFANS_*” message)
- [ ] Prisma/metadata for external creator mapping if needed
- [ ] Webhook route skeleton at `/api/webhooks/onlyfans` with signature hook (secret from env when set)
- [ ] Document security boundaries (no session cookies in CRM DB without encryption design)

## Out of scope

- Ryan choosing vendor / obtaining OF credentials

## Acceptance

Repo documents the chosen path; UI and API behave predictably with zero credentials; ready to enable when Ryan adds env vars.