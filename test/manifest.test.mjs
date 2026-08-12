import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("manifest exposes a click-to-export extension with minimal permissions", async () => {
  const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "downloads"]);
  assert.equal(manifest.background.service_worker, "build/background.js");
  assert.equal(manifest.background.type, "module");
});
