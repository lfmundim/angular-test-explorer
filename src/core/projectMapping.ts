import * as path from "node:path";
import type { AngularWorkspaceConfig } from "./angularWorkspace";

export function mapSpecToAngularProject(
  workspaceRoot: string,
  specFilePath: string,
  config: AngularWorkspaceConfig
): string {
  const relativeSpec = normalizePath(path.relative(workspaceRoot, specFilePath));

  if (!config.projects || Object.keys(config.projects).length === 0) {
    throw new Error("Project mapping failed: angular.json has no projects.");
  }

  const projectEntries = Object.entries(config.projects);
  const matches = projectEntries
    .map(([name, project]) => {
      const candidates = [project.sourceRoot, project.root]
        .filter((value): value is string => Boolean(value))
        .map(normalizePath);

      const score = Math.max(
        -1,
        ...candidates.map((candidate) => (isPathWithin(relativeSpec, candidate) ? candidate.length : -1))
      );

      return { name, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    throw new Error(
      `Project mapping failed: could not map spec '${relativeSpec}' to any project root/sourceRoot in angular.json.`
    );
  }

  return matches[0].name;
}

function isPathWithin(target: string, base: string): boolean {
  if (!base || base === ".") {
    return true;
  }

  return target === base || target.startsWith(`${base}/`);
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
}
