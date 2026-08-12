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
  const staging = resolve(dist, "package");
  const archive = resolve(dist, "feishu-markdown-exporter.zip");
  await rm(staging, { recursive: true, force: true });
  await rm(archive, { force: true });
  await mkdir(staging, { recursive: true });

  for (const file of files) {
    const target = resolve(staging, file);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(root, file), target);
  }

  const zip = spawnSync("zip", ["-r", "-q", archive, "."], { cwd: staging, encoding: "utf8" });
  if (zip.status !== 0) throw new Error(zip.stderr || "Could not create extension ZIP.");
  await rm(staging, { recursive: true, force: true });
  process.stdout.write(`${archive}\n`);
}
