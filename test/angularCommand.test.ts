import test from "node:test";
import assert from "node:assert/strict";
import { buildAngularCliCommand } from "../src/core/angularCommand";

test("buildAngularCliCommand returns Angular CLI npm command", () => {
  const command = buildAngularCliCommand({
    workspaceRoot: "/repo",
    projectName: "manage",
    specRelativePath: "apps/manage/src/app/app.component.spec.ts",
    watch: false,
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
    watch: false,
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

test("buildAngularCliCommand enables watch mode when requested", () => {
  const command = buildAngularCliCommand({
    workspaceRoot: "/repo",
    projectName: "manage",
    specRelativePath: "apps/manage/src/app/app.component.spec.ts",
    watch: true,
  });

  assert.equal(command.args.includes("--watch=true"), true);
});

test("buildAngularCliCommand supports template override placeholders", () => {
  const command = buildAngularCliCommand({
    workspaceRoot: "/repo",
    projectName: "manage",
    specRelativePath: "apps/manage/src/app/app.component.spec.ts",
    testNamePattern: "Manage should render",
    watch: false,
    commandTemplate:
      "npm --prefix {workspace} run test -- --project {project} {watch} --include {spec} --testNamePattern \"{testNamePattern}\"",
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
    "--testNamePattern",
    "Manage should render",
  ]);
});
