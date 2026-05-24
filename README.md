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

Step 01 provides a runnable scaffold focused on Test Explorer wiring.

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

Current Step 03 behavior:
- Discovers files using `**/*.spec.ts` across workspace folders (monorepo-safe)
- Populates the Testing tree with discovered spec files
- Discovers in-file test cases from `describe` / `it` / `test` using a lightweight TypeScript AST pass and adds them as child test items
- Detects Angular workspace roots from `angular.json` per spec file
- Maps spec files to Angular projects from `angular.json` (`root` / `sourceRoot`)
- Executes file-level test runs through Angular CLI via npm:
  - `npm --prefix <workspace> run test -- --project <project> --watch=false --include <specPath>`
- Attempts single-test execution with:
  - `--testNamePattern <fullTestName>`
- Falls back deterministically to file-level execution when current Angular CLI context does not support `--testNamePattern`, and reports fallback in output
- Streams Angular CLI stdout/stderr to test run output and marks each test item as pass/fail/error
