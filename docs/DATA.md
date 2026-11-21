# Data model and tenant isolation

## Workspaces

- `AGENCY`: Fanvue agency OAuth, multiple creators, chatter assignments.
- `CREATOR`: Solo creator OAuth, single-roster UX.

Each workspace has its own Postgres rows. No cross-workspace queries in app code except platform super-admin routes.

## Fanvue data paths

| Mode | When | Source |
|------|------|--------|
| QC bridge | `useQcDataBridge=true` (Omni default) | fanvue-agency-qc `/api/crm/*` with service token |
| CRM poller | External agencies, `FANVUE_SYNC_ENABLED=true` | CRM Fanvue OAuth + `syncFanvueCreatorsForWorkspace` |

Do not enable both poller and bridge for the same workspace.

## Holdco

CRM writes `HoldcoEventOutbox` rows. Cron `POST /api/cron/holdco-flush` pushes aggregates to n8n (no PII, no chat bodies). See [holdco-webhooks.md](holdco-webhooks.md).