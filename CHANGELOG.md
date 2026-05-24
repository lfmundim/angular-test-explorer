# Changelog

All notable changes to this repository are documented here.

## [Unreleased]

### Added
- Step 04 hardening and UX:
  - debounced auto-refresh wiring for `**/*.spec.ts` and `**/angular.json` changes
  - refresh trigger on `angularTestExplorer.*` setting changes
  - new extension settings:
    - `angularTestExplorer.workspacePathOverride`
    - `angularTestExplorer.commandTemplateOverride`
    - `angularTestExplorer.defaultWatchMode`
  - configurable Angular command construction via template placeholders:
    `{workspace}`, `{project}`, `{spec}`, `{watch}`, `{testNamePattern}`
  - improved actionable diagnostics for missing Angular CLI command context
- Step 03 single-test support:
  - best-effort in-file test discovery for `describe` / `it` / `test` using TypeScript AST traversal
  - child test items in the Testing tree for discovered in-file tests
  - single-test Angular CLI command support via `--testNamePattern <fullTestName>`
  - deterministic fallback to file-level execution when `--testNamePattern` is unsupported by current Angular CLI context, with explicit fallback output
- Step 02 Angular CLI runner wiring:
  - Angular workspace detection via `angular.json`
  - spec-to-project mapping from `angular.json` (`root` / `sourceRoot`)
  - file-level Angular CLI test command construction and execution through npm
  - stdout/stderr streaming into VS Code test run output
  - pass/fail/error test result mapping from CLI process outcomes
- Unit tests for Angular project mapping and Angular CLI command construction behavior.
- Additional unit tests for:
  - command construction watch-mode + template override behavior
  - project mapping no-projects failure path
- Unit tests for spec test discovery and single-test item identity parsing.
- Marketplace icon wiring in `package.json` with repository root `icon.png`.
- Step 01 extension scaffold with a TypeScript-only VS Code Testing API integration:
  - `package.json` activation events and commands for Testing view usage
  - `src/extension.ts` with `TestController` bootstrap and a `**/*.spec.ts` discovery flow
  - basic run profile support for running selected or all discovered spec items
- Unit tests for command target resolution and requested test collection behavior in `src/core/testSelection.ts`.
- Explicit quality rule in `AGENTS.md` requiring automated tests for testable code behavior.

### Changed
- `README.md` now includes a `How to Use` section for the first runnable extension behavior, including setup and Testing view workflow.
- `version.json` minor milestone advanced from `0.1` to `0.2` after clearing prompt milestone 01.
- `version.json` minor milestone advanced from `0.2` to `0.3` after clearing prompt milestone 02.
- `version.json` minor milestone advanced from `0.3` to `0.4` after clearing prompt milestone 03.
- `version.json` minor milestone advanced from `0.4` to `0.5` after clearing prompt milestone 04.

## [0.1.0] - 2026-05-24
### Added
- Core repository documentation: `README.md`, `CONTRIBUTING.md`, and `AGENTS.md` to define project intent and contribution workflow.
- GitHub issue templates for bug reports and feature requests to standardize incoming changes.
- CI workflow for markdown linting, required file checks, and link validation to keep docs quality stable.
- MIT license file and repository-level ignore rules for common extension/prompt-pack artifacts.

### Changed
- `README.md` refined to keep scope and goals concise, removing internal prompt-pack references and redundant stack statements.
