# Feishu Markdown Exporter Design

## Goal

Deliver a publishable Manifest V3 Chrome extension that exports the document currently open in a supported Feishu or Lark tab to a local Markdown or Word file. Markdown exports include downloadable images; Word exports embed common readable image formats. The user initiates every export from the extension popup.

## Non-goals

- No payment, account, quota, server, analytics, or remote code.
- No access beyond what the currently open Feishu page already renders.
- No extraction when the user cannot read the document.
- No support for legacy `/doc/` pages in the first release.

## Architecture

The popup validates the active tab URL and requests an export. The service worker injects a fixed extractor into the page's `MAIN` world using `chrome.scripting.executeScript`; this is required to read the Feishu page's runtime block model. The extractor waits for the page model, scrolls to let lazy blocks load, serializes a small, JSON-safe tree, and returns it to the extension.

Extension-owned code converts that tree to Markdown or a standard `.docx` file. It extracts headings, paragraphs, quotes, code blocks, ordered and unordered lists, tasks, tables, links, images, and attachments. The Word generator is bundled into the extension at build time; the extension never loads remote code. For Markdown, the service worker downloads accessible image data through the already-authorized tab context and rewrites image paths to a sibling assets directory. For Word, it embeds PNG, JPEG, GIF, and BMP image data in the `.docx`; unsupported or unavailable images become an explicit text placeholder.

## Permissions and privacy

Use only `activeTab`, `scripting`, and `downloads`. `activeTab` grants temporary access only after the user clicks the extension action, avoiding broad host permissions. All data handling is local. The extension does not read browser cookies, save document content, contact any server, or load remote code.

## User flow

1. User opens a readable `*.feishu.cn/wiki|docx` or `*.larkoffice.com/wiki|docx` page.
2. User clicks the extension icon and chooses **Markdown** or **Word**.
3. The popup shows progress, then a success message naming the downloaded file.
4. On unsupported pages, missing page data, or incomplete lazy loading, the popup presents a clear error and does not create an empty file.

## Verification

- Unit tests cover document-model conversion to Markdown and Word, including inline formatting, lists, tables, and assets.
- Build and package checks validate the Manifest V3 bundle and ZIP contents.
- A manual Chrome acceptance check loads the unpacked extension, exports a readable public Wiki page in both formats, and verifies non-empty Markdown plus linked image files and a Word document that opens correctly.
