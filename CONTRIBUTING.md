# Contributing

## Scope
This repository contains prompt packs for building the Kimdim Angular Test Explorer extension. Keep changes focused, explicit, and sequential.

## How To Contribute
1. Open an issue describing the change.
2. Keep edits minimal and scoped to one concern.
3. Update related prompt files when behavior or constraints change.
4. Validate links and markdown formatting.
5. Submit a pull request with a clear summary.

## Prompt Authoring Rules
- Keep prompts short and actionable.
- Preserve sequential compatibility between `00-common.md` and numbered prompts.
- Avoid conflicting instructions across prompts.
- Prefer deterministic requirements over vague guidance.

## Versioning Policy
- New feature: bump **minor** version.
- Bugfix: no minor bump; patch is derived from git height via GitVersioning.
- Major overhaul: bump **major** version.

## Commit Style
Use small commits with clear messages, for example:
- `docs: clarify project mapping requirement`
- `chore: add issue template`

## Code of Conduct
Be respectful and constructive in issues and pull requests.
