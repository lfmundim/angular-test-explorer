import test from "node:test";
import assert from "node:assert/strict";
import {
  collectRequestedTests,
  isTestItemLike,
  resolveCommandTargets,
  type TestItemLike,
} from "../src/core/testSelection";

test("isTestItemLike returns true for object with id and label", () => {
  const value = { id: "a", label: "spec" };
  assert.equal(isTestItemLike(value), true);
});

test("isTestItemLike returns false for invalid values", () => {
  assert.equal(isTestItemLike(null), false);
  assert.equal(isTestItemLike("x"), false);
  assert.equal(isTestItemLike({ id: "a" }), false);
});

test("resolveCommandTargets returns single item for direct test item argument", () => {
  const item: TestItemLike = { id: "1", label: "one" };
  const resolved = resolveCommandTargets([item], isTestItemLike);

  assert.deepEqual(resolved, [item]);
});

test("resolveCommandTargets filters arrays by guard", () => {
  const itemA: TestItemLike = { id: "1", label: "one" };
  const itemB: TestItemLike = { id: "2", label: "two" };

  const resolved = resolveCommandTargets([[itemA, { bad: true }, itemB]], isTestItemLike);
  assert.deepEqual(resolved, [itemA, itemB]);
});

test("resolveCommandTargets returns empty array for unsupported arg", () => {
  const resolved = resolveCommandTargets([123], isTestItemLike);
  assert.deepEqual(resolved, []);
});

test("collectRequestedTests returns include values when provided", () => {
  const include = [{ id: "1", label: "one" }];
  const all = [{ id: "2", label: "two" }];

  const collected = collectRequestedTests(include, all);
  assert.deepEqual(collected, include);
  assert.notEqual(collected, include);
});

test("collectRequestedTests falls back to all when include is empty", () => {
  const include: TestItemLike[] = [];
  const all = [{ id: "2", label: "two" }];

  const collected = collectRequestedTests(include, all);
  assert.deepEqual(collected, all);
  assert.notEqual(collected, all);
});
