import assert from "node:assert/strict";
import test from "node:test";
import { CHINA_NPM_REGISTRY, resolveRegistry, setupProject } from "../scripts/setup.mjs";

test("uses the China npm registry by default", () => {
  assert.equal(resolveRegistry({ argv: [], env: {} }), CHINA_NPM_REGISTRY);
});

test("allows an explicit registry override", () => {
  assert.equal(
    resolveRegistry({ argv: ["--registry=https://registry.npmjs.org"], env: { NPM_REGISTRY: "https://example.invalid" } }),
    "https://registry.npmjs.org",
  );
});

test("repairs only missing project packages through the selected registry", () => {
  const calls = [];
  let inspectionCount = 0;
  const result = setupProject({
    inspect: () => {
      inspectionCount += 1;
      return inspectionCount === 1
        ? { repairable: ["docx"], checks: [], status: "repairable" }
        : { repairable: [], checks: [], status: "ready" };
    },
    runNpm: (args) => calls.push(args),
    registry: "https://registry.npmmirror.com",
  });

  assert.deepEqual(calls, [["install", "--registry=https://registry.npmmirror.com"]]);
  assert.equal(result.installed, true);
  assert.equal(result.report.status, "ready");
});

test("does not run npm when Node or npm must be installed manually", () => {
  assert.throws(() => setupProject({
    inspect: () => ({
      repairable: ["docx"],
      checks: [{ id: "npm", status: "manual", nextCommand: "Install Node.js" }],
      status: "manual",
    }),
    runNpm: () => assert.fail("npm must not run"),
  }), /Install Node\.js/);
});
