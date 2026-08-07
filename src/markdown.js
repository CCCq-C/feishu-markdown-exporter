export function renderMarkdown(documentModel) {
  const body = renderBlocks(documentModel?.root?.children ?? []);
  return body ? `${body}\n` : "";
}

function renderBlocks(blocks) {
  return blocks
    .map(renderBlock)
    .filter(Boolean)
    .join("\n\n");
}

function renderBlock(block) {
  const type = String(block?.type ?? "");
  const text = renderInline(block?.zone_state?.content?.ops ?? []);
  const children = renderBlocks(block?.children ?? block?.synced_children ?? []);
  const heading = /^heading([1-9])$/.exec(type);

  if (heading) return `${"#".repeat(Number(heading[1]))} ${text}`;
  if (type === "text" || type === "paragraph") return text;
  if (type === "bullet" || type === "unordered") return text ? `- ${text}` : children;
  if (type === "ordered") return text ? `${block?.snapshot?.seq ?? firstSequence(block) ?? 1}. ${text}` : children;
  if (type === "todo") return text ? `- [${block?.snapshot?.done ? "x" : " "}] ${text}` : children;
  if (type === "quote") return text ? text.split("\n").map((line) => `> ${line}`).join("\n") : children;
  if (type === "code") {
    const language = String(block?.snapshot?.language ?? "");
    return `\`\`\`${language}\n${text}\n\`\`\``;
  }
  if (type === "table") return renderTable(block?.snapshot?.rows);
  if (type === "image") return renderImage(block?.snapshot?.image);
  if (type === "file") return renderFile(block?.snapshot?.file);
  return children || text;
}

function firstSequence(block) {
  return block?.zone_state?.content?.ops?.[0]?.attributes?.sequence;
}

function renderInline(ops) {
  return ops.map((op) => renderPiece(op?.insert ?? "", op?.attributes ?? {})).join("");
}

function renderPiece(insert, attributes) {
  let value = escapeMarkdown(String(insert));
  if (attributes.bold) value = `**${value}**`;
  if (attributes.italic) value = `*${value}*`;
  if (attributes.strikethrough) value = `~~${value}~~`;
  if (attributes.underline) value = `<u>${value}</u>`;

  const link = typeof attributes.link === "string" ? attributes.link : attributes.link?.url;
  return link ? `[${value}](${link})` : value;
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const normalized = rows.map((row) => Array.isArray(row) ? row.map(renderCell) : []);
  const header = normalized[0];
  if (header.length === 0) return "";
  const separator = header.map(() => "---");
  return [header, separator, ...normalized.slice(1)].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function renderCell(value) {
  return escapeMarkdown(String(value ?? "")).replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function renderImage(image) {
  if (!image?.url) return "";
  return `![${image.name ?? "image"}](${image.url})`;
}

function renderFile(file) {
  if (!file?.url) return file?.name ?? "";
  return `[${file.name ?? "attachment"}](${file.url})`;
}

function escapeMarkdown(text) {
  return text.replaceAll("\\", "\\\\").replace(/[\[\]*_`]/g, "\\$&");
}
