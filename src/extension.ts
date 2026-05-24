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
import { getExtensionConfiguration, resolveWorkspaceOverridePath } from "./core/configuration";
import { trimProjectsBasePath } from "./core/kateConfig";

const SPEC_GLOB = "**/*.spec.ts";
const REFRESH_DEBOUNCE_MS = 250;
const OUTPUT_EOL = "\r\n";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const controller = vscode.tests.createTestController(
    "angularTestExplorerController",
    "Kimdim Angular Test Explorer"
  );
  context.subscriptions.push(controller);

  const output = vscode.window.createOutputChannel("Kate");
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
  registerAutoRefresh(context, controller);
  try {
    await refreshTests(controller);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    output.appendLine(`[error] Initial test discovery failed: ${message}`);
  }
}

function registerAutoRefresh(
  context: vscode.ExtensionContext,
  controller: vscode.TestController
): void {
  let refreshTimer: NodeJS.Timeout | undefined;

  const scheduleRefresh = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }

    refreshTimer = setTimeout(async () => {
      refreshTimer = undefined;
      await refreshTests(controller);
    }, REFRESH_DEBOUNCE_MS);
  };

  const specWatcher = vscode.workspace.createFileSystemWatcher(SPEC_GLOB);
  const angularWatcher = vscode.workspace.createFileSystemWatcher("**/angular.json");
  const settingsWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("angularTestExplorer")) {
      scheduleRefresh();
    }
  });

  specWatcher.onDidCreate(scheduleRefresh);
  specWatcher.onDidChange(scheduleRefresh);
  specWatcher.onDidDelete(scheduleRefresh);
  angularWatcher.onDidCreate(scheduleRefresh);
  angularWatcher.onDidChange(scheduleRefresh);
  angularWatcher.onDidDelete(scheduleRefresh);
  context.subscriptions.push(specWatcher, angularWatcher, settingsWatcher);
  context.subscriptions.push(
    new vscode.Disposable(() => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    })
  );
}

