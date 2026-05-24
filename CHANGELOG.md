# Changelog

All notable changes to this repository are documented here.

## [Unreleased]

### Added
- Step 01 extension scaffold with a TypeScript-only VS Code Testing API integration:
  - `package.json` activation events and commands for Testing view usage
  - `src/extension.ts` with `TestController` bootstrap and a `**/*.spec.ts` discovery flow
  - basic run profile support for running selected or all discovered spec items
- Unit tests for command target resolution and requested test collection behavior in `src/core/testSelection.ts`.
- Explicit quality rule in `AGENTS.md` requiring automated tests for testable code behavior.

### Changed
- `README.md` now includes a `How to Use` section for the first runnable extension behavior, including setup and Testing view workflow.
- `version.json` minor milestone advanced from `0.1` to `0.2` after clearing prompt milestone 01.

## [0.1.0] - 2026-05-24
### Added
- Core repository documentation: `README.md`, `CONTRIBUTING.md`, and `AGENTS.md` to define project intent and contribution workflow.
- GitHub issue templates for bug reports and feature requests to standardize incoming changes.
- CI workflow for markdown linting, required file checks, and link validation to keep docs quality stable.
- MIT license file and repository-level ignore rules for common extension/prompt-pack artifacts.

### Changed
- `README.md` refined to keep scope and goals concise, removing internal prompt-pack references and redundant stack statements.
