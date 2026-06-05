/**
 * Converts licensed TTF/OTF files from fonts-source/ to public/fonts/*.woff2
 * @see fonts-source/README.md
 */
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { compress } from "wawoff2";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(ROOT, "fonts-source");
const OUT_DIR = join(ROOT, "public", "fonts");
const FONT_SEARCH_DIRS = [
  SOURCE_DIR,
  process.env.WINDOWS_FONTS_DIR,
  join(homedir(), "AppData", "Local", "Microsoft", "Windows", "Fonts"),
  process.platform === "win32" ? "C:\\Windows\\Fonts" : null,
].filter(Boolean);

/**
 * Where to look for COOL_FONT sources.
 * `requireCoolInStem`: under flat dirs (`C:\\Windows\\Fonts`), only use files whose stem or full
 * path looks COOL-related — Explorer’s `Fonts\\COOL FONT` is often a virtual family view, not a
 * real folder, while the real `.otf` files live next to the other system fonts.
 * @returns {{ path: string, requireCoolInStem: boolean }[]}
 */
function getCoolSearchRoots() {
  /** @type {{ path: string, requireCoolInStem: boolean }[]} */
  const roots = [];
  const seen = new Set();

  function add(path, requireCoolInStem) {
    if (!path) return;
    const key = `${path}\0${requireCoolInStem}`;
    if (seen.has(key)) return;
    seen.add(key);
    roots.push({ path, requireCoolInStem });
  }

  for (const p of [process.env.COOL_FONT_DIR, join(SOURCE_DIR, "cool-font")].filter(Boolean)) {
    add(p, false);
  }

  if (process.platform === "win32") {
    const fontsRoot = join("C:", "Windows", "Fonts");
    // Hint / compatibility: user often points here; may not exist as a real directory.
    add(join(fontsRoot, "COOL FONT"), false);

    if (existsSync(fontsRoot)) {
      for (const name of ["COOL_FONT", "Cool Font", "CoolFont"]) {
        const p = join(fontsRoot, name);
        if (existsSync(p)) add(p, false);
      }
      try {
        for (const ent of readdirSync(fontsRoot, { withFileTypes: true })) {
          if (!ent.isDirectory()) continue;
          if (!/cool/i.test(ent.name)) continue;
          add(join(fontsRoot, ent.name), false);
        }
      } catch {
        /* ignore */
      }
    }

    if (existsSync(fontsRoot)) add(fontsRoot, true);
    const userFonts = join(homedir(), "AppData", "Local", "Microsoft", "Windows", "Fonts");
    if (existsSync(userFonts)) add(userFonts, true);
  }

  return roots;
}

const COOL_SEARCH_ROOTS = getCoolSearchRoots();

/**
 * Each slot: output woff2 + test on normalizeFontStem(basename).
 * Windows COOL FONT files are often named without spaces (e.g. coolfontcloud.otf);
 * \b word boundaries fail on those, so use substring checks. Pix-outlined must run
 * before Pixel so "pixoutlined" does not pick the Pixel slot.
 */
const COOL_FONT_SLOTS = [
  { out: "cool-font-cloud.woff2", test: (n) => /cloud/i.test(n) },
  { out: "cool-font-simplified.woff2", test: (n) => /simplified/i.test(n) },
  { out: "cool-font-goop.woff2", test: (n) => /goop/i.test(n) },
  {
    out: "cool-font-pix-outlined.woff2",
    test: (n) =>
      /pix\s*[-_]?\s*outlined|pixoutlined|outlined\s*[-_]?\s*pix|pix[-_]outlined/i.test(n),
  },
  {
    out: "cool-font-pixel.woff2",
    test: (n) => /pixel/i.test(n) && !/outlined/i.test(n) && !/pixoutlined/i.test(n),
  },
  { out: "cool-font-distorted.woff2", test: (n) => /distorted/i.test(n) },
  { out: "cool-font-fire.woff2", test: (n) => /fire/i.test(n) },
  { out: "cool-font-fluid.woff2", test: (n) => /fluid/i.test(n) },
  {
    out: "cool-font-regular.woff2",
    test: (n) =>
      (/regular/i.test(n) && !/irregular/i.test(n)) ||
      n === "coolfont" ||
      n === "cool font",
  },
  { out: "cool-font-structured.woff2", test: (n) => /structured/i.test(n) },
];

