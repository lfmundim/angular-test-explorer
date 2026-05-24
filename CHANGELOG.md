# Changelog

All notable changes to this repository are documented here.

## [Unreleased]

### Added
- Optional `angularTestExplorer.projectsBasePathTrim` setting to trim long path prefixes from Testing view labels.
- `angularTestExplorer.parallelizeByProject` toggle to run different Angular projects in parallel while keeping same-project runs serialized.
- CI publish automation for VS Code Marketplace:
  - prerelease publish on every push to `main`, with package version synced from `version.json` (Nerdbank.GitVersioning)
  - tag trigger on `v*` for prerelease publishing
  - manual `workflow_dispatch` release channel selection (`prerelease` or `stable`)
  - secure publish via repository secret `VSCE_PAT`
- Step 05 packaging and release readiness:
  - expanded final prompt (`prompts/05-packaging-and-release.md`) with deterministic requirements and acceptance checks
  - README packaging section with explicit VSIX build instructions
  - README screenshot placeholder section for marketplace documentation completeness
  - CI extension-quality job that runs lint, tests, build, and VSIX packaging on push/PR
  - package manifest `repository` metadata for marketplace/release completeness
  - `.vscodeignore` to keep VSIX contents focused on runtime assets
  - CI version-sync step that derives `package.json` version from `version.json` via Nerdbank.GitVersioning before VSIX packaging
  - prerelease VSIX packaging in CI using `vsce package --pre-release`
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
- Angular CLI Test Results output now uses CRLF-safe streaming with carriage-return handling to avoid line-break skew while preserving ng/vitest table spacing and ANSI color output.
- Test tree discovery now groups items by Angular project, with file labels trimmed relative to the project group.
- CLI output streaming now normalizes ANSI/progress control sequences to reduce over-spaced Test Results rendering.
- Marketplace/readme naming updated to "Kate - Kimdim Angular Test Explorer", with command titles renamed to `Kate: ...`.
- Test run durations now use real CLI elapsed time instead of always reporting `0ms`.
- File-level run results now propagate pass/fail/error status to discovered in-file test items in the Testing tree.
- Failed test messages now surface useful error text from Angular CLI output instead of only reporting exit code.
- Extension activation now guards initial test discovery errors so command registration remains available even when a workspace file fails discovery at startup.
- Extension identity renamed across the repository to `kimdim-angular-test-explorer` / `Kimdim Angular Test Explorer` to avoid VS Marketplace display-name conflicts.
- Marketplace publish job now builds extension output (`npm run build`) before `vsce publish`, fixing missing entrypoint failures in CI.
- CI link-check job now allows empty-link scans (`failIfEmpty: false`) so docs without URLs do not fail the pipeline.
- Test script now runs Node's test runner on `out-test/test/*.test.js` instead of a `**` glob, fixing CI bash glob expansion issues.
- Marketplace publish job checkout now uses full git history (`fetch-depth: 0`) so Nerdbank.GitVersioning can compute version height reliably.
- CI checkout now uses full git history (`fetch-depth: 0`) in jobs that run Nerdbank.GitVersioning, fixing version-resolution failures from shallow clones.
- Markdown lint configuration now disables `MD022`, `MD032`, and `MD009` to match the repository's existing documentation formatting style and prevent non-functional CI failures.
- `package.json` publisher updated from `local` to `kimdim` for Marketplace publishing.
- `README.md` now includes explicit configuration reference and troubleshooting sections, and milestone wording aligned with prompt step 05 behavior.
- `version.json` minor milestone advanced from `0.5` to `0.6` after clearing prompt milestone 05.
- `README.md` now includes a `How to Use` section for the first runnable extension behavior, including setup and Testing view workflow.
- `version.json` minor milestone advanced from `0.1` to `0.2` after clearing prompt milestone 01.
- `version.json` minor milestone advanced from `0.2` to `0.3` after clearing prompt milestone 02.
- `version.json` minor milestone advanced from `0.3` to `0.4` after clearing prompt milestone 03.
- `version.json` minor milestone advanced from `0.4` to `0.5` after clearing prompt milestone 04.
- `version.json` minor milestone advanced from `0.6` to `0.7` for the Kate stabilization milestone.

## [0.1.0] - 2026-05-24
### Added
- Core repository documentation: `README.md`, `CONTRIBUTING.md`, and `AGENTS.md` to define project intent and contribution workflow.
- GitHub issue templates for bug reports and feature requests to standardize incoming changes.
- CI workflow for markdown linting, required file checks, and link validation to keep docs quality stable.
- MIT license file and repository-level ignore rules for common extension/prompt-pack artifacts.

### Changed
- `README.md` refined to keep scope and goals concise, removing internal prompt-pack references and redundant stack statements.
