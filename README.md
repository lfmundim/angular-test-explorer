# angular-test-explorer

VS Code extension concept to show and run Angular unit tests in Test Explorer by executing the Angular CLI test builder (`ng test`) instead of plain Vitest.

## Why

Angular component tests often require Angular's build/test pipeline (resource resolution, framework-specific setup). Running plain Vitest from generic runners can fail even when `ng test` passes.

## Goal

Provide a native Test Explorer experience for Angular workspaces while preserving the current tests and runner behavior.

## Scope (MVP)

- Discover `*.spec.ts` in Angular workspace(s)
- Map each spec to its Angular project (`customer`, `manage`, `shared`, etc.)
- Run tests through `ng test --project <name>`
- Support run at file level and single-test level (best effort)
- Parse CLI output and reflect pass/fail in VS Code Testing view
- Expose extension settings for workspace root and command template

## Non-Goals (MVP)

- Replacing Angular test infrastructure
- Custom bundling pipeline
- Snapshot tooling beyond what Angular CLI already supports

## How to Use

1. Install dependencies:
   - `npm install`
2. Build the extension:
   - `npm run build`
3. Run unit tests:
   - `npm test`
4. Open this repository in VS Code.
5. Press `F5` to launch the Extension Development Host.
6. In the new window, open a workspace that contains `*.spec.ts` files.
7. Open the Testing view.
8. Run:
   - `Angular Test Explorer: Refresh Tests` to rediscover specs
   - `Angular Test Explorer: Run Selected Tests` to run selected items

Current behavior (implemented through prompt milestone 05):
- Discovers files using `**/*.spec.ts` across workspace folders (monorepo-safe)
- Populates the Testing tree with discovered spec files
- Discovers in-file test cases from `describe` / `it` / `test` using a lightweight TypeScript AST pass and adds them as child test items
- Detects Angular workspace roots from `angular.json` per spec file
- Supports optional workspace root override via setting:
  - `angularTestExplorer.workspacePathOverride`
- Maps spec files to Angular projects from `angular.json` (`root` / `sourceRoot`)
- Executes file-level test runs through Angular CLI via npm:
  - `npm --prefix <workspace> run test -- --project <project> --watch=false --include <specPath>`
- Supports configurable command template via:
  - `angularTestExplorer.commandTemplateOverride`
  - placeholders: `{workspace}`, `{project}`, `{spec}`, `{watch}`, `{testNamePattern}`
  - quote placeholders when values may include spaces, for example: `--testNamePattern "{testNamePattern}"`
- Supports default watch behavior via:
  - `angularTestExplorer.defaultWatchMode` (default `false`)
- Attempts single-test execution with:
  - `--testNamePattern <fullTestName>`
- Falls back deterministically to file-level execution when current Angular CLI context does not support `--testNamePattern`, and reports fallback in output
- Streams Angular CLI stdout/stderr to test run output and marks each test item as pass/fail/error
- Supports cancellation by terminating the in-flight Angular CLI process
- Automatically refreshes discovered tests (debounced) when `*.spec.ts`, `angular.json`, or extension settings change
- Reports actionable diagnostics for missing Angular CLI/tooling context and project mapping failures

## Configuration Reference

- `angularTestExplorer.workspacePathOverride`
  - Type: `string` (default: empty)
  - Optional workspace root override used to locate `angular.json`. Relative paths resolve from the active workspace folder.
- `angularTestExplorer.commandTemplateOverride`
  - Type: `string` (default: empty)
  - Optional test command template with placeholders:
    `{workspace}`, `{project}`, `{spec}`, `{watch}`, `{testNamePattern}`.
  - Quote placeholders when values may contain spaces, for example:
    `--testNamePattern "{testNamePattern}"`.
- `angularTestExplorer.defaultWatchMode`
  - Type: `boolean` (default: `false`)
  - Default watch value passed into Angular test execution.

## Troubleshooting

- No tests appear in the Testing view:
  - Ensure the opened workspace contains files matching `**/*.spec.ts`.
  - Run `Angular Test Explorer: Refresh Tests`.
- Project mapping fails:
  - Confirm the relevant workspace has a valid `angular.json`.
  - If auto-detection picks the wrong root, set `angularTestExplorer.workspacePathOverride`.
- Angular CLI command fails to start:
  - Verify workspace dependencies are installed and `npm run test` works for the target project.
  - If your workspace needs a different invocation shape, set `angularTestExplorer.commandTemplateOverride`.
- Single-test run falls back to file-level:
  - This occurs when the current Angular CLI context does not accept `--testNamePattern`.
  - Check test output for the explicit fallback note.

## Screenshots (Placeholders)

- `docs/images/testing-view.png` (placeholder)
- `docs/images/single-test-run.png` (placeholder)
- `docs/images/fallback-output.png` (placeholder)

## Packaging and Release

Build and validate before packaging:

1. Install dependencies:
   - `npm install`
2. Run lint and tests:
   - `npm run lint`
   - `npm test`
3. Build extension output:
   - `npm run build`
4. Package VSIX:
   - `npx @vscode/vsce package --pre-release`

Expected artifact:
- `./angular-test-explorer-<version>.vsix`

Notes:
- CI syncs `package.json` version from `version.json` using Nerdbank.GitVersioning before packaging.
- CI currently packages as prerelease using `--pre-release`.
