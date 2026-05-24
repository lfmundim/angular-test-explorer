export interface AngularCliRunContext {
  workspaceRoot: string;
  projectName: string;
  specRelativePath: string;
}

export interface AngularCliCommand {
  command: string;
  args: string[];
}

export function buildAngularCliCommand(context: AngularCliRunContext): AngularCliCommand {
  return {
    command: "npm",
    args: [
      "--prefix",
      context.workspaceRoot,
      "run",
      "test",
      "--",
      "--project",
      context.projectName,
      "--watch=false",
      "--include",
      context.specRelativePath,
    ],
  };
}
