# Visual Gap Report

## Baseline

- Reference: `docs/reference-site-inventory.png`
- Implementation: `tests/e2e/site-inventory.spec.ts-snapshots/site-inventory-linux.png`
- Viewport: 1672 × 941, DPR 1

## Locked geometry implemented

- 51 px top bar
- 204 px left navigation
- 850 px workspace
- 500 px right detail column
- 480 px inset detail pane
- 858 × 593 px three-column site grid
- 82 px portfolio summary strip
- 40 px footer
- no body scrollbar

## Known variance

The original reference is an AI-generated render rather than a source design file. Exact source photography, vector icons, font rasterization, and some internally inconsistent labels cannot be recovered pixel-for-pixel. The prototype therefore uses:

- local image crops derived from the approved render for visual continuity;
- Lucide outline icons in place of non-source vector artwork;
- system-installed Inter font rasterization;
- DOM text and controls at the same composition and density.

The screen structure, hierarchy, labels, seeded state, card order, score states, detail-pane organization, and dark navy design system are locked. Remaining differences are asset-level rather than layout redesign.
