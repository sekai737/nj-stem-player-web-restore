/**
 * Stage the stem-library-installer Setup exe for bundling into the main player installer.
 * Uses the compressed NSIS setup (~150 MB) instead of win-unpacked (~280 MB+ duplicate Electron).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stemReleaseDir = path.join(projectRoot, "stem-library-installer", "release");
const destDir = path.join(projectRoot, "build", "bundled-stem-library-installer");

const stemPkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "stem-library-installer", "package.json"), "utf8"),
);
const version = stemPkg.version ?? "1.0.0";
const setupName = `${stemPkg.build?.productName ?? stemPkg.name} ${version}.exe`;

function findSetupExe() {
  const direct = path.join(stemReleaseDir, setupName);
  if (fs.existsSync(direct)) return direct;

  if (!fs.existsSync(stemReleaseDir)) return null;
  for (const name of fs.readdirSync(stemReleaseDir)) {
    if (name.endsWith(".exe") && name.includes("Stem Library")) {
      return path.join(stemReleaseDir, name);
    }
  }
  return null;
}

const src = findSetupExe();
if (!src) {
  console.error(`[release] Stem library Setup exe not found in ${stemReleaseDir}`);
  console.error("Run: npm run build --prefix stem-library-installer");
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

const destFile = path.join(destDir, "StemLibraryInstaller.exe");
fs.copyFileSync(src, destFile);
const sizeMb = (fs.statSync(destFile).size / 1024 / 1024).toFixed(1);
console.info(`[release] Staged ${path.basename(src)} as StemLibraryInstaller.exe (${sizeMb} MB)`);
