import { spawn } from "node:child_process";
import type { AngularCliCommand } from "./angularCommand";
import * as vscode from "vscode";
const OUTPUT_EOL = "\r\n";

export interface CliRunResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  combinedOutput: string;
  durationMs: number;
}

export async function runCliCommand(
  cmd: AngularCliCommand,
  run: vscode.TestRun,
  token?: vscode.CancellationToken
): Promise<CliRunResult> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(cmd.command, cmd.args, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        CI: "1",
        FORCE_COLOR: "1",
        TERM: "xterm-256color",
      },
    });

    let settled = false;
    let timedOut = false;
    let combinedOutput = "";
    let currentLine = "";

    const onCancel = token?.onCancellationRequested(() => {
      timedOut = true;
      child.kill("SIGTERM");
    });

    const handleChunk = (raw: string) => {
      const text = normalizeCliOutputChunk(raw);
      for (const char of text) {
        if (char === "\r") {
          currentLine = "";
          continue;
        }

        if (char === "\n") {
          if (currentLine.length > 0) {
            const rendered = normalizeRenderedLine(currentLine);
            if (!rendered) {
              currentLine = "";
              continue;
            }
            const line = `${rendered}${OUTPUT_EOL}`;
            combinedOutput += line;
            run.appendOutput(line);
            currentLine = "";
          }
          continue;
        }

        currentLine += char;
      }
    };

    child.stdout.on("data", (chunk: Buffer) => {
      handleChunk(chunk.toString());
    });

    child.stderr.on("data", (chunk: Buffer) => {
      handleChunk(chunk.toString());
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
      if (currentLine.length > 0) {
        const rendered = normalizeRenderedLine(currentLine);
        if (rendered) {
          const line = `${rendered}${OUTPUT_EOL}`;
          combinedOutput += line;
          run.appendOutput(line);
        }
      }
      resolve({
        exitCode,
        signal,
        timedOut,
        combinedOutput,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

function normalizeCliOutputChunk(chunk: string): string {
  return chunk
    .replace(/\u2026/g, "...")
    .replace(/\r\n/g, "\n")
    .replace(/\u0008/g, "");
}

function normalizeRenderedLine(line: string): string | undefined {
  const trimmedEnd = line.trimEnd();
  if (trimmedEnd.trim().length === 0) {
    return undefined;
  }
  return trimmedEnd;
}
