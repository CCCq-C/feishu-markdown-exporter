import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CHINA_NPM_REGISTRY, formatReport, inspectEnvironment } from "./environment.mjs";

export { CHINA_NPM_REGISTRY };

export function resolveRegistry({ argv = process.argv.slice(2), env = process.env } = {}) {
  const flag = argv.find((argument) => argument.startsWith("--registry="));
  return flag?.slice("--registry=".length) || env.NPM_REGISTRY || CHINA_NPM_REGISTRY;
}

export function setupProject({
  inspect = inspectEnvironment,
  runNpm = defaultRunNpm,
  registry = resolveRegistry(),
} = {}) {
  const before = inspect();
  const blockingCheck = before.checks.find((check) => check.status === "manual" && ["node", "npm"].includes(check.id));
  if (blockingCheck) throw new Error(`Cannot set up this project: ${blockingCheck.nextCommand}`);
  if (!before.repairable.length) return { installed: false, report: before, registry };

  runNpm(["install", `--registry=${registry}`]);
  const report = inspect();
  if (report.repairable.length) throw new Error(`Dependencies remain missing: ${report.repairable.join(", ")}.`);
  return { installed: true, report, registry };
}

function defaultRunNpm(args) {
  const result = spawnSync("npm", args, { stdio: "inherit" });
  if (result.error || result.status !== 0) throw result.error || new Error(`npm exited with code ${result.status}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = setupProject();
    const build = spawnSync(process.execPath, ["scripts/build-extension.mjs"], { stdio: "inherit" });
    if (build.error || build.status !== 0) throw build.error || new Error("Build failed.");

    process.stdout.write(`${result.installed ? `Installed dependencies through ${result.registry}.` : "Dependencies are already installed."}\n`);
    process.stdout.write(`${formatReport(result.report)}\n`);
    process.stdout.write("Built extension bundles successfully.\n");
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
