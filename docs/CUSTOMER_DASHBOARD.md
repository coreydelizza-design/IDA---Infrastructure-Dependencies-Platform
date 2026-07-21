# Customer Dashboard

Increment 2 of the operating-model restructure. Turns the placeholder `dashboard`
route into the **customer's home**: a read-only, point-in-time, leadership-facing
summary scoped to the engagement and branded to the enterprise.

## Behaviour

- **Customers land here** (`useRegistryState` picks `dashboard` for the customer
  persona); consultants can also open it from the sidebar (Overview → Dashboard).
- **Read-only** — no operator actions. Two navigation shortcuts (Site registry,
  Reports) only.
- **Branded + scoped** — the header shows the resolved brand name, the current
  engagement name/code, and its lifecycle status.

## What it shows

`src/domain/dashboard.ts` — `buildDashboard(siteRecords)` computes a point-in-time
summary from the engagement's assessed registry:

- **KPI row** — portfolio assurance (average + band), sites assessed / countries,
  publishable vs provisional, average evidence confidence + coverage, open
  critical/high risks + total open.
- **Assurance distribution** — a status-coloured stacked bar + legend across the
  four bands (Excellent / Good / At Risk / Critical), aligned to the app's
  green→amber→red band semantics.
- **Sites needing attention** — the worst-band-first shortlist (at-risk/critical
  or open risks), each linking into the read-only site registry.

`src/features/dashboard/DashboardPage.tsx` renders it; all styling is token-driven
(adapts to the light theme).

## Semantics

Everything is **point-in-time architecture assurance** — documented, evidenced
architecture at a moment, never a live/operational reading, and never a
legal-compliance certification (footnote on the page; see AGENTS.md). Numbers are
computed from the actual assessed registry, so they are self-consistent with the
site inventory rather than a hardcoded headline.

## Tests

`src/domain/dashboard.test.ts` — aggregation (counts, countries, band
distribution), average assurance + band, publishable/provisional split,
critical-risk counting, attention ordering, and the empty-registry case.

## Not in this increment

Trend/history (point-in-time only), per-report generation from the dashboard
(links to the Reports workspace), and the customer's governed actions
(approvals / risk acceptance), which arrive with access enforcement.
