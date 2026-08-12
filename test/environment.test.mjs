import assert from "node:assert/strict";
import test from "node:test";
import { inspectEnvironment } from "../scripts/environment.mjs";

const allAvailable = () => true;

test("reports a ready environment when all project prerequisites are available", () => {
  const report = inspectEnvironment({
    nodeVersion: "20.12.0",
    commandAvailable: allAvailable,
    packageAvailable: allAvailable,
  });

  assert.equal(report.status, "ready");
  assert.equal(report.checks.every((check) => check.status === "ok"), true);
});

test("marks missing npm packages as repairable with the local setup command", () => {
  const report = inspectEnvironment({
    nodeVersion: "20.12.0",
    commandAvailable: allAvailable,
    packageAvailable: (name) => name !== "docx",
  });

  assert.equal(report.status, "repairable");
  assert.deepEqual(report.repairable, ["docx"]);
  assert.match(report.nextCommand, /npm run setup/);
});

test("marks missing system prerequisites as manual without hiding repairable packages", () => {
  const report = inspectEnvironment({
    nodeVersion: "18.20.0",
    commandAvailable: (name) => name !== "zip",
    packageAvailable: (name) => name !== "esbuild",
  });

  assert.equal(report.status, "manual");
  assert.deepEqual(report.repairable, ["esbuild"]);
  assert.match(report.checks.find((check) => check.id === "node").nextCommand, /NVM_NODEJS_ORG_MIRROR/);
  assert.match(report.checks.find((check) => check.id === "zip").nextCommand, /zip/);
});
