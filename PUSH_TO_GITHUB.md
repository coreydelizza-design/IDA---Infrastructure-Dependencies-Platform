# Publish this complete repository

## Simplest method: GitHub Desktop

The distributed ZIP is initialized as a local Git repository with a clean baseline commit and no remote.

1. Extract the ZIP.
2. Open GitHub Desktop.
3. Select **File → Add Local Repository**.
4. Select the extracted folder containing `package.json`.
5. Click **Publish repository**.
6. Use the repository name `IDA-Infrastructure-Dependency-Assurance`.
7. Keep the repository private during development.

That publishes the complete source tree, approved visual reference, card imagery, tests, prompts, database schema, API contract, and GitHub workflows in one operation.

## Command-line alternative

From the extracted folder:

```bash
git remote add origin <YOUR_NEW_GITHUB_REPOSITORY_URL>
git push -u origin main
```

## After publication

Confirm the GitHub repository root contains:

```text
.github/
contracts/
database/
docs/
prompts/
public/
scripts/
src/
tests/
00_START_HERE.md
AGENTS.md
CODEX_HANDOFF.md
package.json
```

Then authorize that repository for Codex and use `CODEX_FIRST_TASK.md`.
