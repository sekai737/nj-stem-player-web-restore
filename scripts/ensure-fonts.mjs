/**
 * Ensures public/fonts/*.woff2 exist before dev/build.
 * Noto: copied from @fontsource. Swis721/Swiss: fonts:build when missing.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncNotoFonts } from "./sync-noto-fonts.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "fonts");

const LICENSED_REQUIRED = [
  "swis721-bt-roman.woff2",
  "swis721-bt-bold.woff2",
  "swiss-721-regular.woff2",
  "swiss-721-medium.woff2",
];

const NOTO_REQUIRED = [
  "NOTOSANSKR-VF.woff2",
  "NOTOSANSJP-REGULAR.woff2",
  "NOTOSANSJP-LIGHT.woff2",
  "noto-sans-kr-light.woff2",
];

function isValidWoff2(path) {
  try {
    const buf = readFileSync(path);
    return (
      buf.length >= 4 &&
      buf[0] === 0x77 &&
      buf[1] === 0x4f &&
      buf[2] === 0x46 &&
      buf[3] === 0x32
    );
  } catch {
    return false;
  }
}

try {
  syncNotoFonts();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const missingNoto = NOTO_REQUIRED.filter((name) => !isValidWoff2(join(OUT_DIR, name)));
if (missingNoto.length > 0) {
  console.error(`Noto web fonts missing after sync: ${missingNoto.join(", ")}`);
  process.exit(1);
}

const missingLicensed = LICENSED_REQUIRED.filter((name) => !isValidWoff2(join(OUT_DIR, name)));
if (missingLicensed.length === 0) {
  process.exit(0);
}

console.log(
  `Missing or corrupt web font(s): ${missingLicensed.join(", ")}\nRunning fonts:build (see public/fonts/README.md)…`,
);
const result = spawnSync(process.execPath, ["scripts/build-fonts.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
