# NewJeans Enhanced `.lrc` Builder — Reference

See also: [`lrc-builder/README.md`](../lrc-builder/README.md) for run commands.

## Goal

Create enhanced `.lrc` files for NewJeans songs by combining:

- Timestamped `.lrc` files from [Lyricsify](https://www.lyricsify.com/artists/newjeans)
- Member-coded lyrics, romanization, and English translations from [ColorCodedLyrics](https://colorcodedlyrics.com/category/krn/newjeans-nyujinseu/)

### Target output format

```
[MemberName][MM:SS.xx]Lyric line
```

Example:

```
[Hanni][00:12.34]Sample lyric line
```

### Three output files per song (stem player)

| File | Content |
|------|---------|
| `{slug}-org.lrc` | Original (Hangul) |
| `{slug}-rom.lrc` | Romanization |
| `{slug}-en.lrc` | English translation |

Written to `public/lyrics/` and referenced from `src/data/catalog.json`.

## Member colors (verified)

| Member | Hex |
|--------|-----|
| Minji | `#5d83f5` |
| Hanni | `#eb5ea4` |
| Danielle | `#f7f55e` |
| Haerin | `#7cde68` |
| Hyein | `#975aed` |
| Group | `#828282` |

Configured in `lrc-builder/config.py` as `COLOR_MAP`.

## Pipeline

```
Lyricsify (.lrc) ─────────────┐
                               ├── align by line index ──► [Member][ts]Lyric
ColorCodedLyrics (sections) ───┘
```

1. Index both sources → fuzzy-match titles → `matches.json`
2. Per song: download/parse LRC timestamps, scrape CCL Hangul/Romanization/Translation
3. Zip lines by index (warn on count mismatch)
4. Write `-org`, `-rom`, `-en` under `public/lyrics/`

## Lyricsify note

Automated requests may hit Cloudflare. Place manual downloads in `lrc-builder/input/lyricsify/<slug>.lrc`.

## Build order (validate incrementally)

1. CCL index + pagination
2. Lyricsify index or local fallback
3. `matches.json`
4. One song: parse LRC + scrape CCL + align + write
5. Full batch via `npm run lyrics:build`
