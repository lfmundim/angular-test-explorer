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

## Quality Rules
- Prompts must be actionable and testable.
- Prefer concrete inputs/outputs over broad guidance.
- Include error-handling expectations where relevant.
- Keep each prompt short enough to remain easy to execute by coding agents.

## Change Management
- Make small, focused commits.
- Keep commit messages specific to one concern.
- Update documentation and templates when workflow expectations change.

## Out Of Scope
- Marketing-heavy branding or design-first work.
- Non-Angular test runner architecture.
- UI-centric features unrelated to VS Code Test Explorer integration.
