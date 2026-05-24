import test from "node:test";
import assert from "node:assert/strict";
import { discoverSpecTestsFromSource } from "../src/core/specTestParser";

test("discoverSpecTestsFromSource extracts nested describe + it names", () => {
  const source = `
    describe("Manage", () => {
      describe("Feature", () => {
        it("should run", () => {});
      });
    });
  `;

  const discovered = discoverSpecTestsFromSource(source);
  assert.deepEqual(discovered, [{ name: "should run", fullName: "Manage Feature should run" }]);
});

test("discoverSpecTestsFromSource extracts test() and supports dotted callee", () => {
  const source = `
    describe("Suite", () => {
      test("works", () => {});
      it.only("focused", () => {});
    });
  `;

  const discovered = discoverSpecTestsFromSource(source);
  assert.deepEqual(discovered, [
    { name: "works", fullName: "Suite works" },
    { name: "focused", fullName: "Suite focused" },
  ]);
});

test("discoverSpecTestsFromSource ignores non-literal names", () => {
  const source = `
    const name = "dynamic";
    describe(name, () => {
      it(name, () => {});
    });
  `;

  const discovered = discoverSpecTestsFromSource(source);
  assert.deepEqual(discovered, []);
});
