import assert from "node:assert/strict";
import test from "node:test";
import { renderMarkdown } from "../src/markdown.js";

const textBlock = (type, text, attributes = {}) => ({
  type,
  zone_state: { content: { ops: [{ insert: text, attributes }] } },
  children: [],
});

test("renders headings, inline formatting, and links from readable blocks", () => {
  const result = renderMarkdown({
    title: "Ignored document title",
    root: {
      type: "page",
      children: [
        textBlock("heading1", "Getting started"),
        {
          type: "text",
          zone_state: {
            content: {
              ops: [
                { insert: "Use ", attributes: {} },
                { insert: "Markdown", attributes: { bold: true } },
                { insert: " and ", attributes: {} },
                { insert: "this guide", attributes: { link: "https://example.com" } },
                { insert: ".", attributes: {} },
              ],
            },
          },
          children: [],
        },
      ],
    },
  });

  assert.equal(result, "# Getting started\n\nUse **Markdown** and [this guide](https://example.com).\n");
});

test("renders lists, tasks, quotes, code, tables, and assets", () => {
  const result = renderMarkdown({
    title: "Example",
    root: {
      type: "page",
      children: [
        textBlock("bullet", "First"),
        textBlock("ordered", "Second", { sequence: 2 }),
        { ...textBlock("todo", "Done"), snapshot: { done: true } },
        textBlock("quote", "A quotation"),
        { ...textBlock("code", "const answer = 42;"), snapshot: { language: "javascript" } },
        {
          type: "table",
          snapshot: { rows: [["Name", "Value"], ["Answer", "42"]] },
          children: [],
        },
        {
          type: "image",
          snapshot: { image: { url: "https://example.com/pic.png", name: "Picture" } },
          children: [],
        },
      ],
    },
  });

  assert.equal(
    result,
    "- First\n\n2. Second\n\n- [x] Done\n\n> A quotation\n\n```javascript\nconst answer = 42;\n```\n\n| Name | Value |\n| --- | --- |\n| Answer | 42 |\n\n![Picture](https://example.com/pic.png)\n",
  );
});

test("renders child blocks when an unknown block has no direct Markdown representation", () => {
  const result = renderMarkdown({
    title: "Example",
    root: {
      type: "page",
      children: [{ type: "column", children: [textBlock("text", "Still exported")] }],
    },
  });

  assert.equal(result, "Still exported\n");
});
