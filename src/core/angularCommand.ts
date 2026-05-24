export interface AngularCliRunContext {
  workspaceRoot: string;
  projectName: string;
  specRelativePath: string;
  testNamePattern?: string;
  watch: boolean;
  commandTemplate?: string;
}

export interface AngularCliCommand {
  command: string;
  args: string[];
}

export function buildAngularCliCommand(context: AngularCliRunContext): AngularCliCommand {
  const watchArg = context.watch ? "--watch=true" : "--watch=false";

  if (context.commandTemplate) {
    const rendered = context.commandTemplate
      .replaceAll("{workspace}", context.workspaceRoot)
      .replaceAll("{project}", context.projectName)
      .replaceAll("{spec}", context.specRelativePath)
      .replaceAll("{watch}", watchArg)
      .replaceAll("{testNamePattern}", context.testNamePattern ?? "");

    const parts = splitCommandTemplate(rendered);

    if (parts.length === 0) {
      throw new Error("Configured command template is empty after placeholder expansion.");
    }

    return {
      command: parts[0],
      args: parts.slice(1),
    };
  }

  const args = [
    "--prefix",
    context.workspaceRoot,
    "run",
    "test",
    "--",
    "--project",
    context.projectName,
    watchArg,
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

function splitCommandTemplate(value: string): string[] {
  const parts: string[] = [];
  const pattern = /[^\s"']+|"([^"]*)"|'([^']*)'/g;

  for (const match of value.matchAll(pattern)) {
    parts.push(match[1] ?? match[2] ?? match[0]);
  }

  return parts;
}
