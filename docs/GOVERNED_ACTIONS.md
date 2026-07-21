# Governed Customer Actions

The customer portal is **read + report** first (see `docs/PERSONAS_AND_PROJECTS.md`
and `docs/CUSTOMER_DASHBOARD.md`). This increment adds the narrow, governed
exception: a small set of role-gated actions the enterprise takes on its own
behalf — **without ever editing canonical facts**.

## The principle

A governed action records a **decision**, not an edit. When a customer signs an
LOA or accepts a risk, the platform writes a `CustomerDecision` — an
approval/input record — that flows to the consultant for **reconciliation**. The
canonical authorization, risk, and score are unchanged until the consultant
reconciles. This mirrors the operating model: enterprise users *provide data,
approve scope, sign authorization, review findings, and accept risk*; consultancy
users operate the registry and publish. Carrier/enterprise responses never
directly alter published facts without consultant reconciliation.

A governed decision is **not a legal-compliance instrument** and does not certify
anything about live operational condition.

## Roles (who can act)

Persona `customer` carries an **enterprise role** (`CustomerRole`, a subset of
the engagement roles): Sponsor, Approver, Contributor, Reviewer. Capabilities are
derived in `src/application/persona.ts`:

| Role                    | `canApprove` | `canContribute` | Sees queue |
| ----------------------- | :----------: | :-------------: | :--------: |
| Sponsor                 |      ✓       |        ✓        |     ✓      |
| Approver                |      ✓       |        ✓        |     ✓      |
| Contributor             |              |        ✓        |  ✓ (read)  |
| Reviewer (read-only)    |              |                 |            |

- **Sponsor / Approver** — sign LOAs, accept/decline risk.
- **Contributor** — sees the queue read-only ("awaiting approver"); will respond
  to data-gap requests in a later increment.
- **Reviewer** — pure read; no governed panel at all.

The role is a per-viewer preview control in **Administration → View as → customer**
until sign-in derives it from the engagement member record.

## The queue

`buildPendingApprovals` (`src/domain/governance.ts`) assembles the current
engagement's queue:

- **LOAs awaiting signature** — authorizations with status
  `pending-enterprise-signature` → item id `loa:${authId}`.
- **Open high/critical risks** — a site risk with `status: "open"` and severity
  `high`/`critical` → item id `risk:${siteId}:${riskId}`. Capped (`riskLimit`,
  default 6) so the leadership queue stays legible.

Each item carries the customer's own submitted decision (if any), so the panel
can show an "awaiting reconciliation" state and allow a **revise** before the
consultant reconciles.

## Where it appears

A single **"Actions required"** panel on the Customer Dashboard
(`src/features/dashboard/ActionsRequiredPanel.tsx`), shown only to customer
personas with `canApprove || canContribute` and only when the queue is non-empty.
The consultant Dashboard render is unchanged (the panel returns `null`). It never
touches the locked Site Inventory, hero, top-nav, or sidebar.

## Data & persistence

- `CustomerDecision` records live in their own `customerDecisions` collection on
  the dataset (schema **v5**; migration adds the empty collection to older
  installs — decisions are authored at runtime, never seeded).
- `submitCustomerDecision` (registry context) writes one decision per item
  (replacing a prior decision for the same item, so a customer can revise) with
  `reconciliationState: "pending-reconciliation"`. Canonical authorizations and
  risks are untouched.

## Consultant reconciliation (the operator half)

A decision only reaches canonical state when the **consultant reconciles** it —
the operator counterpart of the customer's "Actions required" panel.

- **Queue** — `buildReconciliationQueue` (`src/domain/governance.ts`) lists the
  current engagement's decisions still in `pending-reconciliation`, each resolved
  to a readable title and its **canonical effect**.
- **Effect** — `resolveDecisionEffect` is the single source of truth for what a
  reconcile applies:
  - `loa-signature` + `approved` → authorization status → **active** (stamps an
    effective date if missing).
  - `risk-acceptance` + `accepted` → site risk status → **accepted** (and the
    cached open-risk count is recomputed).
  - any **declined** outcome → `kind: "none"` — acknowledge-only, **no canonical
    change** (the LOA stays pending, the risk stays open).
- **Where it appears** — a **"Reconciliation queue"** panel on the Dashboard
  (`src/features/dashboard/ReconciliationPanel.tsx`), shown only to the consultant
  (`capabilities.canOperate`) and only when the queue is non-empty. The customer
  never sees it; the read-only leadership Dashboard is otherwise unchanged.
- **`reconcileDecision`** (registry context) applies the effect, flips the
  decision to `reconciled`, and writes an **audit** event
  (`action: "decision-reconciled"`, `source: "reconciliation"`) recording the
  before/after canonical status. Once reconciled, the item drops off both the
  consultant's queue and (for approvals) the customer's pending list; the
  customer's panel shows "reconciled by consultant".

Accepting a risk **does not improve the technical score** or erase the underlying
gap (domain rule); reconciliation only changes the risk's state.

## Boundaries

- No operator tools for customers (still gated by `canOperate`).
- Customers never edit canonical sites, LOAs, risks, or scores — only the
  consultant's reconcile applies a decision to canonical state.
- No live/operational or legal-compliance semantics.
