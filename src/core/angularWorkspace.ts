import * as fs from "node:fs";
import * as path from "node:path";

export interface AngularWorkspaceConfig {
  projects?: Record<string, AngularProjectConfig>;
}

export interface AngularProjectConfig {
  root?: string;
  sourceRoot?: string;
}

export function findAngularWorkspaceRoot(fromPath: string): string | undefined {
  let current = path.dirname(fromPath);

  while (true) {
    const candidate = path.join(current, "angular.json");
    if (fs.existsSync(candidate)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

export function loadAngularWorkspaceConfig(workspaceRoot: string): AngularWorkspaceConfig {
  const configPath = path.join(workspaceRoot, "angular.json");
  let parsed: unknown;

  try {
    parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse angular.json at ${configPath}: ${message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid angular.json at ${configPath}: expected an object.`);
  }

  return parsed as AngularWorkspaceConfig;
}
