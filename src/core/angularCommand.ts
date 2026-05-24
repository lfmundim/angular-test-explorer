export interface AngularCliRunContext {
  workspaceRoot: string;
  projectName: string;
  specRelativePath: string;
  testNamePattern?: string;
}

export interface AngularCliCommand {
  command: string;
  args: string[];
}

export function buildAngularCliCommand(context: AngularCliRunContext): AngularCliCommand {
  const args = [
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
  ];

  if (context.testNamePattern) {
    args.push("--testNamePattern", context.testNamePattern);
  }

  return {
    command: "npm",
    args,
  };
}
