# NewJeans Stem Player (Web)

Interactive fan stem player based on the product spec: browse releases → pick a song → mix separated stems with synced lyrics and member indicators.

**Figma mockup:** [NewJeans Stem Player (Mock-up 2)](https://www.figma.com/design/gTWpAWp0lSWVlTCNIoqfP3/NewJeans-Stem-Player--Mock-up-2-?node-id=1-58)

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- React Router (3-page flow)
- Zustand (playback + mixer state)
- Web Audio API (synced multi-stem playback)
- Wavesurfer.js (per-stem waveforms)

## Quick start

```powershell
cd "G:\1 - Work\NJ Stem Player"
npm install
npm run dev
```

Optional: keep master `.lrc` files in `Lyrics\` and copy into `public\lyrics\` when you update them.

### Troubleshooting (Windows)

**`lightningcss.win32-ia32-msvc.node` not found** — This project uses Tailwind CSS v3 + PostCSS (no Lightning CSS). Delete `node_modules` and `package-lock.json`, then run `npm install` again.

**`@rollup/rollup-win32-*` not found** — Usually a broken optional dependency install. Clean reinstall:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

This repo targets **Vite 4 + Tailwind 3** so it runs on older **32-bit (ia32) Node** on Windows. For new machines, **64-bit Node.js LTS** from [nodejs.org](https://nodejs.org/) is still recommended.

Open the URL Vite prints (usually `http://localhost:5173`).

## Fonts (Swis721 BT / Swiss 721)

Licensed desktop fonts are converted to WOFF2 for the web:

1. Copy your files into `fonts-source/` using the names in `fonts-source/README.md` (e.g. `swis721-bt-roman.ttf`).
2. Run `npm run fonts:build` — outputs land in `public/fonts/`.
3. Reload the dev server.

Track metadata and the header use **Swis721 BT**; transport times and lyric UI use **Swiss 721** when those files are included.

## Add your audio

1. Export four stems per song: `vocals`, `other`, `drums`, `bass` (FLAC recommended; MP3 also works).
2. Place them under `public/stems/<your-folder>/`.
3. Point each song’s `stems[].src` in `src/data/catalog.json` at those files.

Example:

```json
{ "id": "vocals", "label": "Vocals", "src": "/stems/supernatural/supernatural-vocals.flac" }
```

All stems must be the **same length** and **time-aligned** so they stay in sync.

## Catalog & lyrics

Edit `src/data/catalog.json`:

- `releases[]` — cover art, year, type, songs
- `songs[].lrc` — paths to per-language `.lrc` files under `public/lyrics/`
- `creator.twitter` / `creator.linktree` — footer links

### LRC file format

Place lyric files in `public/lyrics/`. Each line includes a timestamp and the singing member:

```lrc
[Hanni][00:12.34]I don't know what we've done
[Minji][00:15.80]Tell me what you want
[Group][00:18.20]Cause I know what you like boy
```

Supported member tags (case-insensitive): `Minji`, `Hanni`, `Danielle`, `Haerin`, `Hyein`, `Group`.

Lines without a member tag use the previous line’s member. Instrumental gaps like `[00:32.73]` are skipped.

Example catalog entry:

```json
"lrc": {
  "org": "/lyrics/supernatural-org.lrc",
  "rom": "/lyrics/supernatural-rom.lrc",
  "en": "/lyrics/supernatural-en.lrc"
}
```

Member emoji mapping: 🧸 Minji, 🦦 Hanni, 🐶 Danielle, 🐱 Haerin, 🐹 Hyein, 🐰 group/unison.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Release grid (newest first) |
| `/release/:releaseId` | Carousel song picker |
| `/release/:releaseId/play/:songId` | Stem mixer + lyrics |

## Next steps (from spec)

- [x] Stem player page aligned to Figma Mock-up 2 tokens (see `docs/figma-design-tokens-audit.md`)
- [ ] Real cover art and member portraits
- [ ] Per-song stem folders and full discography in `catalog.json`
- [ ] Tone.js transport (optional) if you need tighter scheduling
- [ ] Master MP3 fallback when stems are missing
