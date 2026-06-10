/**
 * Run electron-builder and keep the Windows NSIS uninstaller in release/.
 *
 * Stages the uninstaller only after a successful build so we never touch release/
 * while NSIS is mmap-ing the app archive (avoids EBUSY / mmap failures on Windows).
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

const MIN_UNINSTALLER_BYTES = 128 * 1024;

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

/** Drop stale NSIS intermediates that can break mmap on the next build. */
function cleanStaleNsisArtifactsIn(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith(".nsis.7z") || name.endsWith(".nsis.7z.tmp")) {
      try {
        fs.unlinkSync(path.join(dir, name));
        console.info(`[release] Removed stale ${path.join(dir, name)}`);
      } catch {
        /* locked or already gone */
      }
    }
  }
}

function cleanStaleNsisArtifacts() {
  cleanStaleNsisArtifactsIn(releaseDir);
  cleanStaleNsisArtifactsIn(path.join(projectRoot, "dist"));
}

async function stageUninstallerFrom(src) {
  const expectedSize = await waitForReadySource(src);
  if (!expectedSize) return false;

  const dest = path.join(releaseDir, uninstallerName);
  removeIfExists(dest);
  await copyWithRetry(src, dest);

  const destSize = fs.statSync(dest).size;
  if (destSize !== expectedSize || !isValidPeExecutable(dest)) {
    removeIfExists(dest);
    throw new Error(
      `Uninstaller copy invalid (dest ${destSize} bytes, expected ${expectedSize})`,
    );
  }

  console.log(
    `[release] Staged uninstaller → ${uninstallerName} (${(destSize / 1024 / 1024).toFixed(2)} MB)`,
  );
  return true;
}

async function stageUninstaller() {
  const src = findUninstallerSource();
  if (!src) return false;
  return stageUninstallerFrom(src);
}

/** Copy __uninstaller while NSIS still has it — electron-builder deletes it after the Setup exe is built. */
function watchForUninstallerDuringBuild() {
  let copied = false;

  const timer = setInterval(async () => {
    if (copied) return;

    const src = findUninstallerSource();
    if (!src) return;

    try {
      copied = await stageUninstallerFrom(src);
    } catch (error) {
      console.warn(`[release] Uninstaller staging retry: ${error.message}`);
    }
  }, 500);

  return () => clearInterval(timer);
}

fs.mkdirSync(releaseDir, { recursive: true });
removeIfExists(path.join(releaseDir, uninstallerName));
cleanStaleNsisArtifacts();

const stopUninstallerWatch = watchForUninstallerDuringBuild();

const combinedRelease = process.env.COMBINED_RELEASE === "1";
const builderArgs = combinedRelease ? ["--config", "electron-builder.release.json"] : [];

if (combinedRelease) {
  console.info("[release] Building Windows installer (player + optional stem download)…");
}

const child = spawn("electron-builder", builderArgs, {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

child.on("close", async (code) => {
  stopUninstallerWatch();

  if (code === 0) {
    try {
      const dest = path.join(releaseDir, uninstallerName);
      if (!fs.existsSync(dest)) {
        const staged = await stageUninstaller();
        if (!staged) {
          console.warn(
            `[release] No standalone uninstaller was staged. Use Add/Remove Programs or reinstall via the Setup exe.`,
          );
        }
      }
    } catch (error) {
      console.warn(`[release] Could not stage uninstaller: ${error.message}`);
    }
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
