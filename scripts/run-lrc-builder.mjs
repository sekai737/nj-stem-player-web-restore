#!/usr/bin/env node
/**
 * Run lrc-builder/main.py with a discovered Python executable.
 * Usage: node scripts/run-lrc-builder.mjs [--refresh-index] [--song slug] [--limit N]
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const builderDir = path.join(root, "lrc-builder");
const venvPython = path.join(builderDir, ".venv", "Scripts", "python.exe");
const venvPythonUnix = path.join(builderDir, ".venv", "bin", "python");

const winPython314 =
  process.env.LOCALAPPDATA &&
  path.join(process.env.LOCALAPPDATA, "Programs", "Python", "Python314", "python.exe");

const candidates = [
  process.env.LRC_PYTHON,
  existsSync(venvPython) ? venvPython : null,
  existsSync(venvPythonUnix) ? venvPythonUnix : null,
  winPython314 && existsSync(winPython314) ? winPython314 : null,
  "py",
  "python3",
  "python",
].filter(Boolean);

function tryRun(exe, args) {
  const result = spawnSync(exe, args, {
    cwd: builderDir,
    stdio: "inherit",
    shell: exe === "py",
  });
  return result.status ?? 1;
}

const extraArgs = process.argv.slice(2);
let lastStatus = 1;

for (const exe of candidates) {
  if (exe === "py") {
    const version = spawnSync("py", ["-3", "-c", "import sys; print(sys.version)"], {
      encoding: "utf8",
      shell: true,
    });
    if (version.status !== 0) continue;
    lastStatus = tryRun("py", ["-3", "main.py", ...extraArgs]);
  } else {
    const check = spawnSync(exe, ["--version"], { encoding: "utf8", shell: true });
    if (check.status !== 0) continue;
    lastStatus = tryRun(exe, ["main.py", ...extraArgs]);
  }

  if (lastStatus === 0) process.exit(0);
}

console.error(`
Could not run the LRC builder — Python 3 is required.

1. Install Python 3 from https://www.python.org/downloads/
2. cd lrc-builder
3. python -m venv .venv
4. .venv\\Scripts\\activate
5. pip install -r requirements.txt
6. npm run lyrics:build
`);
process.exit(lastStatus);
