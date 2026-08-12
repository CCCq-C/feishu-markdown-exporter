import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
} from "docx";

const WORD_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const headingLevels = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

export async function renderWord(documentModel, imageAssets = []) {
  const assetsById = new Map(imageAssets.filter((asset) => asset?.id && asset?.base64).map((asset) => [asset.id, asset]));
  const children = renderBlocks(documentModel?.root?.children ?? [], assetsById);
  const document = new Document({
    creator: "Feishu Markdown Exporter",
    title: String(documentModel?.title ?? "Untitled"),
    sections: [{ children: children.length ? children : [new Paragraph("")] }],
  });
  const blob = await Packer.toBlob(document);
  return new Blob([blob], { type: WORD_MIME });
}

function renderBlocks(blocks, assetsById) {
  return blocks.flatMap((block) => renderBlock(block, assetsById));
}

function renderBlock(block, assetsById) {
  const type = String(block?.type ?? "");
  const runs = renderInline(block?.zone_state?.content?.ops ?? []);
  const children = renderBlocks(block?.children ?? block?.synced_children ?? [], assetsById);
  const heading = /^heading([1-9])$/.exec(type);

  if (heading) return [new Paragraph({ heading: headingLevels[Math.min(Number(heading[1]), 6) - 1], children: runs }), ...children];
  if (type === "text" || type === "paragraph") return [new Paragraph({ children: runs }), ...children];
  if (type === "bullet" || type === "unordered") return [new Paragraph({ bullet: { level: 0 }, children: runs }), ...children];
  if (type === "ordered") {
    const sequence = block?.snapshot?.seq ?? firstSequence(block) ?? 1;
    return [new Paragraph({ children: [new TextRun(`${sequence}. `), ...runs] }), ...children];
  }
  if (type === "todo") {
    const marker = block?.snapshot?.done ? "☒ " : "☐ ";
    return [new Paragraph({ children: [new TextRun(marker), ...runs] }), ...children];
  }
  if (type === "quote") return [new Paragraph({ indent: { left: 480 }, border: { left: { color: "9CA3AF", size: 12, space: 8, style: "single" } }, children: runs }), ...children];
  if (type === "code") return [new Paragraph({ shading: { fill: "F3F4F6" }, children: [new TextRun({ text: textFromRuns(block?.zone_state?.content?.ops ?? []), font: "Menlo" })] }), ...children];
  if (type === "table") return [...renderTable(block?.snapshot?.rows), ...children];
  if (type === "image") return [...renderImage(block, assetsById), ...children];
  if (type === "file") return [new Paragraph({ children: fileRuns(block?.snapshot?.file) }), ...children];
  if (runs.length) return [new Paragraph({ children: runs }), ...children];
  return children;
}

function renderInline(ops) {
  return ops.flatMap((op) => {
    const attributes = op?.attributes ?? {};
    const run = new TextRun({
      text: String(op?.insert ?? ""),
      bold: Boolean(attributes.bold),
      italics: Boolean(attributes.italic),
      strike: Boolean(attributes.strikethrough),
      underline: attributes.underline ? { type: UnderlineType.SINGLE } : undefined,
    });
    const link = typeof attributes.link === "string" ? attributes.link : attributes.link?.url;
    return link ? [new ExternalHyperlink({ link, children: [run] })] : [run];
  });
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const normalized = rows.filter(Array.isArray);
  if (!normalized.length) return [];
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: normalized.map((row, rowIndex) => new TableRow({
      children: row.map((cell) => new TableCell({
        shading: rowIndex === 0 ? { fill: "E5E7EB" } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: String(cell ?? ""), bold: rowIndex === 0 })] })],
      })),
    })),
  })];
}

function renderImage(block, assetsById) {
  const asset = assetsById.get(block?.id);
  if (!asset) return [new Paragraph({ children: [new TextRun(`[${block?.snapshot?.image?.name ?? "Image unavailable"}]`)] })];
  const type = imageType(asset.mimeType);
  if (!type) return [new Paragraph({ children: [new TextRun(`[${asset.fileName ?? "Image"}: unsupported image type]`)] })];
  return [new Paragraph({
    children: [new ImageRun({
      data: base64ToBytes(asset.base64),
      type,
      transformation: { width: 600, height: 400 },
      altText: { title: asset.fileName ?? "Image", description: asset.fileName ?? "Image", name: asset.fileName ?? "Image" },
    })],
  })];
}

function fileRuns(file) {
  if (!file?.url) return [new TextRun(file?.name ?? "")];
  return [new ExternalHyperlink({ link: file.url, children: [new TextRun({ text: file.name ?? "Attachment", color: "0563C1", underline: { type: UnderlineType.SINGLE } })] })];
}

function firstSequence(block) {
  return block?.zone_state?.content?.ops?.[0]?.attributes?.sequence;
}

function textFromRuns(ops) {
  return ops.map((op) => String(op?.insert ?? "")).join("");
}

function imageType(mimeType) {
  const mime = String(mimeType ?? "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  if (mime === "image/bmp") return "bmp";
  return undefined;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
