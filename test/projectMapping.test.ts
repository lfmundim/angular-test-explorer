import test from "node:test";
import assert from "node:assert/strict";
import { mapSpecToAngularProject } from "../src/core/projectMapping";

test("mapSpecToAngularProject resolves matching project by sourceRoot", () => {
  const workspaceRoot = "/repo";
  const specFile = "/repo/apps/manage/src/app/app.component.spec.ts";

  const project = mapSpecToAngularProject(workspaceRoot, specFile, {
    projects: {
      customer: { root: "apps/customer", sourceRoot: "apps/customer/src" },
      manage: { root: "apps/manage", sourceRoot: "apps/manage/src" },
    },
  });

  assert.equal(project, "manage");
});

test("mapSpecToAngularProject prefers longest matching path", () => {
  const workspaceRoot = "/repo";
  const specFile = "/repo/apps/shared/feature/src/a.spec.ts";

  const project = mapSpecToAngularProject(workspaceRoot, specFile, {
    projects: {
      shared: { root: "apps/shared" },
      feature: { root: "apps/shared/feature" },
    },
  });

  assert.equal(project, "feature");
});

test("mapSpecToAngularProject throws for unmapped spec", () => {
  const workspaceRoot = "/repo";
  const specFile = "/repo/outside/a.spec.ts";

  assert.throws(
    () =>
      mapSpecToAngularProject(workspaceRoot, specFile, {
        projects: {
          manage: { root: "apps/manage", sourceRoot: "apps/manage/src" },
        },
      }),
    /Project mapping failed/
  );
});
