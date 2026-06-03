# Web fonts (WOFF2)

Generated via `npm run fonts:build` from licensed sources in `%LOCALAPPDATA%\Microsoft\Windows\Fonts` (or `fonts-source/`).

**If typography looks wrong (Arial everywhere), run `npm run fonts:build` — these files must exist and start with the `wOF2` signature. Corrupt files are rebuilt automatically by `npm run dev`.**

| File | CSS family | Figma style |
|------|------------|-------------|
| `swis721-bt-roman.woff2` | `Swis721BTRoman` | Swis721 BT Roman |
| `swis721-bt-bold.woff2` | `Swis721BTBold` | Swis721 BT Bold |
| `swiss-721-regular.woff2` | `Swiss721Regular` | Swiss 721 Regular |
| `swiss-721-medium.woff2` | `Swiss721Medium` | Swiss 721 Medium |

### Noto Sans — lyrics (committed WOFF2)

| File | CSS family | Use |
|------|------------|-----|
| `NOTOSANSKR-VF.woff2` | `NotoSansKR-VF` | Main stem — Korean lyrics |
| `NOTOSANSJP-REGULAR.woff2` | `NotoSansJPRegular` | Main stem — Japanese lyrics |
| `noto-sans-kr-light.woff2` | `NotoSansKRLight` | Fullscreen — Korean lyrics |
| `NOTOSANSJP-LIGHT.woff2` | `NotoSansJPLight` | Fullscreen — Japanese lyrics |

`fonts:ensure` copies from `@fontsource` when a file is missing or not valid WOFF2. Replace `NOTOSANSKR-VF.woff2` with your licensed variable font (valid WOFF2) to keep it.

`SWIS721_LT_BT_LIGHT.woff2` — fullscreen Latin lyric bubbles / timestamps (Figma 120:174).

### COOL_FONT — track title (Figma Title 26:216 / text 3:282)

Running **`npm run fonts:build`** on Windows scans `C:\Windows\Fonts` for folders such as **`COOL FONT`**, plus `fonts-source/cool-font/` and the **`COOL_FONT_DIR`** env var. Matching `.ttf` / `.otf` / `.ttc` files are converted to:

| File | CSS family (Figma) |
|------|---------------------|
| `cool-font-cloud.woff2` | `COOL_FONT:Cloud` |
| `cool-font-simplified.woff2` | `COOL_FONT:Simplified` |
| `cool-font-goop.woff2` | `COOL_FONT:Goop` |
| `cool-font-pixel.woff2` | `COOL_FONT:Pixel` |
| `cool-font-pix-outlined.woff2` | `COOL_FONT:Pix-Outlined` |
| `cool-font-distorted.woff2` | `COOL_FONT:Distorted` |
| `cool-font-fire.woff2` | `COOL_FONT:Fire` |
| `cool-font-fluid.woff2` | `COOL_FONT:Fluid` |
| `cool-font-regular.woff2` | `COOL_FONT:Regular` |
| `cool-font-structured.woff2` | `COOL_FONT:Structured` |

| `ALL-STAR.woff2` | `AllStar` | BG Elements decorative stars (Figma 1:66) @ 700px |

**Jersey 10** loads from Google Fonts (`index.html`) for stem labels.

**Temporary fallback:** If a WOFF2 is missing, `typography.css` stacks end with `sans-serif` (system UI) — run the build script to restore licensed faces.
