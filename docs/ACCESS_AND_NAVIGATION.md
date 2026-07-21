# Access Enforcement & Navigation

Increment 4 of the operating-model restructure: enforce the customer's read-only
boundary end-to-end and make the not-yet-built workspaces read as intentional.

## Read-only enforcement (customer)

The customer persona is **read + report** (see `docs/PERSONAS_AND_PROJECTS.md`).
Operator affordances are hidden when `!capabilities.canOperate`:

- **Add Site** — hidden in the Site Inventory toolbar and grid (increment 1).
- **Detail-pane operator menu** — the site inspector's action menu (Run
  Assessment / Edit / Duplicate / Mark Review Complete / Archive) is hidden;
  customers keep view-only controls (favourite, close, tabs). `DetailPane` gains
  a `canOperate` prop (default `true`, so the consultant view is unchanged).
- **New contract** — hidden in the Contracts repository (increment 3).

Governed customer actions (approvals, LOA signing, risk acceptance) that write to
*approval/input* records — never canonical facts — remain a follow-up; the
capability model (`persona.ts`) is structured to add them by engagement role.

## Placeholder ("planned") workspaces

The locked Site Inventory includes the full sidebar/top navigation, so nav items
**cannot be removed** without a product-owner-approved change to the visual lock.
Instead, the routes that aren't built yet now render an intentional **"planned
workspace"** state (`PlaceholderPage`): a clear message and a **Back to
{Project Inventory | Dashboard}** button (persona home), rather than an empty
room. This keeps the navigation feeling coherent without touching the locked
header/rail.

> Actually pruning the locked navigation (removing the ~10 placeholder items)
> requires an explicit lock amendment and is deliberately **not** done here.

## Lock compliance

- The consultant (default) Site Inventory and detail pane are unchanged — the
  `canOperate` gate only removes controls for the customer persona, and the
  placeholder change affects only the placeholder routes, never the locked hero.
