# Cloudflare Access for crm.omniofm.com

1. DNS: `crm` CNAME to Omni VPS (proxied orange cloud).
2. Zero Trust application: **OmniOFM CRM**, hostname `crm.omniofm.com`.
3. Policy: allow `@suncoastservers.com`, Mark/Umer/Owais emails, plus Ryan personal emails used for ops.
4. Bypass path (optional): none for MVP, staff-only.
5. Origin: nginx TLS or Cloudflare origin cert on `91.99.193.212`.

After Access is live, set `APP_BASE_URL=https://crm.omniofm.com` in production `.env`.