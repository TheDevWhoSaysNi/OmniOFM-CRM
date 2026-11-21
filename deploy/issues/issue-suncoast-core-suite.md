## Summary

**Future** full integration between OmniOFM CRM and **SuncoastServersCore** suite (Twenty CRM, n8n, Kimai, site lead intake). Not fully attainable until Core workflows are ready. This issue tracks the **contract, milestones, and CRM hooks** already in repo.

## References

- `SuncoastServersCore/docs/integration-contracts.md` (section 6 `omniofm-crm-holdco`, Kimai → sheet, Twenty API)
- `SuncoastServersCore/docs/site-lead-inventory.md` (omniofm.com client signup → CRM TODO)
- CRM: `HoldcoEventOutbox`, `POST /api/cron/holdco-flush`, `HQ_SHARED_SECRET` + `src/lib/hq/client.ts`, `POST /api/verify/shift`
- Holdco doc: `docs/holdco-webhooks.md`

## Milestones

### M1 — Already in CRM (verify on staging)

- [ ] HQ hours pull (`/api/hq/sync-hours`, omniofm.com `api/crm/hours.php`)
- [ ] Shift verify API for QC (`/api/verify/shift`)
- [ ] Holdco outbox + cron flush (needs `HOLDOC_N8N_WEBHOOK_URL` + secret on Core n8n)

### M2 — Site / client signup (blocked on Core + PHP hook)

- [ ] omniofm.com chatting intake posts lead to CRM or n8n (`businessLine: omniofm`)
- [ ] CRM workspace provisioning from approved client signup
- [ ] No raw chat/QC DB in Twenty (aggregate only)

### M3 — Chatter hours suite-wide

- [ ] Kimai or CRM shift truth → billing sheet (integration-contracts §5)
- [ ] Single chatter identity across Kimai, CRM `ShiftSession`, HQ sheet
- [ ] Cloudflare Access alignment (`crm.suncoastservers.com` vs `crm.omniofm.com` roles)

### M4 — Unified holdco reporting

- [ ] n8n workflow `omniofm-crm-holdco` deployed on Core
- [ ] Twenty custom fields for monthly gross, workspace metadata
- [ ] Discord / ops notifications optional

## Tasks for contractors

- [ ] Expand `docs/CORE-INTEGRATION.md` in this repo with sequence diagrams
- [ ] Feature flags: `HOLDOC_*` unset = graceful no-op in UI
- [ ] Webhook retry + idempotency tests for holdco flush
- [ ] Document Core VPS reachability from Omni VPS (webhooks, not Postgres bridge)

## Ryan / Core owner

- Prioritize site-lead-inventory row for omniofm.com `/chatting` intake
- n8n workflow creation on `178.104.115.88`
- Twenty field map frozen per `twenty-admin-checklist.md`

## Acceptance

M1 verified on staging; M2–M4 documented with explicit blockers until Core ships workflows.