/** Canonical source basename (without extension) → output woff2 name */
const FONT_SLOTS = [
  {
    key: "swiss-721-regular",
    out: "Swiss-721-Regular.woff2",
    aliases: [/swiss[\s_-]*721[\s_-]*regular/i, /swiss[\s_-]*721[\s_-]*roman/i],
    windowsNames: ["Swiss721BT-Regular.ttf", "Swiss721BTRegular.ttf", "Swiss 721 Regular Condensed.otf"],
  },
  {
    key: "swiss-721-medium",
    out: "Swiss-721-Medium.woff2",
    aliases: [/swiss[\s_-]*721[\s_-]*medium/i],
    windowsNames: ["Swis721_Md_BT_Medium.ttf", "Swiss 721 Medium.otf"],
  },
  {
    key: "swiss-721-light",
    out: "Swiss-721-Light.woff2",
    aliases: [/swiss[\s_-]*721[\s_-]*light/i],
    windowsNames: ["Swiss 721 Light.otf", "Swiss721BT-Light.ttf"],
  },
];

function matchInDir(dir, slot) {
  if (!existsSync(dir)) return null;
  const lowerKey = slot.key.toLowerCase();
  /** @type {string[]} */
  const candidates = [];
  for (const name of readdirSync(dir)) {
    if (!/\.(ttf|otf)$/i.test(name)) continue;
    const stem = name.replace(/\.[^.]+$/i, "");
    if (stem.toLowerCase() === lowerKey || slot.aliases.some((re) => re.test(stem))) {
      candidates.push(join(dir, name));
    }
  }
  if (candidates.length > 0) {
    const upright = candidates.find((p) => !/italic/i.test(basename(p)));
    return upright ?? candidates[0];
  }
  for (const winName of slot.windowsNames ?? []) {
    if (/italic/i.test(winName)) continue;
    const path = join(dir, winName);
    if (existsSync(path)) return path;
  }
  for (const winName of slot.windowsNames ?? []) {
    const path = join(dir, winName);
    if (existsSync(path)) return path;
  }
  return null;
}

function findSourceFile(slot) {
  for (const dir of FONT_SEARCH_DIRS) {
    const match = matchInDir(dir, slot);
    if (match) return match;
  }
  return null;
}

function isValidWoff2(buffer) {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x77 &&
    buffer[1] === 0x4f &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x32
  );
}

function normalizeFontStem(filename) {
  return filename
    .replace(/\.[^.]+$/i, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** For flat Windows font dirs: avoid matching unrelated files (e.g. Arial) on style keywords. */
function passesCoolFlatFilter(fullPath, normalizedStem, requireCoolInStem) {
  if (!requireCoolInStem) return true;
  if (/cool/i.test(normalizedStem)) return true;
  const fp = fullPath.replace(/\\/g, "/").toLowerCase();
  if (fp.includes("cool font") || fp.includes("cool_font") || fp.includes("coolfont")) return true;
  return false;
}

/** All .ttf/.otf/.ttc under a COOL tree (recursive — Windows installers often use subfolders). */
function* iterCoolFontFiles(dir, depth = 0) {
  if (depth > 12 || !existsSync(dir)) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    console.warn(`  (cannot read directory: ${dir})`);
    return;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* iterCoolFontFiles(full, depth + 1);
    } else if (/\.(ttf|otf|ttc)$/i.test(ent.name)) {
      yield full;
    }
  }
}

function findCoolSourceFile(slot, usedPaths) {
  for (const { path: dir, requireCoolInStem } of COOL_SEARCH_ROOTS) {
    if (!existsSync(dir)) continue;
    for (const full of iterCoolFontFiles(dir)) {
      if (usedPaths.has(full)) continue;
      const n = normalizeFontStem(basename(full));
      if (!passesCoolFlatFilter(full, n, requireCoolInStem)) continue;
      if (slot.test(n)) return full;
    }
  }
  return null;
}

