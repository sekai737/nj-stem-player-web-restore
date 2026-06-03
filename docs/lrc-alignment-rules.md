# LRC Alignment Rules

The `.lrc` file is the primary source of truth for timestamp order, line count, and structure.

ColorCodedLyrics supplies member names, original lyrics, romanization, and translations into that structure. **Do not reshape the LRC to match CCL** except when splitting a verified multi-member CCL group (see below).

## Multi-Member Line Rule

If consecutive CCL rows matched to one LRC line have **different members**, split into separate output lines:

- First segment keeps the LRC timestamp.
- Additional segments use `[00:00.00]` (manual review required).
- Log every placeholder line in the **split-line review report**.

## Alignment Rules

1. LRC line order and count are authoritative.
2. Only emit extra lines for verified multi-member splits.
3. On count or content mismatch, do not silently force-match — write a **mismatch report**.
4. Prefer safe alignment over guessing.

## Reports (per song)

| File | When |
|------|------|
| `reports/{slug}-splits.json` | Lines with `[00:00.00]` placeholder timestamps |
| `reports/{slug}-mismatch.json` | Line count or content alignment issues |

Mismatch entries: LRC line, CCL candidate, reason, manual review needed (yes/no).
