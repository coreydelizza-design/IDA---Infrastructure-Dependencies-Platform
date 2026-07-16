# Codex Prompt and Continuation Sequence

Codex automatically reads the root `AGENTS.md`. The existing prototype is already implemented, so **do not blindly rerun the build prompts as greenfield work**.

## Start here

1. Read `AGENTS.md`.
2. Read and execute the baseline-audit instructions in `CODEX_HANDOFF.md`.
3. Keep `prompts/00_MASTER_AGENT_CONTRACT.md` in force for every task.
4. Use the relevant numbered prompt as the acceptance specification for the requested phase.

## Phase specifications

1. `prompts/01_REPOSITORY_AND_VISUAL_BASELINE.md` — implemented baseline; validate and patch only.
2. `prompts/02_SITE_INVENTORY_INTERACTIONS.md` — implemented baseline; validate and patch only.
3. `prompts/03_DOMAIN_AND_SCORING.md` — partially implemented; close remaining tests and domain gaps.
4. `prompts/04_LOA_AND_CARRIER_WORKSPACE.md` — prototype implemented; production authorization remains.
5. `prompts/05_DATABASE_API_AND_TENANCY.md` — next major platform phase.
6. `prompts/06_DEPENDENCIES_RISK_AND_EVIDENCE.md` — follows authenticated persistence.
7. `prompts/07_REQUIREMENT_MAPPING.md` — follows neutral control/evidence services.
8. `prompts/08_ENTERPRISE_HARDENING_AND_DEPLOYMENT.md` — final productionization phase.

Do not begin a later phase until the relevant earlier acceptance gates pass. Backend work may not destabilize the canonical visual baseline.
