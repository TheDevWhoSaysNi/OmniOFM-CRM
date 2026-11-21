# CRM to holdco (n8n) payloads

Header: `X-Webhook-Secret: $HOLDOC_WEBHOOK_SECRET`

## workspace.signup

```json
{
  "eventType": "workspace.signup",
  "workspaceId": "cuid",
  "payload": {
    "workspaceName": "OmniOFM",
    "kind": "AGENCY",
    "adminEmail": "admin@example.com"
  },
  "emittedAt": "2026-03-22T00:00:00.000Z"
}
```

## workspace.monthly_gross (future cron)

```json
{
  "eventType": "workspace.monthly_gross",
  "workspaceId": "cuid",
  "payload": {
    "month": "2026-03",
    "grossCents": 123456,
    "businessLine": "omniofm"
  }
}
```

n8n should map to Twenty company/deal notes only, not import chat warehouse data.