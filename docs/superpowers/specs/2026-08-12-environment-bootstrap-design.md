# Environment Bootstrap Design

## Goal

Make local setup self-diagnosing: an AI or developer can detect missing project prerequisites, restore npm dependencies through a China-friendly registry, and receive explicit commands for prerequisites that must be installed by the user.

## Scope

- Check Node.js version (20 or newer), npm availability, the locked npm packages (`docx` and `esbuild`), and the `zip` command used for packaging.
- Provide `npm run doctor` with human-readable output and machine-readable JSON.
- Provide `npm run setup`, which installs project dependencies through `https://registry.npmmirror.com` by default without changing global npm configuration.
- Document an AI-safe order of operations and China-mirror commands in the README.

## Boundaries

- The setup script may run `npm install` only for this repository after Node and npm are already available.
- It must not silently install Node.js, Homebrew, `zip`, browser software, or change global npm configuration. Those are system-level changes that need user approval.
- A caller can override the npm registry with `--registry=<url>` or `NPM_REGISTRY=<url>`.

## Design

`scripts/environment.mjs` contains pure inspection helpers plus a command-line entry point. It reports every prerequisite with a status (`ok`, `repairable`, or `manual`), the required version when applicable, and a next command. `npm run doctor` invokes this entry point; `--json` produces a stable structured report for AI agents.

`scripts/setup.mjs` imports the inspection helper. It stops with an actionable message when Node/npm are unavailable or incompatible. Otherwise it executes `npm install --registry=<selected registry>` in the project root and reruns the inspection. The default registry is `https://registry.npmmirror.com` and no persistent npm settings are written.

The README tells users and AI agents to run `npm run doctor` first, then `npm run setup` only for repairable project dependencies. It separately lists the Node and `zip` commands with a China-mirror option for Node via nvm, making the manual/system boundary explicit.

## Verification

- Tests simulate missing and present dependencies through injected command/file probes.
- Tests prove the default registry and a caller override are passed to npm.
- Tests cover JSON report shape and manual versus repairable status.
- Full project tests, build, package, and ZIP integrity checks pass after setup.
