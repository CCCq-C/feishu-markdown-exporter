(() => {
  function safeJson(value) {
    try {
      return JSON.parse(JSON.stringify(value ?? null));
    } catch {
      return null;
    }
  }

  function simplifyOps(ops) {
    if (!Array.isArray(ops)) return [];
    return ops.map((op) => ({
      insert: typeof op?.insert === "string" ? op.insert : "",
      attributes: safeJson(op?.attributes ?? {}) ?? {},
    }));
  }

  function simplifySnapshot(block) {
    const snapshot = block?.snapshot ?? {};
    const base = { type: snapshot.type ?? block?.type ?? "" };

    if (block?.type === "ordered") return { ...base, seq: snapshot.seq ?? "" };
    if (block?.type === "todo") return { ...base, done: Boolean(snapshot.done) };
    if (block?.type === "code") return { ...base, language: snapshot.language ?? "" };
    if (block?.type === "table") return { ...base, rows: safeJson(snapshot.rows ?? []) ?? [] };
    if (block?.type === "image") {
      return {
        ...base,
        image: {
          token: snapshot.image?.token ?? "",
          name: snapshot.image?.name ?? "",
          url: snapshot.image?.url ?? `browser-asset://image/${block?.id ?? "unknown"}`,
        },
      };
    }
    if (block?.type === "file") {
      return {
        ...base,
        file: {
          token: snapshot.file?.token ?? "",
          name: snapshot.file?.name ?? "",
          url: snapshot.file?.url ?? "",
        },
      };
    }
    return base;
  }

  function normalizeBlock(block) {
    if (!block) return null;
    const synced = block?.innerBlockManager?.rootBlockModel?.children;
    return {
      id: block.id ?? null,
      type: block.type ?? block?.snapshot?.type ?? "",
      zone_state: {
        all_text: block?.zoneState?.allText ?? "",
        content: { ops: simplifyOps(block?.zoneState?.content?.ops) },
      },
      snapshot: simplifySnapshot(block),
      children: Array.isArray(block.children) ? block.children.map(normalizeBlock).filter(Boolean) : [],
      synced_children: Array.isArray(synced) ? synced.map(normalizeBlock).filter(Boolean) : [],
    };
  }

  function getRoot(page = window) {
    const root = page?.PageMain?.blockManager?.rootBlockModel;
    if (!root) throw new Error("Feishu document model is not available. Open a readable /wiki or /docx page first.");
    return root;
  }

  function isReady(root) {
    const children = Array.isArray(root?.children) ? root.children : [];
    return children.every((block) => {
      const pending = block?.snapshot?.type === "pending";
      const syncedPending = block?.type === "synced_reference" && !block?.isAllDataReady;
      const whiteboardPending = block?.type === "fallback" && block?.snapshot?.type === "whiteboard";
      return !pending && !syncedPending && !whiteboardPending;
    });
  }

  function scrollToLoadMore() {
    const container = document.querySelector("#mainBox .bear-web-x-container");
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
  }

  function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  async function extract() {
    const root = getRoot();
    for (let round = 0; round < 100; round += 1) {
      if (isReady(root)) {
        return {
          title: String(root?.zoneState?.allText ?? document.title ?? "untitled").replace(/[\r\n]+/g, " ").trim(),
          root: normalizeBlock(root),
        };
      }
      scrollToLoadMore();
      await sleep(400);
    }
    throw new Error("The document did not finish loading. Scroll through it once and try again.");
  }

  function findBlock(block, targetId) {
    if (!block) return null;
    if (block.id === targetId) return block;
    const nested = [...(block.children ?? []), ...(block?.innerBlockManager?.rootBlockModel?.children ?? [])];
    for (const child of nested) {
      const match = findBlock(child, targetId);
      if (match) return match;
    }
    return null;
  }

  async function extractImage(blockId) {
    const block = findBlock(getRoot(), blockId);
    const image = block?.snapshot?.image;
    if (!image || !block?.imageManager?.fetch) return null;
    const sources = await new Promise((resolve, reject) => {
      block.imageManager.fetch({ token: image.token, isHD: true, fuzzy: false }, {}, resolve).catch(reject);
    });
    if (!sources?.src) return null;
    const response = await fetch(sources.src, { credentials: "include" });
    if (!response.ok) throw new Error("Image download failed.");
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return {
      base64,
      fileName: image.name || `image-${blockId}.${blob.type.split("/")[1] || "png"}`,
      mimeType: blob.type || "image/png",
    };
  }

  globalThis.__feishuMarkdownExtractor = { extract, extractImage, getRoot, isReady, normalizeBlock };
})();
