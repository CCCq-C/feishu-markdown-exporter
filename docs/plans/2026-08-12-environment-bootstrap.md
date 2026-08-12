# Environment Bootstrap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add self-diagnosis and China-mirror dependency repair for local development environments.

**Architecture:** A dependency-free environment module inspects Node, npm, local npm packages, and `zip`. A setup entry point uses its report to run local `npm install` through a selected registry. README instructions expose the same flow to people and AI agents.

**Tech Stack:** Node.js ESM, Node built-in test runner, npm.

---

### Task 1: Environment inspection

**Files:**
- Create: `test/environment.test.mjs`
- Create: `scripts/environment.mjs`
- Modify: `package.json`

**Step 1: Write failing tests**

Test that missing `docx` is repairable, missing `zip` is manual, and a supported environment is ready.

**Step 2: Verify red**

Run: `node --test test/environment.test.mjs`
Expected: FAIL because `scripts/environment.mjs` does not exist.

**Step 3: Implement the smallest inspector**

Expose `inspectEnvironment()` and return a stable report including status and repair commands. Add `npm run doctor`.

**Step 4: Verify green**

Run: `node --test test/environment.test.mjs`
Expected: PASS.

### Task 2: Local mirror-backed repair

**Files:**
- Create: `test/setup.test.mjs`
- Create: `scripts/setup.mjs`
- Modify: `package.json`

**Step 1: Write failing tests**

Test that setup selects `https://registry.npmmirror.com` by default and respects an explicit registry.

**Step 2: Verify red**

Run: `node --test test/setup.test.mjs`
Expected: FAIL because `scripts/setup.mjs` does not exist.

**Step 3: Implement the smallest setup command**

Run `npm install` only when environment findings are repairable; never write global configuration. Add `npm run setup`.

**Step 4: Verify green**

Run: `node --test test/setup.test.mjs`
Expected: PASS.

### Task 3: AI-readable documentation and delivery verification

**Files:**
- Modify: `README.md`

**Step 1: Document the exact flow**

Document `doctor`, `setup`, the default China mirror, registry override, and manual Node/zip prerequisites.

**Step 2: Full verification**

Run: `npm test && npm run doctor -- --json && npm run build && npm run package && unzip -t dist/feishu-markdown-exporter.zip`
Expected: all tests and package checks pass.

**Step 3: Commit and synchronize**

Commit only feature files, push `feature/initial-export:main` to GitHub and Gitee, and compare remote `main` commit IDs.
