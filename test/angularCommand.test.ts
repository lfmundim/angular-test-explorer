import test from "node:test";
import assert from "node:assert/strict";
import { buildAngularCliCommand } from "../src/core/angularCommand";

test("buildAngularCliCommand returns Angular CLI npm command", () => {
  const command = buildAngularCliCommand({
    workspaceRoot: "/repo",
    projectName: "manage",
    specRelativePath: "apps/manage/src/app/app.component.spec.ts",
  });

  assert.equal(command.command, "npm");
  assert.deepEqual(command.args, [
    "--prefix",
    "/repo",
    "run",
    "test",
    "--",
    "--project",
    "manage",
    "--watch=false",
    "--include",
    "apps/manage/src/app/app.component.spec.ts",
  ]);
});

test("buildAngularCliCommand includes --testNamePattern when provided", () => {
  const command = buildAngularCliCommand({
    workspaceRoot: "/repo",
    projectName: "manage",
    specRelativePath: "apps/manage/src/app/app.component.spec.ts",
    testNamePattern: "Manage should render",
  });

  assert.deepEqual(command.args, [
    "--prefix",
    "/repo",
    "run",
    "test",
    "--",
    "--project",
    "manage",
    "--watch=false",
    "--include",
    "apps/manage/src/app/app.component.spec.ts",
    "--testNamePattern",
    "Manage should render",
  ]);
});
