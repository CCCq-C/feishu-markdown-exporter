import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

async function loadExtractor() {
  const source = await readFile(new URL("../src/extractor.js", import.meta.url), "utf8");
  const context = { globalThis: {}, window: {}, document: {}, setTimeout };
  vm.runInNewContext(source, context);
  return context.globalThis.__feishuMarkdownExtractor;
}

test("normalizes a block tree into JSON-safe Markdown input", async () => {
  const extractor = await loadExtractor();
  const result = extractor.normalizeBlock({
    id: "root",
    type: "page",
    zoneState: { allText: "A document", content: { ops: [{ insert: "ignored", attributes: { bold: true } }] } },
    snapshot: { type: "page", ignored: { circular: true } },
    children: [{
      id: "image-1",
      type: "image",
      zoneState: { content: { ops: [] } },
      snapshot: { type: "image", image: { token: "asset-token", name: "cover.png", url: "https://example.com/cover.png", secret: "ignored" } },
      children: [],
    }],
  });

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    id: "root",
    type: "page",
    zone_state: { all_text: "A document", content: { ops: [{ insert: "ignored", attributes: { bold: true } }] } },
    snapshot: { type: "page" },
    children: [{
      id: "image-1",
      type: "image",
      zone_state: { all_text: "", content: { ops: [] } },
      snapshot: { type: "image", image: { token: "asset-token", name: "cover.png", url: "https://example.com/cover.png" } },
      children: [],
      synced_children: [],
    }],
    synced_children: [],
  });
});

test("rejects an unavailable document model and detects pending blocks", async () => {
  const extractor = await loadExtractor();

  assert.throws(() => extractor.getRoot({}), /Feishu document model is not available/);
  assert.equal(extractor.isReady({ children: [{ type: "text", snapshot: { type: "pending" } }] }), false);
  assert.equal(extractor.isReady({ children: [{ type: "text", snapshot: { type: "text" } }] }), true);
});
