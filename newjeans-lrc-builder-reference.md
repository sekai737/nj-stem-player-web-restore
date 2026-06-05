# NewJeans Enhanced `.lrc` Builder — Cursor Agent Reference

## Goal

Create enhanced `.lrc` files for NewJeans songs by combining:
- Timestamped `.lrc` files from [Lyricsify](https://www.lyricsify.com/artists/newjeans)
- Member-coded lyrics, romanization, and English translations from [ColorCodedLyrics](https://colorcodedlyrics.com/category/krn/newjeans-nyujinseu/)

### Target Output Format

```
[MemberName][MM:SS.xx]Lyric line
```

**Example:**
```
[Hanni][00:12.34]Sample lyric line
```

### Three Output Files Per Song

| File | Content |
|---|---|
| `{title}.lrc` | Original Korean/Japanese/English lyrics |
| `{title}.rom.lrc` | Romanized lyrics |
| `{title}.en.lrc` | English translated lyrics |

---

## Pipeline Overview

```
Lyricsify (.lrc) ──────────────────────┐
                                        ├──► Align by line index ──► [Member][ts]Lyric
ColorCodedLyrics (member + text) ──────┘
```

---

## Project Setup

**Prompt Cursor Agent:**
> "Create a Python project called `lrc-builder`. Set up a virtual environment and install: `requests`, `beautifulsoup4`, `lxml`, `rapidfuzz`, and `rich`. Create a `main.py` and a `config.py`."

**`config.py`:**
```python
LYRICSIFY_BASE  = "https://www.lyricsify.com/artists/newjeans"
CCL_BASE        = "https://colorcodedlyrics.com/category/krn/newjeans-nyujinseu/"
OUTPUT_DIR      = "output/"
FUZZY_THRESHOLD = 85          # Minimum match score for song title pairing
REQUEST_DELAY   = 1.5         # Seconds between HTTP requests (be polite)
```

---

## Final File Structure

```
lrc-builder/
├── config.py
├── main.py
├── scraper/
│   ├── lyricsify.py          # Song index + .lrc extraction
│   └── colorcodedlyrics.py   # Song index + member-coded lyric extraction
├── processor/
│   ├── parser.py             # .lrc timestamp parsing
│   └── aligner.py            # Line alignment logic
├── writer/
│   └── lrc_writer.py         # Output file generation
├── matches.json              # Cached song index (generated once)
├── skipped.json              # Songs with issues (generated at runtime)
└── output/
    ├── Hype Boy.lrc
    ├── Hype Boy.rom.lrc
    └── Hype Boy.en.lrc
```

---

## Phase 1 — Scrape Song Indexes

### Lyricsify Song List

**Prompt Cursor Agent:**
> "In `scraper/lyricsify.py`, write `get_lyricsify_song_list()` that fetches `LYRICSIFY_BASE`, parses all song anchor tags using BeautifulSoup, and returns a list of `{title, url}` dicts. Add type hints and a docstring."

### ColorCodedLyrics Song List

**Prompt Cursor Agent:**
> "In `scraper/colorcodedlyrics.py`, write `get_ccl_song_list()` that fetches `CCL_BASE`, follows 'Next Page' pagination links until none remain, and returns a list of `{title, url}` dicts. Add type hints and a docstring."

---

## Phase 2 — Fuzzy Match Songs Across Sources

Song titles won't always match exactly (e.g. `"OMG"` vs `"OMG (feat. ...)"`) — use fuzzy matching.

**Prompt Cursor Agent:**
> "In `processor/aligner.py`, write `match_songs(lyricsify_list, ccl_list)` using `rapidfuzz.process.extractOne` with the `FUZZY_THRESHOLD` from config. Return a list of matched pairs `{lyricsify_url, ccl_url, title}`. Log unmatched songs with `rich`."

**Cache the result** — save to `matches.json` on first run, load from it on subsequent runs. This avoids re-scraping the index every time.

---

## Phase 3 — Extract and Parse the `.lrc` File

### Download

**Prompt Cursor Agent:**
> "In `scraper/lyricsify.py`, write `download_lrc(lyricsify_url: str) -> str` that fetches the song page, locates the `.lrc` download link or inline `.lrc` text block, and returns the raw `.lrc` string. Force `response.encoding = 'utf-8'`."

### Parse

**Prompt Cursor Agent:**
> "In `processor/parser.py`, write `parse_lrc(lrc_string: str) -> list[dict]` that returns a list of `{timestamp_raw, timestamp_ms, lyric_text}` dicts. Parse `[MM:SS.xx]` format. Convert timestamps to milliseconds (int) for alignment comparisons. Skip lines that are blank or contain only `♪`."

---

## Phase 4 — Scrape ColorCodedLyrics

This is the most structurally complex step. ColorCodedLyrics uses colored `<span>` tags to indicate which member sings each line.

### Build the Color → Member Map

Before writing the scraper, **manually inspect one CCL song page in browser DevTools** to identify each member's assigned hex color. Update this map in `config.py`:

```python
# Verify these colors against a live CCL page — they may change
COLOR_MAP: dict[str, str] = {
    "#d7a8dc": "Minji",
    "#f4a460": "Hanni",
    "#98c8e8": "Danielle",
    "#f7c5c5": "Haerin",
    "#a8d8a8": "Hyein",
    "#c8b4e8": "All",     # group lines
}
```

> **Note:** These hex values are illustrative. Always verify against a live page before running the pipeline.

### Scraper Function

**Prompt Cursor Agent:**
> "In `scraper/colorcodedlyrics.py`, write `scrape_ccl_page(ccl_url: str) -> list[dict]` that:
> 1. Fetches the page and parses with BeautifulSoup + lxml
> 2. Locates the lyrics container (inspect for `.entry-content` or similar — confirm in DevTools)
> 3. For each lyric row, reads the `style` color attribute on the `<span>` and maps it to a member name using `COLOR_MAP`
> 4. Extracts: original line, romanized line, and English translation line (these appear as stacked rows or sibling elements — inspect the DOM structure to confirm)
> 5. Returns a list of `{member, original, romanized, english}` dicts in order
> 6. Force `response.encoding = 'utf-8'`"

**DOM structure note:** The exact selector for lyrics rows, romanization, and translation varies per page layout. Instruct Cursor Agent to print the parsed HTML of one song page first and confirm the structure before writing the full scraper.

---

## Phase 5 — Align Timestamps with Lyric Lines

The `.lrc` file has N timestamped lines; CCL has N lyric rows. They correspond 1-to-1 after filtering.

**Prompt Cursor Agent:**
> "In `processor/aligner.py`, write `align_lines(lrc_lines: list[dict], ccl_lines: list[dict]) -> list[dict]` that:
> 1. Filters blank and instrumental-only lines from both lists before zipping
> 2. Zips the two lists by index
> 3. Returns a list of merged dicts: `{timestamp_raw, member, original, romanized, english}`
> 4. If `len(lrc_lines) != len(ccl_lines)`, logs a warning with `rich` showing the song title and both lengths — does NOT raise an exception
> 5. For mismatched songs, tags unmatched lines with member `'[?]'` so they're flagged in output"

---

## Phase 6 — Generate Output Files

**Prompt Cursor Agent:**
> "In `writer/lrc_writer.py`, write `generate_lrc_files(aligned: list[dict], song_title: str, output_dir: str)` that writes three files:
> - `{title}.lrc` — `[Member][MM:SS.xx]original`
> - `{title}.rom.lrc` — `[Member][MM:SS.xx]romanized`
> - `{title}.en.lrc` — `[Member][MM:SS.xx]english`
>
> Sanitize `song_title` to remove characters that are invalid in filenames. Create `output_dir` if it doesn't exist."

---

## Phase 7 — Orchestrate in `main.py`

**Prompt Cursor Agent:**
> "Write `main()` in `main.py` that:
> 1. Loads `matches.json` if it exists; otherwise builds the match list via `match_songs()` and saves it
> 2. Iterates over each matched song pair
> 3. Skips any song where all three output files already exist (makes the run resumable)
> 4. For each song: calls `download_lrc` → `parse_lrc` → `scrape_ccl_page` → `align_lines` → `generate_lrc_files`
> 5. Sleeps `REQUEST_DELAY` seconds between songs
> 6. Logs progress with a `rich` progress bar
> 7. Appends failed songs to `skipped.json` with the reason — never raises an unhandled exception"

---

## Edge Case Handling

| Edge Case | Handling |
|---|---|
| Song missing from one source | Log to `skipped.json`, continue |
| Line count mismatch (lrc vs CCL) | Write partial files; tag unmatched lines with `[?]` |
| Instrumental / blank lines | Strip lines matching `♪` or empty strings before aligning |
| CCL pagination | Loop `while next_page_url` in the index scraper |
| Rate limiting / HTTP errors | `time.sleep(REQUEST_DELAY)` between requests; retry once on 429/503 |
| Encoding issues | Force `response.encoding = 'utf-8'` on every fetch |
| Group lines (all members) | Map to `"All"` in `COLOR_MAP`; write as `[All][ts]lyric` |
| Unrecognized color code | Log warning with the unknown hex value; tag line `[?]` |

---

## Recommended Cursor Agent Prompting Pattern

Use this structure for every function to keep output consistent and testable:

```
"In the context of the lrc-builder project:
 - File: [path/to/file.py]
 - Function name: [name]
 - Input: [describe with types]
 - Output: [describe with types]
 - Error handling: log with rich and continue, do not raise
 - Add a docstring and type hints"
```

---

## Build Order

Work through phases in this order and **validate each one on a single song before moving on:**

1. `get_lyricsify_song_list()` — confirm song links are found
2. `get_ccl_song_list()` — confirm pagination works
3. `match_songs()` — inspect `matches.json`, fix threshold if needed
4. `download_lrc()` + `parse_lrc()` — print parsed lines for one song, verify timestamps
5. `scrape_ccl_page()` — **print raw HTML first**, confirm DOM selectors, then parse one song
6. `COLOR_MAP` — verify member colors in DevTools on a live page before continuing
7. `align_lines()` — validate that line counts match for your test song
8. `generate_lrc_files()` — open one output file and check formatting
9. `main()` — run the full pipeline on 2–3 songs before going full batch
