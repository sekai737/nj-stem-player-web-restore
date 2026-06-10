/**
 * Build the pure NSIS stem library installer (no Electron).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nsisDir = path.join(root, "nsis");
const releaseDir = path.join(root, "release");

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version ?? "1.0.0";
const productName = pkg.productName ?? "NewJeans Stem Library Installer";
const outFile = path.join(releaseDir, `${productName} ${version}.exe`);

function findMakensis() {
  const localAppData = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
  const cacheRoot = path.join(localAppData, "electron-builder", "Cache", "nsis");
  if (fs.existsSync(cacheRoot)) {
    for (const name of fs.readdirSync(cacheRoot)) {
      const candidate = path.join(cacheRoot, name, "Bin", "makensis.exe");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return "makensis";
}

fs.mkdirSync(releaseDir, { recursive: true });

const makensis = findMakensis();
const defines = [`/DOUTFILE=${outFile}`, `/DPRODUCT_VERSION=${version}`];

console.info(`[stem-installer] Building ${path.basename(outFile)} with ${makensis}`);
execFileSync(makensis, [...defines, path.join(nsisDir, "stem-library.nsi")], {
  cwd: nsisDir,
  stdio: "inherit",
});

if (!fs.existsSync(outFile)) {
  console.error(`[stem-installer] Build failed — missing ${outFile}`);
  process.exit(1);
}

const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
console.info(`[stem-installer] Ready: ${outFile} (${sizeMb} MB)`);
