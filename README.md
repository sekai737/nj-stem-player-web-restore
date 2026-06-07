# NewJeans Stem Player

A fan-made web stem player for NewJeans. Browse releases, pick a track, and mix separated stems with synced lyrics, member indicators, spectrum meters, and a fullscreen lyric view.

Design is based on **[NewJeans Stem Player (Mock-up 2)](https://www.figma.com/design/gTWpAWp0lSWVlTCNIoqfP3/NewJeans-Stem-Player--Mock-up-2-?node-id=1-58)** in Figma. Token and layout notes live in [`docs/figma-design-tokens-audit.md`](docs/figma-design-tokens-audit.md).

## Features

- **Home page** — Figma-aligned layout with animated release card carousel, star-field background, and creator links
- **Song select** — Per-release carousel with remix picker (official and fan remixes)
- **Stem player** — Four-channel mixer (vocals, other, drums, bass) with solo/mute, pan, and volume
- **Waveforms** — Per-stem visualization via Wavesurfer.js
- **Lyrics** — Multi-script LRC (original, romanization, English) with member tags and emoji indicators
- **Meters** — Real-time multiband spectrum analysis with theme picker
- **Fullscreen mode** — Chat-style synced lyrics, queue navigation, and stem/master toggle
- **Responsive scaling** — Viewport-aware scaling on home and player pages without layout jitter

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 18, TypeScript, Vite 4 |
| Styling | Tailwind CSS 3, Figma design tokens (`src/styles/figma-tokens.css`) |
| Routing | React Router 6 |
| State | Zustand |
| Audio | Web Audio API (synced multi-stem playback) |
| Waveforms | Wavesurfer.js 7 |
| Desktop | Electron 34 (optional) |

## Getting started

```bash
git clone <repo-url>
cd nj-stem-player-web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Build & preview

```bash
npm run build    # typecheck + production bundle
npm run preview  # serve dist/
```

`npm run dev` and `npm run build` run `fonts:ensure` first so required WOFF2 files exist (see [Fonts](#fonts)).

### Desktop (Electron)

The web app can run as a desktop shell with native stem-library folder selection. UI assets ship in the app bundle; **FLAC stems stay outside the installer** in a folder you choose (must contain a `stems/` directory, same layout as `public/stems/`).

```bash
npm run electron:ensure   # download/extract Electron binary (auto-run by electron:dev)
npm run electron:dev     # Vite + Electron window (uses public/ as library in dev when present)
npm run electron:start   # Production-like local run (dist/ + njsp:// protocol)
npm run electron:build   # Package installer → release/
```

Use **File → Choose Stem Library…** to point at your library root (e.g. the repo’s `public/` folder or a copy that contains `stems/`). The choice is saved under the app user-data directory.

If Electron does not open, run `npm run electron:ensure` once, then retry `npm run electron:dev`.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Scrollable release cards, title art, footer credits |
| `/release/:releaseId` | Song select | Track carousel, remix list, link into player |
| `/release/:releaseId/play/:songId` | Stem player | Mixer, lyrics, meters, transport, fullscreen |

## Project layout

```
public/
  covers/          Album art
  figma/           Exported UI assets (SVG/PNG)
  fonts/           Web fonts (WOFF2)
  lyrics/          Per-song .lrc files
  stems/           Audio stems (not in git — add locally)
src/
  components/      UI (home carousel, stem rows, meters, fullscreen, …)
  data/catalog.json  Releases, songs, remixes, creator links
  figma/           Asset paths, layout constants, star-field config
  hooks/           Audio engine, scaling, lyrics, analysis
  meters/          Spectrum DSP and visual themes
  pages/           Route-level views
  store/           Zustand playback/mixer state
  styles/          Tokens, typography, fonts
scripts/           Font build, catalog sync, stem analysis, asset tooling
docs/              Figma audit, LRC format references
```

## Audio & stems

Each song expects **four time-aligned stems** of the same length:

| Stem ID in catalog | File segment | Label |
|--------------------|--------------|-------|
| `vocals` | `vocals` | Vocals |
| `instruments` | `other` | Other |
| `drums` | `drums` | Drums |
| `bass` | `bass` | Bass |

### Default path convention

When a stem entry has no `src`, paths are resolved automatically:

```
/public/stems/{releaseId}/{slug}-{segment}.flac
```

Example for release `supernatural`, song slug `supernatural`:

```
/public/stems/supernatural/supernatural-vocals.flac
/public/stems/supernatural/supernatural-other.flac
/public/stems/supernatural/supernatural-drums.flac
/public/stems/supernatural/supernatural-bass.flac
```

Optional master mix: `{slug}-master.flac` in the same folder.

FLAC is recommended; MP3 works. Override any file with an explicit `src` on the stem or `masterSrc` on the song in `catalog.json`.

### Demo placeholders

```bash
npm run stems:placeholder   # generate short silent/demo MP3s under public/stems/demo/
npm run analyze:stems       # inspect stem duration/format alignment
```

## Catalog & lyrics

Edit **`src/data/catalog.json`** (or sync from CSV — see below):

- **`creator`** — `youtube`, `litLink` (footer / corner links on home page)
- **`releases[]`** — `id`, `title`, `year`, `type`, `coverArt`, `songs[]`
- **`songs[]`** — metadata, `stems[]`, optional `remixes[]`, `lrc` paths, `stemSlug` for non-default filenames

Regenerate release/song lists from **`NewJeans.csv`** while preserving existing song metadata:

```bash
npm run catalog:sync
```

### LRC format

Lyric files live in **`public/lyrics/`**. Each sung line includes a member tag and timestamp:

```lrc
[Hanni][00:12.34]I don't know what we've done
[Minji][00:15.80]Tell me what you want
[Group][00:18.20]Cause I know what you like boy
```

Supported tags (case-insensitive): `Minji`, `Hanni`, `Danielle`, `Haerin`, `Hyein`, `Group`.

Lines without a tag inherit the previous line’s member. Instrumental-only timestamps (no text) are skipped.

Catalog example:

```json
"lrc": {
  "org": "/lyrics/supernatural-org.lrc",
  "rom": "/lyrics/supernatural-rom.lrc",
  "en": "/lyrics/supernatural-en.lrc"
}
```

Member emoji mapping: 🧸 Minji · 🦦 Hanni · 🐶 Danielle · 🐱 Haerin · 🐹 Hyein · 🐰 group/unison.

More detail: [`docs/lrc-alignment-rules.md`](docs/lrc-alignment-rules.md), [`docs/newjeans-lrc-builder-reference.md`](docs/newjeans-lrc-builder-reference.md).

## Fonts

Licensed desktop fonts are converted to WOFF2 for the web. See [`fonts-source/README.md`](fonts-source/README.md).

**Quick path:**

1. Place licensed files in `fonts-source/` (or rely on Windows user fonts).
2. Run `npm run fonts:build` → outputs in `public/fonts/`.
3. Restart the dev server.

| Family | Use |
|--------|-----|
| Swis721 BT (Roman, Bold) | Headers, track titles |
| Swiss 721 (Regular, Medium) | Transport, metadata, UI labels |
| Swiss 721 Condensed Italic | Home page “Stem Player” bubble |
| COOL FONT (optional) | Randomized stylized track titles on player |
| Noto Sans KR/JP (optional) | Lyric scripts |

Source font files in `fonts-source/` are gitignored; committed WOFF2 under `public/fonts/` is used for deployment.

## npm scripts

| Script | Purpose |
|--------|---------|
| `dev` | Ensure fonts, start Vite dev server |
| `build` | Ensure fonts, `tsc`, production build |
| `preview` | Serve `dist/` |
| `fonts:ensure` | Copy or verify required WOFF2 assets |
| `fonts:build` | Convert TTF/OTF sources to WOFF2 |
| `catalog:sync` | Merge `NewJeans.csv` into `catalog.json` |
| `stems:placeholder` | Generate demo stem MP3s |
| `analyze:stems` | Analyze stem files for sync issues |

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/figma-design-tokens-audit.md`](docs/figma-design-tokens-audit.md) | Figma variables, colors, shadows, typography |
| [`docs/lrc-alignment-rules.md`](docs/lrc-alignment-rules.md) | Lyric timing and alignment rules |
| [`docs/newjeans-lrc-builder-reference.md`](docs/newjeans-lrc-builder-reference.md) | LRC authoring reference |

## Troubleshooting (Windows)

**`lightningcss.win32-ia32-msvc.node` not found** — This project uses Tailwind CSS 3 + PostCSS (no Lightning CSS). Delete `node_modules` and `package-lock.json`, then run `npm install` again.

**`@rollup/rollup-win32-*` not found** — Broken optional dependency install. Clean reinstall:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

The repo targets **Vite 4 + Tailwind 3** for compatibility with older **32-bit (ia32) Node** on Windows. On new machines, **64-bit Node.js LTS** from [nodejs.org](https://nodejs.org/) is recommended.

## Disclaimer

This is an unofficial fan project. NewJeans, ADOR, and related trademarks belong to their respective owners. Stem audio and cover art are not included in the repository; add your own licensed or personal rips locally.
