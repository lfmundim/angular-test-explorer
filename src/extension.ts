import * as path from "node:path";
import * as vscode from "vscode";
import {
  collectRequestedTests as collectRequestedTestItems,
  isTestItemLike,
  resolveCommandTargets,
} from "./core/testSelection";
import {
  findAngularWorkspaceRoot,
  loadAngularWorkspaceConfig,
} from "./core/angularWorkspace";
import { mapSpecToAngularProject } from "./core/projectMapping";
import { buildAngularCliCommand, type AngularCliCommand } from "./core/angularCommand";
import { runCliCommand } from "./core/angularRunner";
import { discoverSpecTests } from "./core/specTestParser";
import { buildSingleTestItemId, parseSingleTestItemId } from "./core/testIdentity";

const SPEC_GLOB = "**/*.spec.ts";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const controller = vscode.tests.createTestController(
    "angularTestExplorerController",
    "Angular Test Explorer"
  );
  context.subscriptions.push(controller);

  const output = vscode.window.createOutputChannel("Angular Test Explorer");
  context.subscriptions.push(output);

  controller.createRunProfile(
    "Run",
    vscode.TestRunProfileKind.Run,
    (request, token) => runTests(controller, request, output, token),
    true
  );

  const refresh = vscode.commands.registerCommand("angularTestExplorer.refreshTests", async () => {
    await refreshTests(controller);
  });

  const runSelected = vscode.commands.registerCommand(
    "angularTestExplorer.runSelectedTests",
    async (...args: unknown[]) => {
      const resolved = resolveCommandTargets(args, isTestItemLike) as vscode.TestItem[];
      const request = new vscode.TestRunRequest(resolved.length > 0 ? resolved : undefined);
      await runTests(controller, request, output);
    }
  );

  context.subscriptions.push(refresh, runSelected);
  await refreshTests(controller);
}

async function refreshTests(controller: vscode.TestController): Promise<void> {
  controller.items.replace([]);

  const files = await vscode.workspace.findFiles(SPEC_GLOB, "**/node_modules/**");

  for (const file of files) {
    const label = toWorkspaceRelative(file);
    const item = controller.createTestItem(file.toString(), label, file);

    for (const discoveredTest of discoverSpecTests(file.fsPath)) {
      const child = controller.createTestItem(
        buildSingleTestItemId(item.id, discoveredTest.fullName),
        discoveredTest.fullName,
        file
      );
      item.children.add(child);
    }

    controller.items.add(item);
  }
}

async function runTests(
  controller: vscode.TestController,
  request: vscode.TestRunRequest,
  output: vscode.OutputChannel,
  token?: vscode.CancellationToken
): Promise<void> {
  const run = controller.createTestRun(request);
  const tests = await collectTestsForRun(controller, request);

  if (tests.length === 0) {
    output.appendLine("No tests selected.");
    run.end();
    return;
  }

  for (const test of tests) {
    if (token?.isCancellationRequested) {
      run.skipped(test);
      continue;
    }

    run.enqueued(test);
    run.started(test);

    try {
      await executeAngularTestForItem(test, run, output, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      output.appendLine(`[error] ${test.label}: ${message}`);
      run.appendOutput(`[error] ${test.label}: ${message}\n`);
      run.errored(test, new vscode.TestMessage(message), 0);
    }
  }

  run.end();
}

async function executeAngularTestForItem(
  test: vscode.TestItem,
  run: vscode.TestRun,
  output: vscode.OutputChannel,
  token?: vscode.CancellationToken
): Promise<void> {
  const singleTestIdentity = parseSingleTestItemId(test.id);
  const specItem = singleTestIdentity ? test.parent : test;

  if (!specItem?.uri) {
    throw new Error(`Test item '${test.label}' has no file URI.`);
  }

  const specFilePath = specItem.uri.fsPath;
  const workspaceRoot = findAngularWorkspaceRoot(specFilePath);
  if (!workspaceRoot) {
    throw new Error(
      `Could not find angular.json for '${specFilePath}'. Ensure the file is inside an Angular workspace.`
    );
  }

  const config = loadAngularWorkspaceConfig(workspaceRoot);
  const projectName = mapSpecToAngularProject(workspaceRoot, specFilePath, config);
  const specRelativePath = path.relative(workspaceRoot, specFilePath).replace(/\\/g, "/");

  const command = buildAngularCliCommand({
    workspaceRoot,
    projectName,
    specRelativePath,
    testNamePattern: singleTestIdentity?.testNamePattern,
  });

  output.appendLine(`[run] ${test.label}`);
  let result = await runAngularCommand(command, run, output, token);

  if (singleTestIdentity && shouldFallbackToFileLevel(result) && !token?.isCancellationRequested) {
    const fallbackCommand = buildAngularCliCommand({ workspaceRoot, projectName, specRelativePath });
    output.appendLine(
      `[fallback] Single-test run is unsupported by current Angular CLI context. Retrying file-level run for '${toWorkspaceRelative(specItem.uri)}'.`
    );
    run.appendOutput(
      "[fallback] Single-test run is unsupported by current Angular CLI context. Retrying file-level run.\n"
    );
    result = await runAngularCommand(fallbackCommand, run, output, token);
  }

  applyRunResult(test, result, run, token);
}

async function runAngularCommand(
  command: AngularCliCommand,
  run: vscode.TestRun,
  output: vscode.OutputChannel,
  token?: vscode.CancellationToken
): Promise<Awaited<ReturnType<typeof runCliCommand>>> {
  const humanCommand = `${command.command} ${command.args.join(" ")}`;
  output.appendLine(`[cmd] ${humanCommand}`);
  run.appendOutput(`[cmd] ${humanCommand}\n`);
  return runCliCommand(command, run, token);
}

function applyRunResult(
  test: vscode.TestItem,
  result: Awaited<ReturnType<typeof runCliCommand>>,
  run: vscode.TestRun,
  token?: vscode.CancellationToken
): void {
  if (token?.isCancellationRequested || result.timedOut) {
    run.skipped(test);
    return;
  }

  if (result.exitCode === 0) {
    run.passed(test, 0);
    return;
  }

  if (result.exitCode === null) {
    run.errored(
      test,
      new vscode.TestMessage(`Angular CLI process terminated by signal '${result.signal ?? "unknown"}'.`),
      0
    );
    return;
  }

  run.failed(test, new vscode.TestMessage(`Angular CLI exited with code ${result.exitCode}.`), 0);
}

function shouldFallbackToFileLevel(result: Awaited<ReturnType<typeof runCliCommand>>): boolean {
  if (result.exitCode === 0 || result.exitCode === null || result.timedOut) {
    return false;
  }

  return /unknown (argument|option).*testnamepattern|not recognized.*testnamepattern/i.test(
    result.combinedOutput
  );
}

async function collectTestsForRun(
  controller: vscode.TestController,
  request: vscode.TestRunRequest
): Promise<vscode.TestItem[]> {
  const all: vscode.TestItem[] = [];
  controller.items.forEach((test) => all.push(test));
  return collectRequestedTestItems(request.include, all);
}

function toWorkspaceRelative(uri: vscode.Uri): string {
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  if (!folder) {
    return path.basename(uri.fsPath);
  }

  return path.relative(folder.uri.fsPath, uri.fsPath);
}

export function deactivate(): void {
  // nothing to dispose beyond subscriptions
}
