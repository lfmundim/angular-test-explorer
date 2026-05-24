import * as path from "node:path";

export function trimProjectsBasePath(relativePath: string, projectsBasePath?: string): string {
  const normalizedPath = normalizeSlashes(relativePath);
  const normalizedBase = normalizeSlashes(projectsBasePath ?? "");

  if (!normalizedBase) {
    return normalizedPath;
  }

  if (normalizedPath === normalizedBase) {
    return path.basename(normalizedPath);
  }

  if (normalizedPath.startsWith(`${normalizedBase}/`)) {
    return normalizedPath.slice(normalizedBase.length + 1);
  }

  return normalizedPath;
}

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
