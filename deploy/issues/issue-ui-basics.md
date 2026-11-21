## Summary

Design and implement a **simple, role-first UI** for OmniOFM CRM. Study how lean agency CRMs (Fanvue QC, Telestars-style ops tools, generic chatter dashboards) present day-one workflows, then reduce our current Next dashboards to the minimum paths chatters, QC, creators, and admins need.

## Goals

- New user understands their job in **under 60 seconds** (role landing after login)
- Reduce visual noise: one primary action per role (chatter → inbox/shift, QC → verify, creator → metrics, admin → integrations/team)
- Mobile-tolerant layouts for chatter focus mode
- Consistent OmniOFM branding (dark/light), accessible contrast

## Research (before pixels)

- [ ] Screenshot / note 3–5 reference products (competitor CRMs, Fanvue dashboard, internal QC)
- [ ] Map current routes: `/dashboard/chatter`, `/qc`, `/creator`, `/admin`, `/integrations`
- [ ] List **must-have v1** screens vs defer

## Deliverables

- [ ] UX wireframes or Figma-lite (markdown + component list OK)
- [ ] Simplified nav shell shared across role pages
- [ ] Empty states with next-step copy (connect Fanvue, start shift, etc.)
- [ ] Document in `docs/UI-GUIDE.md`

## Out of scope

- Full design system rewrite
- OnlyFans/Stacked connect flows (separate integration issues)

## Acceptance

Umer or Owais demos each role path on **staging** (`crm-dev.omniofm.com`) with no dead-end pages for primary tasks.