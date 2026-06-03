# Licensed font sources

Place your **licensed** desktop font files here, then run (or rely on fonts already in `%LOCALAPPDATA%\Microsoft\Windows\Fonts`):

```bash
npm run fonts:build
```

The build script also checks your Windows user fonts folder automatically.

## COOL_FONT (track title)

The build script also looks for **COOL FONT** styles used on the stem player title (`cool-font-*.woff2`).

**Search paths (first match wins per style):**

1. `COOL_FONT_DIR` environment variable (any folder containing `.ttf` / `.otf` / `.ttc` files)
2. `fonts-source/cool-font/` in this repo
3. On Windows: `C:\Windows\Fonts\COOL FONT`, `COOL_FONT`, `Cool Font`, `CoolFont`, and **any subdirectory of `C:\Windows\Fonts` whose name contains `cool`**

File names are matched loosely on stems, e.g. `Cloud`, `Goop`, `Pix Outlined`, `Pixel`, `Regular`, etc. (see `scripts/build-fonts.mjs`, `COOL_FONT_SLOTS`).

Then run:

```bash
npm run fonts:build
```

---

Place files here only if you prefer a project-local copy.

## Required filenames (rename your exports to match)

| File in this folder | Web output | Figma style |
|---------------------|------------|-------------|
| `swis721-bt-roman.ttf` or `.otf` | `public/fonts/swis721-bt-roman.woff2` | Swis721_BT Roman |
| `swis721-bt-bold.ttf` or `.otf` | `public/fonts/swis721-bt-bold.woff2` | Swis721_BT Bold |
| `swiss-721-regular.ttf` or `.otf` | `public/fonts/swiss-721-regular.woff2` | Swiss 721 Regular |
| `swiss-721-medium.ttf` or `.otf` | `public/fonts/swiss-721-medium.woff2` | Swiss 721 Medium |

At minimum, add **Roman** and **Bold** for the stem player title and header. Swiss 721 files are optional but used for transport times and lyric UI per the Figma audit.

## Noto Sans lyrics (optional local overrides)

Drop valid **WOFF2** files into `public/fonts/` (or TTF/OTF here and convert) to override the `@fontsource` sync defaults:

| File in `public/fonts/` | Use |
|-------------------------|-----|
| `NOTOSANSKR-VF.woff2` | Main stem — Korean |
| `NOTOSANSJP-REGULAR.woff2` | Main stem — Japanese |
| `NOTOSANSJP-LIGHT.woff2` | Fullscreen — Japanese |
| `noto-sans-kr-light.woff2` | Fullscreen — Korean |

## COOL_FONT (stem player track title)

`npm run fonts:build` also emits `public/fonts/cool-font-*.woff2` when it finds matching files in:

1. **`COOL_FONT_DIR`** — optional env var pointing at your font folder
2. **`fonts-source/cool-font/`** — drop TTF/OTF/TTC files here if you prefer a local copy
3. **Windows:** `C:\Windows\Fonts` (flat scan for file names / paths containing **cool**) and any real subfolder whose name contains `cool`. The path `C:\Windows\Fonts\COOL FONT` is **often not a real directory** — Font Settings / Explorer can show it as a family view while the `.otf` files live directly under `C:\Windows\Fonts` (or under your user fonts folder). The build script scans those locations automatically; see `scripts/build-fonts.mjs`.

Name files so the stem contains the style word (**case-insensitive**), e.g. `Cloud`, `CoolFontCloud`, `COOL_FONT_Pix-Outlined`. Windows Font Settings shows faces like **COOL FONT Cloud**; on disk the filename may be **compressed** (no spaces). The build matches those words as **substrings** in the basename, so `coolfontcloud.otf` still works.

Source files in this directory are **not** committed (see `.gitignore`). WOFF2 outputs under `public/fonts/` are committed for deployment.
