# LRC Alignment Rules — Update

Update the lyric automation workflow with stricter line-alignment rules.

---

## Source of Truth

The `.lrc` file is the primary source of truth for:

1. Timestamp order
2. Number of timed lyric lines
3. Overall lyric structure

ColorCodedLyrics is used only to supply member names, original lyrics, romanization, and translations into the existing LRC structure. **Do not reshape the LRC file to match CCL** unless a CCL line contains multiple member-coded segments (see Multi-Member Line Rule below).

---

## Multi-Member Line Rule

If a single CCL line contains multiple member-colored segments, split it into separate lines by member.

**Example CCL input:**
- `All I know is now 알게 됐어 나` = Haerin
- `(I know)` = Hanni

**Output:**
```lrc
[Haerin][00:07.87]All I know is now 알게 됐어 나
[Hanni][00:00.00](I know)
```

**Split line rules:**
1. Keep the original LRC timestamp on the first split line.
2. Assign a placeholder timestamp `[00:00.00]` to every additional split line.
3. Add every placeholder line to the split-line review report.
4. Flag the split clearly so timestamps can be adjusted manually.
5. Do not guess timestamps for newly split lines.

---

## Alignment Rules

1. LRC line order and count are the authority — CCL content must conform to them.
2. Only add CCL lyric fragments when they are part of a verified multi-member line split.
3. If LRC and CCL line counts differ, do not silently force-match.
4. Generate a mismatch report (see Output Requirements) for any line count or lyric content discrepancy.

---

## Output Requirements

For each processed song, generate:

1. **Enhanced `.lrc` files** — original, romanized, and English translation variants
2. **Split-line review report** — every line that received a `[00:00.00]` placeholder timestamp, flagged for manual review
3. **Mismatch report** (when applicable) — generated whenever LRC and CCL line counts or lyric content do not align

### Mismatch Report Format

Each entry must include:

| Field | Description |
|---|---|
| LRC line | The timestamped line from the `.lrc` file |
| CCL candidate | The closest corresponding CCL line |
| Reason | Why the lines did not match |
| Manual review needed | Yes / No |

---

## Alignment Priority

> Safe alignment over guessing — always.

When the correct match is ambiguous, log it and flag for review rather than making a silent assumption.
