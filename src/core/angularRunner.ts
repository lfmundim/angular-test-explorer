import { spawn } from "node:child_process";
import * as vscode from "vscode";
import type { AngularCliCommand } from "./angularCommand";

export interface CliRunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  combinedOutput: string;
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
    let combinedOutput = "";

    const onCancel = token?.onCancellationRequested(() => {
      timedOut = true;
      child.kill("SIGTERM");
    });

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      combinedOutput += text;
      run.appendOutput(text);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      combinedOutput += text;
      run.appendOutput(text);
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      onCancel?.dispose();
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            `Failed to start command '${cmd.command}'. Ensure Node.js/npm and Angular CLI tooling are installed and available in PATH.`
          )
        );
        return;
      }

      reject(error);
    });

    child.on("close", (exitCode, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      onCancel?.dispose();
      resolve({ exitCode, signal, timedOut, combinedOutput });
    });
  });
}
