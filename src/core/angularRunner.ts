import { spawn } from "node:child_process";
import * as vscode from "vscode";
import type { AngularCliCommand } from "./angularCommand";

export interface CliRunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
}

export async function runCliCommand(
  cmd: AngularCliCommand,
  run: vscode.TestRun,
  token?: vscode.CancellationToken
): Promise<CliRunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd.command, cmd.args, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let settled = false;
    let timedOut = false;

    const onCancel = token?.onCancellationRequested(() => {
      timedOut = true;
      child.kill("SIGTERM");
    });

    child.stdout.on("data", (chunk: Buffer) => {
      run.appendOutput(chunk.toString());
    });

    child.stderr.on("data", (chunk: Buffer) => {
      run.appendOutput(chunk.toString());
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      onCancel?.dispose();
      reject(error);
    });

    child.on("close", (exitCode, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      onCancel?.dispose();
      resolve({ exitCode, signal, timedOut });
    });
  });
}
