# Site Inventory Interactions

Two additive interactions on the locked Site Inventory that improve triage and
give the card grid more room — both preserve the approved baseline (the default,
static render is byte-identical; verified with a pixel diff).

## A. Risk peek (hover / focus)

Hovering or focusing a card's **"N Open risks"** chip projects a popover listing
the site's open risks (severity dot · title · control), so a consultant can
triage which sites need attention without opening the full inspector.

- `src/components/RiskPeek.tsx` — the chip becomes a focusable trigger; the
  popover is rendered in a **portal** to `document.body` and fixed-positioned
  from the trigger's rect, so it escapes the card's `overflow: hidden` and CSS
  context and projects cleanly over the grid. A short close delay + hover bridge
  keeps it open while the pointer moves between trigger and popover.
- Shows the top 6 risks by severity (critical → low), with a "+N more" affordance
  and an Escape-to-close / blur-to-close path.
- **Transient** — the popover only exists while hovering/focused, so the static
  baseline render is unchanged. The trigger renders the exact same text/markup as
  the previous static chip.
- Only rendered when the card advertises open risks; "No open risks" cards are
  untouched.

## B. Inspector layout — Docked (default) / Overlay (opt-in)

`src/application/inspectorLayout.ts` — a per-viewer preference (`localStorage`
`ida.inspectorLayout`, default `docked`), toggled at **Administration → Site
inventory layout**.

- **Docked** (default) — the locked behavior: the inspector docks beside the grid
  in its 480px column and the grid holds its canonical three-column, 858px width.
  This is the approved baseline and is unchanged.
- **Overlay** — the grid's locked 858px frame is released so it uses the **full
  width** (`repeat(auto-fill, minmax(262px, 1fr))` → more columns of full-size
  cards instead of the compressed three), and the inspector **floats** over the
  rightmost cards. Those cards return to view when the inspector closes. Opening a
  site never compresses the grid.

Implemented purely as `.workspace.overlay-inspector` CSS overrides (App.tsx adds
the class only when the preference is overlay and the inspector is open), so
docked output is untouched.

## Lock compliance

- The Site Inventory hero is locked (`docs/UI_LOCK.md`). Both features are
  **additive and opt-in / transient**: the default docked, no-hover render is
  **pixel-identical** to the baseline (verified). No new controls were added to
  the locked hero — the layout toggle lives in Administration, the risk peek is a
  hover/focus overlay.
- All popover/overlay styling is token-driven (adapts to light theme); no
  hardcoded colors.

## Not in this change

A center "focus/projection" mode (considered and explicitly excluded), risk peek
on the list-view rows, and touch long-press for the peek (hover + keyboard focus
today).
