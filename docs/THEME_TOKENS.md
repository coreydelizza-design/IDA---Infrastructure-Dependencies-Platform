# Theme Tokens

The stylesheet is fully **token-driven**: every color in `src/styles/app.css` is a
`var(--token)` reference, and all token values live in `src/styles/tokens.css`.
This is the foundation for a future light theme (dark stays the locked default;
light layers on as an opt-in alternate — see below).

## Why

Before this migration, `app.css` carried ~231 hardcoded color literals (134 hex,
97 `rgba()`) alongside the tokens — roughly half the paint bypassed the token
system. A theme could not be applied consistently without a patchwork of
un-themable islands. Phase A lifted **every** literal into a token.

## Phase A — token migration (this change)

- **Zero visual change.** Each new token holds the **exact** value it replaced,
  so the dark render is byte-identical. Verified with an automated pixel diff
  (pure-Node PNG decoder) across the Site Inventory hero, Reports, Requirements,
  Administration, a placeholder page, and the intake wizard: **0 changed pixels**
  on every surface.
- **0 hardcoded colors remain** in `app.css` (was 231).
- **New tokens** added to `tokens.css`, grouped by role:
  - `--navy-*` / `--steel-*` — dark surfaces and lines.
  - `--ink-*` — text (light grays / blue-grays).
  - `--blue-*` — accents.
  - `--green-* / --lime-* / --amber-* / --red-* / --purple-*` — status.
  - `--ov-navy-* / --scrim-*` — dark overlay & shadow fills (alpha).
  - `--tint-*-*` — status wash backgrounds (alpha).
- The pre-existing scale tokens (`--navy-975…650`, `--ink-000…600`, `--border-*`,
  status) are unchanged; literals that exactly matched them now reuse them.

Token **names** are role-oriented so a theme can override by family. Values are
exact; naming is cosmetic at this stage.

## Phase B — light theme (next)

Dark remains the canonical, first-load theme, so the locked baseline (see
`docs/UI_LOCK.md`) is preserved. Light is an **opt-in alternate**:

- Add a `:root[data-theme="light"]` block in `tokens.css` that overrides the
  token **values** (surfaces → light, ink → dark text, tints/scrims retuned for
  contrast, status colors darkened to stay legible on light). No `app.css`
  changes are needed — it already references tokens only.
- A theme toggle sets `data-theme` on the root and persists the preference.
- `color-scheme` is switched with the theme.

Because Phase A made `app.css` 100% token-driven, Phase B is purely additive:
new token values + a toggle, with the dark baseline untouched.

## Guardrails

- **Do not reintroduce hardcoded colors** in `app.css`. Add or reuse a token.
- The **dark values are locked** — changing a dark token value changes the
  approved baseline and requires product-owner approval (same rule as the visual
  contract in `AGENTS.md`).
