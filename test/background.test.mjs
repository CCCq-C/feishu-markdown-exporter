import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDownloadRequest,
  collectImageAssets,
  isSupportedDocumentUrl,
  rewriteAssetLinks,
} from "../src/background.js";

test("accepts only Feishu and Lark wiki or docx documents", () => {
  assert.equal(isSupportedDocumentUrl("https://waytoagi.feishu.cn/wiki/EZvBw7pJ6iFxMVkeaoZc2TRdnil"), true);
  assert.equal(isSupportedDocumentUrl("https://acme.larkoffice.com/docx/AbCdEf"), true);
  assert.equal(isSupportedDocumentUrl("https://waytoagi.feishu.cn/doc/legacy"), false);
  assert.equal(isSupportedDocumentUrl("https://example.com/wiki/EZvBw7pJ6iFxMVkeaoZc2TRdnil"), false);
});

test("builds a safe non-empty Markdown download request", () => {
  const request = buildDownloadRequest("How to use: AI/Obsidian?", "# Hello\n");

  assert.equal(request.filename, "How to use_ AI_Obsidian_.md");
  assert.match(request.url, /^data:text\/markdown;charset=utf-8,/);
  assert.equal(decodeURIComponent(request.url.split(",")[1]), "# Hello\n");
});

test("rejects empty Markdown instead of downloading an empty file", () => {
  assert.throws(() => buildDownloadRequest("Empty", "   \n"), /No readable document content/);
});

test("collects image placeholders and rewrites them to a local assets folder", () => {
  const assets = collectImageAssets({
    root: {
      type: "page",
      children: [
        { id: "image-1", type: "image", snapshot: { image: { name: "cover.png" } }, children: [] },
        { id: "text-1", type: "text", children: [] },
      ],
    },
  });

  assert.deepEqual(assets, [{ id: "image-1", placeholder: "browser-asset://image/image-1", name: "cover.png" }]);
  assert.equal(
    rewriteAssetLinks("![cover](browser-asset://image/image-1)", [{ ...assets[0], filename: "cover.png" }], "example-assets"),
    "![cover](example-assets/cover.png)",
  );
});
