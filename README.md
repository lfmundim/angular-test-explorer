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

## License

MIT
