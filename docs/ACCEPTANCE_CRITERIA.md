# Acceptance Criteria

## Visual

- Canonical 1672 × 941 screenshot test passes.
- All eight site cards and Add Site card are visible.
- London is selected.
- Three grid columns, summary strip, detail pane, and footer are visible.
- No screenshot is used as a background.
- No body scrollbar is present.
- No default component-library styling is visible.

## Interaction

- Search filters name, code, location, type, carrier, and tags.
- Type, location, country, and health filters work.
- Grid/list switching works.
- Site selection updates the detail pane and URL.
- Favorite, close, detail tabs, LOA View, and Carrier View work.
- Add Site validates required fields and creates a record.

## Scoring

- Score uses a versioned profile.
- Approved single-site design creates no artificial diversity penalty.
- Risk acceptance does not erase the technical gap.
- Evidence confidence is separate from health.
- Score snapshots can be reproduced from stored inputs.

## LOA and carrier workflow

- LOA status, scope, dates, actions, and covered sites are represented.
- Expired/revoked LOA blocks new production carrier requests.
- Carrier users receive explicit least-privilege scope.
- Requests, responses, evidence, and material actions are versioned/audited.

## Scale and security

- Tenant isolation is enforced server-side and database-side in production.
- Registry queries use cursor pagination.
- Imports are asynchronous, validated, retryable, and idempotent.
- Portfolio summaries use server read models.
- Typecheck, unit, build, E2E, and visual tests pass.
