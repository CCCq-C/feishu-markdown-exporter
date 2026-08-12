import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { renderWord } from "../src/word.js";

const textBlock = (type, text, attributes = {}) => ({
  type,
  zone_state: { content: { ops: [{ insert: text, attributes }] } },
  children: [],
});

test("renders a readable document into a valid Word package", async () => {
  const blob = await renderWord({
    title: "Word export",
    root: {
      type: "page",
      children: [
        textBlock("heading1", "Getting started"),
        textBlock("text", "Use Markdown", { bold: true }),
        { type: "table", snapshot: { rows: [["Name", "Value"], ["Answer", "42"]] }, children: [] },
      ],
    },
  });

  assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.ok(blob.size > 500);

  const directory = await mkdtemp(join(tmpdir(), "feishu-word-export-"));
  const filename = join(directory, "export.docx");
  try {
    await writeFile(filename, Buffer.from(await blob.arrayBuffer()));
    const documentXml = execFileSync("unzip", ["-p", filename, "word/document.xml"], { encoding: "utf8" });
    assert.match(documentXml, /Getting started/);
    assert.match(documentXml, /Use Markdown/);
    assert.match(documentXml, /Answer/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("embeds a readable PNG image into the Word package", async () => {
  const blob = await renderWord({
    title: "Image export",
    root: {
      type: "page",
      children: [{ id: "cover", type: "image", snapshot: { image: { name: "cover.png" } }, children: [] }],
    },
  }, [{
    id: "cover",
    fileName: "cover.png",
    mimeType: "image/png",
    base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLx4QAAAABJRU5ErkJggg==",
  }]);

  const directory = await mkdtemp(join(tmpdir(), "feishu-word-image-"));
  const filename = join(directory, "export.docx");
  try {
    await writeFile(filename, Buffer.from(await blob.arrayBuffer()));
    const fileList = execFileSync("unzip", ["-l", filename], { encoding: "utf8" });
    assert.match(fileList, /word\/media\/.*\.png/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
