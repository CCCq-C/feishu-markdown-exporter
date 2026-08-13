import { copyFile, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "manifest.json",
  "popup.html",
  "build/background.js",
  "build/popup.js",
  "src/extractor.js",
  "src/popup.css",
];

if (process.argv.includes("--list")) {
  process.stdout.write(`${JSON.stringify(files)}\n`);
} else {
  const build = spawnSync(process.execPath, ["scripts/build-extension.mjs"], { cwd: root, encoding: "utf8" });
  if (build.status !== 0) throw new Error(build.stderr || "Could not build extension files.");
  const dist = resolve(root, "dist");
  const extension = resolve(root, "extension");
  const chromeArchive = resolve(dist, "feishu-markdown-exporter-chrome.zip");
  const webStoreArchive = resolve(dist, "feishu-markdown-exporter-web-store.zip");
  const legacyArchive = resolve(dist, "feishu-markdown-exporter.zip");
  await mkdir(dist, { recursive: true });
  await rm(extension, { recursive: true, force: true });
  await rm(chromeArchive, { force: true });
  await rm(webStoreArchive, { force: true });
  await rm(legacyArchive, { force: true });
  await mkdir(extension, { recursive: true });

  for (const file of files) {
    const target = resolve(extension, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(root, file), target);
  }

  const chromeZip = spawnSync("zip", ["-r", "-q", chromeArchive, "extension"], { cwd: root, encoding: "utf8" });
  if (chromeZip.status !== 0) throw new Error(chromeZip.stderr || "Could not create Chrome user ZIP.");
  const webStoreZip = spawnSync("zip", ["-r", "-q", webStoreArchive, "."], { cwd: extension, encoding: "utf8" });
  if (webStoreZip.status !== 0) throw new Error(webStoreZip.stderr || "Could not create Chrome Web Store ZIP.");
  process.stdout.write(`${chromeArchive}\n${webStoreArchive}\n`);
}
