# Resilience Scoring Model

## Core principle

Score a site against its **approved archetype and criticality**, not against a universal assumption that every location must be dual-carrier and fully redundant.

A microbranch, kiosk, home office, cloud region, factory, data center, and trading floor have different acceptable designs.

## Separate facts

The platform maintains these independently:

1. **Technical health** — what controls are actually satisfied.
2. **Design conformance** — whether the site meets its approved archetype.
3. **Evidence confidence** — how well the conclusion is supported.
4. **Risk status** — whether a gap is open, accepted, remediating, or closed.
5. **Requirement mapping** — which external requirements map to the control.

Never increase technical health because a risk was accepted. Never reduce health merely because a valid archetype intentionally uses a single path.

## Single-site acceptable

A connectivity-diversity control becomes `not-applicable` for scoring only when all are true:

- the archetype allows an approved single-site pattern;
- the specific site has that approval;
- approval identity, rationale, scope, and expiry are recorded;
- compensating controls are represented where required.

The UI uses a blue informational state, not green proof of physical diversity.

## Calculation

Each versioned profile contains weighted controls and critical caps.

```text
raw_score = earned_weight / applicable_weight × 100
final_score = min(raw_score, any triggered critical cap)
```

Control factors in the prototype:

- pass: 1.00
- partial: 0.55
- fail: 0.00
- not applicable: 1.00 for normalized applicable-weight calculation

Production profiles should store the exact algorithm version and inputs so every score snapshot can be reproduced.

## Bands

Prototype bands:

- Excellent: 85–100
- Good: 70–84
- At Risk: 40–69
- Critical: 0–39

The reference summary labels use 90–100 and 70–89. That visible portfolio labeling is intentionally preserved from the render; production governance must reconcile display bands and scoring bands before launch.

## Immutable snapshot

Every score run stores:

- tenant and site;
- profile ID and version;
- control results and weights;
- evidence IDs and freshness;
- exception/approval IDs;
- triggered caps;
- final score and band;
- algorithm version;
- actor and timestamp.

Do not overwrite prior snapshots.
