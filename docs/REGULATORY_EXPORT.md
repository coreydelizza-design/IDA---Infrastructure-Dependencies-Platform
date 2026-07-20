# Regulatory Export

Generates a **point-in-time control-to-requirement mapping** package for a
framework — **DORA**, **ICT (EU)**, **NIS2**, or **ISO 22301**. It is a
**mapping, not a legal-compliance determination**: a site score never implies
legal compliance (see AGENTS.md), and every package carries an explicit
disclaimer.

## Domain (`src/domain/regulatoryExport.ts`)

- `REQUIREMENTS` — a per-framework requirement catalog, each requirement mapped
  to neutral control categories (connectivity, power, facility, environment,
  security, workforce, cyber, recovery).
- `buildRegulatoryExport(input)` — for each site, evaluates every requirement
  from the site's control-category outcomes:
  - all mapped categories N/A → **not-applicable**;
  - any mapped control failed → **gap**;
  - a mapped category unassessed → **unknown**;
  - otherwise → **mapped**.
  Assembles a package with a portfolio summary (average assurance, publishable vs
  provisional sites, requirement gaps) and the `EXPORT_DISCLAIMER`.
- Serializers: `serializeExportMarkdown` (human-readable report with the
  disclaimer + per-site requirement tables), `serializeExportJson` (structured),
  `serializeExportCsv` (site × requirement matrix).

## Application (`src/application/useRegulatoryExport.ts`)

Assembles `ExportSiteInput`s from the current engagement's sites and their stored
control results (mapping each control result to its neutral category), builds the
package, writes an audit event, and provides Markdown / JSON / CSV downloads.

## UI

Route: **Reports → Regulatory Export** (`src/features/reports/RegulatoryExportPage.tsx`).
Pick a framework, generate, and review: a prominent disclaimer banner, a summary
KPI strip, per-site requirement mapping tables, and Markdown / JSON / CSV
download buttons. The locked Site Inventory hero is untouched (secondary
workspace, inherits the approved tokens).

## Governance

- The package is explicitly a **mapping**, not legal compliance.
- Provisional (not-yet-published) sites are counted separately so a provisional
  assessment is never presented as a compliance result.
- The mapping is **point-in-time** — it reflects the registry at generation time.

## Tests

`src/domain/regulatoryExport.test.ts` — requirement mapping, gap detection,
not-applicable handling, provisional counting, per-framework catalogs, and the
three serializers (JSON round-trip, CSV shape, Markdown disclaimer + table).

## Not in this phase

Persisted export history, framework catalogs beyond the illustrative subset, and
signed/official export formats. The concrete Supabase wiring for stored exports
is a follow-up (this phase generates and downloads on demand and audits each
generation).
