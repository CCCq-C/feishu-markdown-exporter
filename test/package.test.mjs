import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";

test("package script selects only Chrome runtime files", () => {
  const result = spawnSync(process.execPath, ["scripts/package-extension.mjs", "--list"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), [
    "manifest.json",
    "popup.html",
    "build/background.js",
    "build/popup.js",
    "src/extractor.js",
    "src/popup.css",
  ]);
});