async function refreshTests(controller: vscode.TestController): Promise<void> {
  controller.items.replace([]);

  const files = await vscode.workspace.findFiles(SPEC_GLOB, "**/node_modules/**");
  const projectNodes = new Map<string, vscode.TestItem>();

  for (const file of files) {
    const projectIdentity = resolveProjectIdentityForDiscovery(file);
    const projectKey = `${projectIdentity.workspaceRoot ?? "unknown"}::${projectIdentity.projectName}`;
    let projectNode = projectNodes.get(projectKey);

    if (!projectNode) {
      projectNode = controller.createTestItem(projectKey, projectIdentity.projectName);
      projectNodes.set(projectKey, projectNode);
      controller.items.add(projectNode);
    }

    const label = trimProjectPrefix(buildDisplayLabel(file), projectIdentity.projectName);
    const item = controller.createTestItem(file.toString(), label, file);

    try {
      for (const discoveredTest of discoverSpecTests(file.fsPath)) {
        const child = controller.createTestItem(
          buildSingleTestItemId(item.id, discoveredTest.fullName),
          discoveredTest.fullName,
          file
        );
        item.children.add(child);
      }
    } catch {
      // Keep discovery resilient even if one spec file cannot be parsed.
    }

    projectNode.children.add(item);
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
  const config = getExtensionConfiguration();

  if (tests.length === 0) {
    output.appendLine("No tests selected.");
    run.end();
    return;
  }

  const executeOne = async (test: vscode.TestItem) => {
    if (token?.isCancellationRequested) {
      markResultForItemAndChildren(run, test, "skipped", undefined, 0);
      return;
    }

    run.enqueued(test);
    run.started(test);

    try {
      await executeAngularTestForItem(test, run, output, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      output.appendLine(`[error] ${test.label}: ${message}`);
      run.appendOutput(`[error] ${test.label}: ${message}${OUTPUT_EOL}`);
      markResultForItemAndChildren(run, test, "errored", message, 0);
    }
  };

  if (config.parallelizeByProject) {
    const grouped = await groupTestsByProject(tests);
    await runProjectGroups(grouped, executeOne);
  } else {
    await runWithConcurrency(tests, 1, executeOne);
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
  const config = getExtensionConfiguration();
  const workspaceRoot = config.workspacePathOverride
    ? resolveWorkspaceOverridePath(specItem.uri, config.workspacePathOverride)
    : findAngularWorkspaceRoot(specFilePath);

  if (!workspaceRoot) {
    throw new Error(
      `Could not find angular.json for '${specFilePath}'. Ensure the file is inside an Angular workspace.`
    );
  }

  const workspaceConfig = loadAngularWorkspaceConfig(workspaceRoot);
  const projectName = mapSpecToAngularProject(workspaceRoot, specFilePath, workspaceConfig);
  const specRelativePath = path.relative(workspaceRoot, specFilePath).replace(/\\/g, "/");

  const command = buildAngularCliCommand({
    workspaceRoot,
    projectName,
    specRelativePath,
    testNamePattern: singleTestIdentity?.testNamePattern,
    watch: config.defaultWatchMode,
    commandTemplate: config.commandTemplateOverride,
  });

  output.appendLine(`[run] ${test.label}`);
  let result = await runAngularCommand(command, run, output, token);

  if (singleTestIdentity && shouldFallbackToFileLevel(result) && !token?.isCancellationRequested) {
    const fallbackCommand = buildAngularCliCommand({
      workspaceRoot,
      projectName,
      specRelativePath,
      watch: config.defaultWatchMode,
      commandTemplate: config.commandTemplateOverride,
    });
    output.appendLine(
      `[fallback] Single-test run is unsupported by current Angular CLI context. Retrying file-level run for '${toWorkspaceRelative(specItem.uri)}'.`
    );
    run.appendOutput(
      `[fallback] Single-test run is unsupported by current Angular CLI context. Retrying file-level run.${OUTPUT_EOL}`
    );
    result = await runAngularCommand(fallbackCommand, run, output, token);
  }

  applyRunResult(test, specItem, singleTestIdentity !== undefined, result, run, token);
}

async function runAngularCommand(
  command: AngularCliCommand,
  run: vscode.TestRun,
  output: vscode.OutputChannel,
  token?: vscode.CancellationToken
): Promise<Awaited<ReturnType<typeof runCliCommand>>> {
  const humanCommand = `${command.command} ${command.args.join(" ")}`;
  output.appendLine(`[cmd] ${humanCommand}`);
  run.appendOutput(`[cmd] ${humanCommand}${OUTPUT_EOL}`);
  return runCliCommand(command, run, token);
}

function applyRunResult(
  test: vscode.TestItem,
  specItem: vscode.TestItem,
  isSingleTest: boolean,
  result: Awaited<ReturnType<typeof runCliCommand>>,
  run: vscode.TestRun,
  token?: vscode.CancellationToken
): void {
  const durationMs = result.durationMs;

  if (token?.isCancellationRequested || result.timedOut) {
    markResultForItemAndChildren(run, test, "skipped", undefined, durationMs);
    return;
  }

  if (result.exitCode === 0) {
    if (isSingleTest) {
      markResultForItemAndChildren(run, test, "passed", undefined, durationMs);
      run.appendOutput(`✔️ Test Passed${OUTPUT_EOL}`);
    } else {
      markResultForItemAndChildren(run, specItem, "passed", undefined, durationMs);
      run.appendOutput(`✔️ Test Passed${OUTPUT_EOL}`);
      specItem.children.forEach((child) => {
        markResultForItemAndChildren(run, child, "passed", undefined, durationMs);
        run.appendOutput(`✔️ Test Passed${OUTPUT_EOL}`);
      });
    }
    return;
  }

  if (isMissingAngularCli(result.combinedOutput)) {
    const message =
      "Angular CLI is not available in this workspace test command context. Ensure '@angular/cli' is installed and the npm test script resolves 'ng test'.";
    if (isSingleTest) {
      markResultForItemAndChildren(run, test, "errored", message, durationMs);
    } else {
      markResultForItemAndChildren(run, specItem, "errored", message, durationMs);
      specItem.children.forEach((child) => {
        markResultForItemAndChildren(run, child, "errored", message, durationMs);
      });
    }
    return;
  }

  if (result.exitCode === null) {
    const message = `Angular CLI process terminated by signal '${result.signal ?? "unknown"}'.`;
    if (isSingleTest) {
      markResultForItemAndChildren(run, test, "errored", message, durationMs);
    } else {
      markResultForItemAndChildren(run, specItem, "errored", message, durationMs);
      specItem.children.forEach((child) => {
        markResultForItemAndChildren(run, child, "errored", message, durationMs);
      });
    }
    return;
  }

  const message = buildFailureMessage(result.combinedOutput, result.exitCode);
  if (isSingleTest) {
    markResultForItemAndChildren(run, test, "failed", message, durationMs);
  } else {
    markResultForItemAndChildren(run, specItem, "failed", message, durationMs);
    specItem.children.forEach((child) => {
      markResultForItemAndChildren(run, child, "failed", message, durationMs);
    });
  }
}

function buildFailureMessage(output: string, exitCode: number): string {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return `Angular CLI exited with code ${exitCode}.`;
  }

  const errorPattern =
    /(error|exception|failed|fail:|nullinjectorerror|typeerror|referenceerror|syntaxerror)/i;
  const errorIndex = lines.findIndex((line) => errorPattern.test(line));

  if (errorIndex >= 0) {
    const fromError = lines.slice(errorIndex, errorIndex + 8);
    return [`Angular CLI exited with code ${exitCode}.`, "", ...fromError].join("\n");
  }

  const tail = lines.slice(-5);
  return [`Angular CLI exited with code ${exitCode}.`, "", ...tail].join("\n");
}

function isMissingAngularCli(output: string): boolean {
  return /(?:ng:\s*command not found|cannot find module ['"]@angular\/cli|could not determine executable to run)/i.test(
    output
  );
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
  const allSpecItems: vscode.TestItem[] = [];
  controller.items.forEach((project) => {
    project.children.forEach((spec) => {
      allSpecItems.push(spec);
    });
  });
  const requested = collectRequestedTestItems(request.include, allSpecItems);
  const deduped = new Map<string, vscode.TestItem>();

  for (const item of requested) {
    if (!item.uri) {
      item.children.forEach((child) => {
        if (child.uri) {
          deduped.set(child.id, child);
        }
      });
      continue;
    }

    const single = parseSingleTestItemId(item.id);
    const candidate = single ? item.parent ?? item : item;
    deduped.set(candidate.id, candidate);
  }

  return [...deduped.values()];
}

function toWorkspaceRelative(uri: vscode.Uri): string {
  const folder = vscode.workspace.getWorkspaceFolder(uri);
  if (!folder) {
    return path.basename(uri.fsPath);
  }

  return path.relative(folder.uri.fsPath, uri.fsPath);
}

function buildDisplayLabel(uri: vscode.Uri): string {
  const relativePath = toWorkspaceRelative(uri);
  const config = getExtensionConfiguration();
  return trimProjectsBasePath(relativePath, config.projectsBasePathTrim);
}

function trimProjectPrefix(value: string, projectName: string): string {
  if (value === projectName) {
    return value;
  }

  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith(`${projectName}/`)) {
    return normalized.slice(projectName.length + 1);
  }

  return value;
}

interface ProjectIdentity {
  workspaceRoot?: string;
  projectName: string;
}

function resolveProjectIdentityForDiscovery(specUri: vscode.Uri): ProjectIdentity {
  const specFilePath = specUri.fsPath;
  const config = getExtensionConfiguration();
  const workspaceRoot = config.workspacePathOverride
    ? resolveWorkspaceOverridePath(specUri, config.workspacePathOverride)
    : findAngularWorkspaceRoot(specFilePath);

  if (!workspaceRoot) {
    return { projectName: "Unmapped" };
  }

  try {
    const workspaceConfig = loadAngularWorkspaceConfig(workspaceRoot);
    const projectName = mapSpecToAngularProject(workspaceRoot, specFilePath, workspaceConfig);
    return { workspaceRoot, projectName };
  } catch {
    return { workspaceRoot, projectName: "Unmapped" };
  }
}

type TestOutcome = "passed" | "failed" | "errored" | "skipped";

function markResultForItemAndChildren(
  run: vscode.TestRun,
  item: vscode.TestItem,
  outcome: TestOutcome,
  message?: string,
  durationMs = 0
): void {
  switch (outcome) {
    case "passed":
      run.passed(item, durationMs);
      return;
    case "skipped":
      run.skipped(item);
      return;
    case "failed":
      run.failed(item, new vscode.TestMessage(message ?? "Test failed."), durationMs);
      return;
    case "errored":
      run.errored(item, new vscode.TestMessage(message ?? "Test errored."), durationMs);
      return;
  }
}

async function runWithConcurrency<T>(
  items: readonly T[],
  maxParallel: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const parallelism = Math.max(1, Math.min(maxParallel, items.length));
  let nextIndex = 0;

  const runners = Array.from({ length: parallelism }, async () => {
    while (nextIndex < items.length) {
      const current = items[nextIndex];
      nextIndex += 1;
      await worker(current);
    }
  });

  await Promise.all(runners);
}

async function groupTestsByProject(
  tests: readonly vscode.TestItem[]
): Promise<Map<string, vscode.TestItem[]>> {
  const grouped = new Map<string, vscode.TestItem[]>();

  for (const test of tests) {
    const key = await resolveProjectExecutionKey(test);
    const bucket = grouped.get(key) ?? [];
    bucket.push(test);
    grouped.set(key, bucket);
  }

  return grouped;
}

async function resolveProjectExecutionKey(test: vscode.TestItem): Promise<string> {
  const singleTestIdentity = parseSingleTestItemId(test.id);
  const specItem = singleTestIdentity ? test.parent : test;

  if (!specItem?.uri) {
    return `unknown:${test.id}`;
  }

  const specFilePath = specItem.uri.fsPath;
  const config = getExtensionConfiguration();
  const workspaceRoot = config.workspacePathOverride
    ? resolveWorkspaceOverridePath(specItem.uri, config.workspacePathOverride)
    : findAngularWorkspaceRoot(specFilePath);

  if (!workspaceRoot) {
    return `unknown:${specFilePath}`;
  }

  try {
    const workspaceConfig = loadAngularWorkspaceConfig(workspaceRoot);
    const projectName = mapSpecToAngularProject(workspaceRoot, specFilePath, workspaceConfig);
    return `${workspaceRoot}::${projectName}`;
  } catch {
    return `${workspaceRoot}::unmapped`;
  }
}

async function runProjectGroups(
  grouped: ReadonlyMap<string, readonly vscode.TestItem[]>,
  worker: (test: vscode.TestItem) => Promise<void>
): Promise<void> {
  const projectRunners = [...grouped.values()].map(async (tests) => {
    for (const test of tests) {
      await worker(test);
    }
  });

  await Promise.all(projectRunners);
}

export function deactivate(): void {
  // nothing to dispose beyond subscriptions
}