/** When COOL slots skip, print how many font files were seen and sample stems (for matcher tuning). */
function logCoolFontHints() {
  console.warn("\n  COOL FONT hints (no match for some slots):");
  for (const { path: dir, requireCoolInStem } of COOL_SEARCH_ROOTS) {
    if (!existsSync(dir)) {
      console.warn(`    — missing: ${dir}`);
      continue;
    }
    const stems = [];
    for (const full of iterCoolFontFiles(dir)) {
      const n = normalizeFontStem(basename(full));
      if (!passesCoolFlatFilter(full, n, requireCoolInStem)) continue;
      stems.push(n);
    }
    const tag = requireCoolInStem ? " [flat: COOL filter]" : "";
    const uniq = [...new Set(stems)].sort();
    console.warn(`    — ${dir}${tag}: ${stems.length} candidate file(s), ${uniq.length} unique stem(s)`);
    if (uniq.length) {
      const sample = uniq.slice(0, 20);
      console.warn(`      sample stems: ${sample.join("; ")}${uniq.length > 20 ? " …" : ""}`);
    }
  }
  const winFonts = process.platform === "win32" ? join("C:", "Windows", "Fonts") : null;
  if (winFonts && !existsSync(join(winFonts, "COOL FONT"))) {
    console.warn(
      `    Note: "${join(winFonts, "COOL FONT")}" is not a real folder on many Windows builds;`,
    );
    console.warn("          fonts are still searched under C:\\Windows\\Fonts and Local\\…\\Windows\\Fonts.");
  }
  if (process.env.COOL_FONT_DIR) {
    console.warn(`    COOL_FONT_DIR=${process.env.COOL_FONT_DIR}`);
  } else {
    console.warn("    Tip: set COOL_FONT_DIR to a folder of COOL .otf/.ttf copies, or use fonts-source/cool-font.");
  }
}

/** wawoff2 compress is not safe to run in parallel (native race corrupts output). */
async function convertSlot(slot) {
  const src = findSourceFile(slot);
  if (!src) {
    console.warn(`  skip ${slot.key} — no fonts-source/${slot.key}.ttf or .otf`);
    return false;
  }
  const input = await readFile(src);
  const woff2 = await compress(input);
  if (!isValidWoff2(woff2)) {
    throw new Error(`${slot.out}: compress produced invalid WOFF2 (re-run fonts:build)`);
  }
  await writeFile(join(OUT_DIR, slot.out), woff2);
  console.log(`  ok ${slot.out} ← ${basename(src)} (${(woff2.length / 1024).toFixed(1)} KB)`);
  return true;
}

async function convertCoolSlot(slot, usedPaths) {
  const src = findCoolSourceFile(slot, usedPaths);
  if (!src) {
    console.warn(`  skip ${slot.out} — no matching .ttf/.otf/.ttc in COOL search roots`);
    return false;
  }
  usedPaths.add(src);
  const input = await readFile(src);
  const woff2 = await compress(input);
  if (!isValidWoff2(woff2)) {
    throw new Error(`${slot.out}: compress produced invalid WOFF2 (re-run fonts:build)`);
  }
  await writeFile(join(OUT_DIR, slot.out), woff2);
  console.log(`  ok ${slot.out} ← ${basename(src)} (${(woff2.length / 1024).toFixed(1)} KB)`);
  return true;
}

async function main() {
  mkdirSync(SOURCE_DIR, { recursive: true });
  mkdirSync(join(SOURCE_DIR, "cool-font"), { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Building WOFF2 fonts…");
  for (const dir of FONT_SEARCH_DIRS.slice(1)) {
    if (existsSync(dir)) console.log(`  (also checking ${dir})`);
  }
  for (const { path: dir, requireCoolInStem } of COOL_SEARCH_ROOTS) {
    if (!existsSync(dir)) continue;
    const flat = requireCoolInStem ? " — flat scan (COOL stem/path only)" : "";
    console.log(`  (COOL search: ${dir}${flat})`);
  }
  const results = [];
  for (const slot of FONT_SLOTS) {
    results.push(await convertSlot(slot));
  }
  const usedCoolPaths = new Set();
  const coolResults = [];
  for (const slot of COOL_FONT_SLOTS) {
    coolResults.push(await convertCoolSlot(slot, usedCoolPaths));
  }
  if (coolResults.some((ok) => !ok)) {
    logCoolFontHints();
  }

  const builtSwiss = results.filter(Boolean).length;
  const builtCool = coolResults.filter(Boolean).length;
  const built = builtSwiss + builtCool;

  if (built === 0) {
    console.error(
      "\nNo source fonts found. Add licensed files to fonts-source/ or install Swiss 721 / COOL FONT (see fonts-source/README.md), then re-run:\n  npm run fonts:build\n",
    );
    process.exit(1);
  }

  console.log(
    `\nDone: ${builtSwiss}/${FONT_SLOTS.length} Swiss 721 + ${builtCool}/${COOL_FONT_SLOTS.length} COOL → public/fonts/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
