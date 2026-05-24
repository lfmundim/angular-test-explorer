import test from "node:test";
import assert from "node:assert/strict";
import { buildSingleTestItemId, parseSingleTestItemId } from "../src/core/testIdentity";

test("buildSingleTestItemId and parseSingleTestItemId round-trip", () => {
  const id = buildSingleTestItemId("file:///spec.ts", "Suite should run");
  const parsed = parseSingleTestItemId(id);

  assert.deepEqual(parsed, {
    specItemId: "file:///spec.ts",
    testNamePattern: "Suite should run",
  });
});

test("parseSingleTestItemId returns undefined for non-single ids", () => {
  assert.equal(parseSingleTestItemId("file:///spec.ts"), undefined);
  assert.equal(parseSingleTestItemId("::bad"), undefined);
  assert.equal(parseSingleTestItemId("bad::"), undefined);
});
