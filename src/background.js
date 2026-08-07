import { renderMarkdown } from "./markdown.js";

const documentUrl = /^https:\/\/[^/]+\.(?:feishu\.cn|larkoffice\.com)\/(?:wiki|docx)\//;

export function isSupportedDocumentUrl(url) {
  return documentUrl.test(url ?? "");
}

export function buildDownloadRequest(title, markdown) {
  if (!markdown?.trim()) throw new Error("No readable document content was found on this page.");
  const filename = `${sanitizeFilename(title)}.md`;
  return {
    url: `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`,
    filename,
    saveAs: false,
  };
}

async function exportCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !isSupportedDocumentUrl(tab.url)) {
    throw new Error("Open a readable Feishu or Lark Wiki/Docx document first.");
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["src/extractor.js"],
    world: "MAIN",
  });
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: () => globalThis.__feishuMarkdownExtractor.extract(),
  });
  const documentModel = injection?.result;
  const markdown = renderMarkdown(documentModel);
  const request = buildDownloadRequest(documentModel?.title, markdown);
  await chrome.downloads.download(request);
  return { filename: request.filename };
}

function sanitizeFilename(value) {
  return String(value ?? "untitled")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "untitled";
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "export-current-tab") return undefined;
    exportCurrentTab()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });
}
