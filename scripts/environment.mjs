import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CHINA_NPM_REGISTRY = "https://registry.npmmirror.com";
export const REQUIRED_PACKAGES = ["docx", "esbuild"];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function inspectEnvironment({
  nodeVersion = process.versions.node,
  commandAvailable = defaultCommandAvailable,
  packageAvailable = defaultPackageAvailable,
} = {}) {
  const checks = [nodeCheck(nodeVersion), commandCheck("npm", commandAvailable), commandCheck("zip", commandAvailable)];
  const repairable = REQUIRED_PACKAGES.filter((name) => !packageAvailable(name));
  for (const name of REQUIRED_PACKAGES) {
    checks.splice(2, 0, {
      id: `package:${name}`,
      label: `npm package: ${name}`,
      status: repairable.includes(name) ? "repairable" : "ok",
      nextCommand: repairable.includes(name) ? "npm run setup" : undefined,
    });
  }

  const manual = checks.filter((check) => check.status === "manual");
  return {
    status: manual.length ? "manual" : repairable.length ? "repairable" : "ready",
    repairable,
    checks,
    nextCommand: repairable.length ? "npm run setup" : manual[0]?.nextCommand,
  };
}

export function formatReport(report) {
  const lines = [`Environment status: ${report.status}`];
  for (const check of report.checks) {
    const suffix = check.nextCommand ? ` → ${check.nextCommand}` : "";
    lines.push(`[${check.status.toUpperCase()}] ${check.label}${suffix}`);
  }
  if (report.repairable.length) lines.push(`Project dependencies can be restored with China mirror: npm run setup`);
  return lines.join("\n");
}

function nodeCheck(version) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  if (Number.isFinite(major) && major >= 20) {
    return { id: "node", label: `Node.js ${version} (requires 20+)`, status: "ok" };
  }
  return {
    id: "node",
    label: `Node.js ${version || "not found"} (requires 20+)`,
    status: "manual",
    nextCommand: "export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node && nvm install 20",
  };
}

function commandCheck(name, commandAvailable) {
  const available = commandAvailable(name);
  if (available) return { id: name, label: `${name} command`, status: "ok" };
  if (name === "npm") {
    return {
      id: name,
      label: "npm command",
      status: "manual",
      nextCommand: "Install Node.js 20+ first; npm is included with Node.js.",
    };
  }
  return {
    id: name,
    label: "zip command",
    status: "manual",
    nextCommand: "macOS: xcode-select --install; Debian/Ubuntu: sudo apt-get install -y zip",
  };
}

function defaultCommandAvailable(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function defaultPackageAvailable(name) {
  return existsSync(resolve(root, "node_modules", name));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = inspectEnvironment();
  process.stdout.write(`${process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report)}\n`);
}
