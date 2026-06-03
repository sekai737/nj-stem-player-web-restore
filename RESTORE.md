# Project restore (2026-06-03)

This tree was rebuilt from the Cursor agent transcript `c0841c1d-7a4f-4fef-a8ea-5d0ed49d8f26` (2,883 messages, 351 writes, 1,600+ edits).

## What was restored

- **183 source/config files** — React app, fullscreen player, meters, lyrics, LRC builder, scripts
- **Demo stems** — `public/stems/demo/*.mp3` (silent placeholders via `scripts/generate-demo-stems.mjs`)
- **SVG assets** — covers, member icons, Figma UI chrome under `public/`

## Still missing (add manually)

These are binary assets that were not in the transcript:

| Asset | Expected path |
|-------|----------------|
| Member portraits | `public/members/portrait-*.png`, `pharrell-portrait.png`, etc. |
| Member emoji PNGs | `public/members/emoji-*.png` |
| Web fonts (WOFF2) | `public/fonts/*.woff2` — run `npm run fonts:build` after installing fonts |
| Real stem audio | `public/stems/<song>/` — update `src/data/catalog.json` |
| LRC lyric files | `public/lyrics/*.lrc` |
| Cover JPGs (optional) | `public/covers/*.jpg` — catalog uses SVG placeholders |

If you had `portrait-haerin.png` before the wipe, copy it back to `public/members/`.

## Re-run restore

```powershell
node scripts/restore-from-transcript.mjs
node scripts/generate-demo-stems.mjs
```

## Dev server

```powershell
cd C:\Users\Athony\.cursor\projects\empty-window\nj-stem-player-web
npm install
npm run dev
```

Install [Node.js LTS](https://nodejs.org/) if `npm` is not recognized.

## Figma

Design reference: [NewJeans Stem Player (Mock-up 2)](https://www.figma.com/design/gTWpAWp0lSWVlTCNIoqfP3/NewJeans-Stem-Player--Mock-up-2-?node-id=0-1)
