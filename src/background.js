import { renderMarkdown } from "./markdown.js";
import { renderWord } from "./word.js";

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

export async function buildWordDownloadRequest(title, wordDocument) {
  if (!wordDocument || wordDocument.size === 0) throw new Error("No readable document content was found on this page.");
  return {
    url: await blobToDataUrl(wordDocument),
    filename: `${sanitizeFilename(title)}.docx`,
    saveAs: false,
  };
}

export function collectImageAssets(documentModel) {
  const assets = [];
  const visit = (block) => {
    if (!block) return;
    if (block.type === "image" && block.id) {
      assets.push({
        id: block.id,
        placeholder: `browser-asset://image/${block.id}`,
        name: block.snapshot?.image?.name || "image.png",
      });
    }
    const children = block.synced_children?.length ? block.synced_children : block.children;
    for (const child of children ?? []) visit(child);
  };
  visit(documentModel?.root);
  return assets;
}

export function rewriteAssetLinks(markdown, assets, folder) {
  return assets.reduce((output, asset) => output.replaceAll(asset.placeholder, `${folder}/${asset.filename}`), markdown);
}

async function exportCurrentTab(format = "markdown") {
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
  const title = documentModel?.title;
  const images = collectImageAssets(documentModel);
  const downloadedImages = [];
  const usedNames = new Set();
  for (const image of images) {
    const [imageInjection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: (blockId) => globalThis.__feishuMarkdownExtractor.extractImage(blockId),
      args: [image.id],
    });
    const payload = imageInjection?.result;
    if (!payload?.base64) continue;
    const filename = uniqueFilename(payload.fileName || image.name, usedNames);
    downloadedImages.push({ ...image, ...payload, fileName: filename, filename });
  }
  if (format === "word") {
    const request = await buildWordDownloadRequest(title, await renderWord(documentModel, downloadedImages));
    await chrome.downloads.download(request);
    return { filename: request.filename };
  }

  const assetsFolder = `${sanitizeFilename(title)}-assets`;
  for (const image of downloadedImages) {
    await chrome.downloads.download({
      url: `data:${image.mimeType || "image/png"};base64,${image.base64}`,
      filename: `${assetsFolder}/${image.filename}`,
      saveAs: false,
    });
  }
  const markdown = rewriteAssetLinks(renderMarkdown(documentModel), downloadedImages, assetsFolder)
    .replaceAll("browser-asset://image/", "image-unavailable-");
  const request = buildDownloadRequest(title, markdown);
  await chrome.downloads.download(request);
  return { filename: request.filename };
}

async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

function sanitizeFilename(value) {
  return String(value ?? "untitled")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "untitled";
}

function uniqueFilename(value, used) {
  const safe = sanitizeFilename(value);
  const dot = safe.lastIndexOf(".");
  const stem = dot > 0 ? safe.slice(0, dot) : safe;
  const extension = dot > 0 ? safe.slice(dot) : "";
  let candidate = safe;
  let index = 1;
  while (used.has(candidate)) candidate = `${stem}-${index++}${extension}`;
  used.add(candidate);
  return candidate;
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "export-current-tab") return undefined;
    exportCurrentTab(message?.format)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  });
}
