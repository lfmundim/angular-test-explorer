# AGENTS

## Repository Purpose
This repository maintains sequential prompt packs used to build a VS Code Angular test extension focused on Testing API integration and Angular CLI execution.

## Core Idea Constraints
- Keep prompts sequential and cumulative.
- Keep instructions deterministic, explicit, and minimal.
- Favor Angular CLI execution behavior over generic test runner assumptions.
- Preserve monorepo compatibility.
- Avoid feature bloat and heavy dependencies unless required.

## Authoring Rules
- `00-common.md` is the shared baseline for all numbered prompts.
- Numbered prompts should only introduce incremental scope relative to prior steps.
- Do not duplicate large sections across files; reference shared constraints conceptually.
- If a new requirement affects multiple steps, update `00-common.md` first.

## Documentation Rules
- Any code change that adjusts behavior must update `README.md` with clear "how to use" guidance for the changed behavior.
- The first implementation commit that introduces runnable extension behavior must add a `How to Use` section in `README.md`.
- Keep usage docs concise, task-oriented, and consistent with current behavior.

## Changelog Rules
- Maintain `CHANGELOG.md` for every change that is relevant to users or contributors.
- For each entry, explain what changed and why in concise terms.
- Do not add excessive internal detail; focus on externally meaningful impact.

## Versioning Rules
- Use Nerdbank.GitVersioning (`version.json`) for semantic versioning from git history.
- Current baseline is `0.1.Y`, where:
  - `0` is major while the project is pre-1.0.
  - `1` is the current prompt milestone counter (`X`).
  - `Y` is git height as computed by GitVersioning.
- Increment minor (`X`) by `+1` when a new prompt milestone is cleared.

## Quality Rules
- Prompts must be actionable and testable.
- Prefer concrete inputs/outputs over broad guidance.
- Include error-handling expectations where relevant.
- Keep each prompt short enough to remain easy to execute by coding agents.
- For code changes, add automated tests for all behavior that is reasonably unit/integration testable in-repo.
- If a testable behavior is intentionally left without tests, document the reason in the change notes or PR description.

## Change Management
- Make small, focused commits.
- Keep commit messages specific to one concern.
- Update documentation and templates when workflow expectations change.

## Out Of Scope
- Marketing-heavy branding or design-first work.
- Non-Angular test runner architecture.
- UI-centric features unrelated to VS Code Test Explorer integration.
