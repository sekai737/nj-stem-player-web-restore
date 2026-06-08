/**
 * Run electron-builder and keep the Windows NSIS uninstaller in release/.
 *
 * electron-builder generates `__uninstaller-*.exe` during the NSIS build, embeds
 * it in the Setup exe, then deletes the standalone file. We copy it only after
 * the file is fully written (stable size + valid PE header).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(projectRoot, "release");
const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const productName = pkg.build?.productName ?? pkg.name;
const version = pkg.version ?? "0.0.0";
const uninstallerName = `${productName} Uninstall ${version}.exe`;

/** NSIS uninstallers are never tiny — reject partial/empty copies. */
const MIN_UNINSTALLER_BYTES = 128 * 1024;

let staged = false;
let staging = null;

function findUninstallerSource() {
  if (!fs.existsSync(releaseDir)) return null;
  for (const name of fs.readdirSync(releaseDir)) {
    if (name.startsWith("__uninstaller-") && name.endsWith(".exe")) {
      return path.join(releaseDir, name);
    }
  }
  return null;
}

function isValidPeExecutable(filePath) {
  try {
    const fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(2);
    fs.readSync(fd, header, 0, 2, 0);
    fs.closeSync(fd);
    return header[0] === 0x4d && header[1] === 0x5a;
  } catch {
    return false;
  }
}

function isReadyUninstaller(filePath) {
  try {
    const { size } = fs.statSync(filePath);
    return size >= MIN_UNINSTALLER_BYTES && isValidPeExecutable(filePath);
  } catch {
    return false;
  }
}

async function waitForReadySource(src, { attempts = 80, delayMs = 250 } = {}) {
  let lastSize = -1;
  let stableChecks = 0;

  for (let attempt = 0; attempt < attempts; attempt++) {
    let size = 0;
    try {
      size = fs.statSync(src).size;
    } catch {
      stableChecks = 0;
      lastSize = -1;
      await delay(delayMs);
      continue;
    }

    if (size >= MIN_UNINSTALLER_BYTES && size === lastSize) {
      stableChecks++;
      if (stableChecks >= 2 && isValidPeExecutable(src)) {
        return size;
      }
    } else {
      stableChecks = 0;
      lastSize = size;
    }

    await delay(delayMs);
  }

  return null;
}

async function copyWithRetry(src, dest, { attempts = 24, delayMs = 250 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      fs.copyFileSync(src, dest);
      return true;
    } catch (error) {
      const retryable =
        error?.code === "EBUSY" || error?.code === "EPERM" || error?.code === "ENOENT";
      if (!retryable || attempt === attempts) throw error;
      await delay(delayMs);
    }
  }
  return false;
}

function removeIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
}

async function stageUninstaller({ attempts, delayMs, quiet = false } = {}) {
  if (staged) return true;

  const src = findUninstallerSource();
  if (!src) return false;

  const expectedSize = await waitForReadySource(src, { attempts, delayMs });
  if (!expectedSize) return false;

  const dest = path.join(releaseDir, uninstallerName);
  removeIfExists(dest);
  await copyWithRetry(src, dest);

  const destSize = fs.statSync(dest).size;
  if (destSize !== expectedSize || !isReadyUninstaller(dest)) {
    removeIfExists(dest);
    throw new Error(
      `Uninstaller copy invalid (dest ${destSize} bytes, expected ${expectedSize})`,
    );
  }

  staged = true;
  if (!quiet) {
    console.log(
      `[release] Staged uninstaller → ${uninstallerName} (${(destSize / 1024 / 1024).toFixed(2)} MB)`,
    );
  }
  return true;
}

function requestStage() {
  if (staged || staging) return;
  staging = stageUninstaller()
    .catch((error) => {
      if (error?.code !== "ENOENT") {
        console.warn(`[release] Uninstaller staging deferred: ${error.message}`);
      }
    })
    .finally(() => {
      staging = null;
    });
}

fs.mkdirSync(releaseDir, { recursive: true });

// Remove any broken uninstaller left from a prior failed build.
removeIfExists(path.join(releaseDir, uninstallerName));

const watcher = fs.watch(releaseDir, (event, filename) => {
  if (filename?.startsWith("__uninstaller-")) requestStage();
});

const poll = setInterval(requestStage, 500);

const child = spawn("electron-builder", {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

child.on("close", async (code) => {
  clearInterval(poll);
  watcher.close();

  if (!staged) {
    try {
      await stageUninstaller({ attempts: 120, delayMs: 300, quiet: false });
    } catch (error) {
      console.warn(`[release] Could not stage uninstaller: ${error.message}`);
    }
  }

  if (!staged) {
    console.warn(
      `[release] No standalone uninstaller was staged. Use Add/Remove Programs or reinstall via the Setup exe.`,
    );
  }

  process.exit(code ?? 1);
});

child.on("error", async (error) => {
  clearInterval(poll);
  watcher.close();
  console.error(error);
  process.exit(1);
});
