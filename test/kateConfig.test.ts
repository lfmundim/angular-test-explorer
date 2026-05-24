import test from "node:test";
import assert from "node:assert/strict";
import { trimProjectsBasePath } from "../src/core/kateConfig";

test("trimProjectsBasePath removes configured base prefix", () => {
  const value = trimProjectsBasePath(
    "apps/tableside/projects/customer/src/app/example.spec.ts",
    "apps/tableside/projects"
  );

  assert.equal(value, "customer/src/app/example.spec.ts");
});

test("trimProjectsBasePath keeps path when prefix does not match", () => {
  const value = trimProjectsBasePath("libs/shared/src/app/example.spec.ts", "apps/tableside/projects");
  assert.equal(value, "libs/shared/src/app/example.spec.ts");
});
