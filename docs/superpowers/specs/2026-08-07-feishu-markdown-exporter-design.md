# Feishu Markdown Exporter Design

## Goal

Deliver a publishable Manifest V3 Chrome extension that exports the document currently open in a supported Feishu or Lark tab to a local Markdown file, including downloadable images. The user initiates every export from the extension popup.

## Non-goals

- No payment, account, quota, server, analytics, or remote code.
- No access beyond what the currently open Feishu page already renders.
- No extraction when the user cannot read the document.
- No support for legacy `/doc/` pages in the first release.

## Architecture

The popup validates the active tab URL and requests an export. The service worker injects a fixed extractor into the page's `MAIN` world using `chrome.scripting.executeScript`; this is required to read the Feishu page's runtime block model. The extractor waits for the page model, scrolls to let lazy blocks load, serializes a small, JSON-safe tree, and returns it to the extension.

Extension-owned code converts that tree to Markdown. It extracts headings, paragraphs, quotes, code blocks, ordered and unordered lists, tasks, tables, links, images, and attachments. The service worker downloads the Markdown. It downloads accessible image data through the already-authorized tab context and rewrites image paths to a sibling assets directory. Failed optional assets remain as their original URL; text export still succeeds.

## Permissions and privacy

Use only `activeTab`, `scripting`, and `downloads`. `activeTab` grants temporary access only after the user clicks the extension action, avoiding broad host permissions. All data handling is local. The extension does not read browser cookies, save document content, contact any server, or load remote code.

## User flow

1. User opens a readable `*.feishu.cn/wiki|docx` or `*.larkoffice.com/wiki|docx` page.
2. User clicks the extension icon and chooses **Export Markdown**.
3. The popup shows progress, then a success message naming the downloaded Markdown file.
4. On unsupported pages, missing page data, or incomplete lazy loading, the popup presents a clear error and does not create an empty file.

## Verification

- Unit tests cover document-model to Markdown conversion, including inline formatting, lists, tables, and assets.
- Static checks validate manifest and TypeScript build output.
- A manual Chrome acceptance check loads the unpacked extension, exports the provided public Wiki page, and verifies non-empty Markdown plus linked image files.
