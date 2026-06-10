#!/usr/bin/env node
/**
 * Ensures the Electron platform binary is extracted under node_modules/electron.
 * On Windows, extract-zip can fail silently; use Expand-Archive instead.
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { downloadArtifact } = require("@electron/get");
const extract = require("extract-zip");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const electronDir = path.join(root, "node_modules", "electron");
const { version } = JSON.parse(
  fs.readFileSync(path.join(electronDir, "package.json"), "utf8"),
);
const platformPath = process.platform === "win32" ? "electron.exe" : "electron";
const distDir = path.join(electronDir, "dist");
const pathTxt = path.join(electronDir, "path.txt");
const executable = path.join(distDir, platformPath);

function isInstalled() {
  try {
    const distVersion = fs.readFileSync(path.join(distDir, "version"), "utf8").replace(/^v/, "");
    const savedPath = fs.readFileSync(pathTxt, "utf8").trim();
    return distVersion === version && savedPath === platformPath && fs.existsSync(executable);
  } catch {
    return false;
  }
}

async function extractZip(zipPath, destination) {
  fs.mkdirSync(destination, { recursive: true });

  if (process.platform === "win32") {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: "inherit" },
    );
    return;
  }

  await extract(zipPath, { dir: destination });
}

async function main() {
  if (isInstalled()) {
    console.log(`Electron ${version} already installed.`);
    return;
  }

  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  console.log(`Downloading Electron ${version} for ${process.platform}-${process.arch}…`);
  const zipPath = await downloadArtifact({
    version,
    artifactName: "electron",
    platform: process.platform,
    arch: process.arch,
  });

  console.log(`Extracting ${zipPath}…`);
  await extractZip(zipPath, distDir);
  // No trailing newline — electron's index.js joins path.txt without trimming.
  await fs.promises.writeFile(pathTxt, platformPath, "utf8");

  if (!fs.existsSync(executable)) {
    throw new Error(`Electron executable missing after extract: ${executable}`);
  }

  console.log(`Electron ready: ${executable}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
