# Feishu Markdown Exporter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-only Manifest V3 extension that exports the currently readable Feishu or Lark document to Markdown.

**Architecture:** The popup requests export of the active tab. The service worker injects a fixed page-world extractor, passes its JSON-safe block tree to a local Markdown renderer, then downloads the resulting file. There is no backend or account state.

**Tech Stack:** Manifest V3, browser-native JavaScript modules, Node.js built-in test runner.

---

### Task 1: Extension shell and local development commands

**Files:**
- Create: `package.json`
- Create: `manifest.json`
- Create: `popup.html`
- Create: `src/popup.js`
- Create: `src/popup.css`
- Create: `src/background.js`
- Create: `README.md`

**Step 1: Create the manifest test**

Add `test/manifest.test.js` that loads `manifest.json` and asserts Manifest V3, a popup action, and only `activeTab`, `scripting`, and `downloads` permissions.

**Step 2: Run the test to verify it fails**

Run: `npm test -- test/manifest.test.js`
Expected: FAIL because the manifest does not exist.

**Step 3: Create the minimal shell**

Create the static manifest, accessible popup, background service worker, and npm scripts. The README documents unpacked loading and publication requirements.

**Step 4: Run the test to verify it passes**

Run: `npm test -- test/manifest.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json manifest.json popup.html src test README.md
git commit -m "feat: add extension shell"
```

### Task 2: Markdown renderer

**Files:**
- Create: `test/markdown.test.js`
- Create: `src/markdown.js`

**Step 1: Write failing renderer tests**

Add focused tests for heading, formatted inline text and links, lists/tasks, code/quote blocks, tables, and image placeholders.

**Step 2: Run the tests to verify they fail**

Run: `npm test -- test/markdown.test.js`
Expected: FAIL because `src/markdown.js` does not exist.

**Step 3: Implement the minimum renderer**

Implement `renderMarkdown(documentModel)`, recursively rendering only the supported block types and escaping Markdown characters. Unknown blocks render their child blocks instead of failing the export.

**Step 4: Run the renderer tests**

Run: `npm test -- test/markdown.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/markdown.js test/markdown.test.js
git commit -m "feat: render feishu blocks as markdown"
```

### Task 3: Page-world extractor

**Files:**
- Create: `test/extractor.test.js`
- Create: `src/extractor.js`

**Step 1: Write failing pure-data tests**

Test that the extractor's exported normalizer returns only JSON-safe data, preserves nested blocks and inline operations, and throws a clear error for a missing root model.

**Step 2: Run the test to verify it fails**

Run: `npm test -- test/extractor.test.js`
Expected: FAIL because `src/extractor.js` does not exist.

**Step 3: Implement the fixed extractor**

Implement the root-model readiness check, bounded lazy-load scrolling, safe block-tree serialization, and a `extractFromPage()` entry point. The entry point uses only the current page's visible runtime model; it never reads cookies or sends data externally.

**Step 4: Run extractor tests**

Run: `npm test -- test/extractor.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/extractor.js test/extractor.test.js
git commit -m "feat: extract readable feishu block trees"
```

### Task 4: Export orchestration and popup status

**Files:**
- Create: `test/background.test.js`
- Modify: `src/background.js`
- Modify: `src/popup.js`
- Modify: `src/popup.css`

**Step 1: Write failing orchestration tests**

Test URL validation, readable failure messages, a non-empty data URL download request, and a safe filename generated from the document title.

**Step 2: Run the test to verify it fails**

Run: `npm test -- test/background.test.js`
Expected: FAIL because orchestration helpers are missing.

**Step 3: Implement orchestration**

Inject `src/extractor.js` through `chrome.scripting.executeScript` with `world: "MAIN"`, render returned data locally, and call `chrome.downloads.download`. The popup disables exporting outside supported URLs and reports results without exposing content.

**Step 4: Run orchestration tests**

Run: `npm test -- test/background.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/background.js src/popup.js src/popup.css test/background.test.js
git commit -m "feat: export current feishu tab"
```

### Task 5: Package and validate

**Files:**
- Modify: `README.md`
- Create: `scripts/package-extension.mjs`
- Create: `dist/feishu-markdown-exporter.zip` (generated, ignored)
- Modify: `.gitignore`

**Step 1: Write the failing packaging test**

Add a test that checks the packaging manifest and required extension files are present.

**Step 2: Run the test to verify it fails**

Run: `npm test -- test/package.test.js`
Expected: FAIL before the package script exists.

**Step 3: Implement minimal packaging and release guidance**

Generate a Chrome-uploadable ZIP without tests, docs, or development files. Document publishing steps, privacy disclosure, and the known support boundary.

**Step 4: Run full verification**

Run: `npm test && npm run package && unzip -l dist/feishu-markdown-exporter.zip`
Expected: all tests pass and the ZIP contains the manifest, popup, and `src` modules.

**Step 5: Manual acceptance**

Load the unpacked extension in Chrome, open the provided public Wiki URL, export it, and verify a non-empty Markdown download.

**Step 6: Commit**

```bash
git add .gitignore README.md scripts test
git commit -m "build: package chrome extension"
```
