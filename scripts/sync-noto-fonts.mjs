/**
 * Ensures lyric Noto WOFF2 files exist under public/fonts/ with canonical filenames.
 * Copies from @fontsource when a file is missing or not a valid WOFF2.
 * Skips overwrite when an existing file is already valid WOFF2.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "fonts");

/** @type {{ src: string; out: string }[]} */
const COPIES = [
  {
    src: "@fontsource/noto-sans-kr/files/noto-sans-kr-korean-400-normal.woff2",
    out: "NotoSansKR-Regular.woff2",
  },
  {
    src: "@fontsource/noto-sans-kr/files/noto-sans-kr-korean-300-normal.woff2",
    out: "NotoSansKR-Light.woff2",
  },
  {
    src: "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2",
    out: "NotoSansJP-Regular.woff2",
  },
  {
    src: "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-300-normal.woff2",
    out: "NotoSansJP-Light.woff2",
  },
];

function isValidWoff2(buffer) {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x77 &&
    buffer[1] === 0x4f &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x32
  );
}

export function syncNotoFonts() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const { src, out } of COPIES) {
    const to = join(OUT_DIR, out);
    if (existsSync(to)) {
      try {
        if (isValidWoff2(readFileSync(to))) continue;
      } catch {
        /* replace corrupt file */
      }
    }
    const from = join(ROOT, "node_modules", src);
    if (!existsSync(from)) {
      throw new Error(
        `Missing ${from}. Run: npm install (@fontsource/noto-sans-kr, @fontsource/noto-sans-jp)`,
      );
    }
    copyFileSync(from, to);
  }
}
