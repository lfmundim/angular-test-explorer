import * as path from "node:path";
import * as vscode from "vscode";

const SECTION = "angularTestExplorer";

export interface ExtensionConfiguration {
  workspacePathOverride?: string;
  commandTemplateOverride?: string;
  defaultWatchMode: boolean;
  parallelizeByProject: boolean;
  projectsBasePathTrim?: string;
}

export function getExtensionConfiguration(): ExtensionConfiguration {
  const config = vscode.workspace.getConfiguration(SECTION);
  const workspacePathOverride = config.get<string>("workspacePathOverride")?.trim();
  const commandTemplateOverride = config.get<string>("commandTemplateOverride")?.trim();
  const defaultWatchMode = config.get<boolean>("defaultWatchMode", false);
  const projectsBasePathTrim = config.get<string>("projectsBasePathTrim")?.trim();
  const parallelizeByProject = config.get<boolean>("parallelizeByProject", true);

  return {
    workspacePathOverride: workspacePathOverride && workspacePathOverride.length > 0 ? workspacePathOverride : undefined,
    commandTemplateOverride:
      commandTemplateOverride && commandTemplateOverride.length > 0
        ? commandTemplateOverride
        : undefined,
    projectsBasePathTrim:
      projectsBasePathTrim && projectsBasePathTrim.length > 0 ? projectsBasePathTrim : undefined,
    defaultWatchMode,
    parallelizeByProject,
  };
}

export function resolveWorkspaceOverridePath(specUri: vscode.Uri, override: string): string {
  if (path.isAbsolute(override)) {
    return override;
  }

  const folder = vscode.workspace.getWorkspaceFolder(specUri);
  if (!folder) {
    throw new Error(
      `Configured workspace path override '${override}' is relative, but no workspace folder was found for '${specUri.fsPath}'.`
    );
  }

  return path.resolve(folder.uri.fsPath, override);
}
