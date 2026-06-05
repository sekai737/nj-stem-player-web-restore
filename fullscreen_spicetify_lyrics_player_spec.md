# Full-Screen Lyrics Player Implementation Spec

## Purpose

Build a full-screen music player interface inspired by the Spicetify `full-screen` extension and its lyrics conversion workflow.

The interface should feel like a passive listening / display mode rather than a normal music library UI. The song becomes the stage: album art anchors the left side, synced lyrics perform on the right, and playback controls stay minimal.

This document is an implementation brief for Cursor Agent.

---

## Reference Behavior

The reference is a custom Spotify full-screen playback extension from the `daksh2k/Spicetify-stuff` repository, specifically:

```text
Extensions/full-screen
```

The GitHub README describes the extension as a “fancy artwork and track status display with a plethora of customizations.” It supports default full-screen mode, TV mode, a config panel, queue toggling, lyrics toggling, and keyboard shortcuts.

Important reference behaviors:

```text
F = Toggle full-screen mode
T = Toggle full-screen TV mode
C = Toggle config panel
L = Toggle lyrics
Q = Toggle queue
ESC = Leave full-screen
```

The README also notes that lyrics require the `lyrics-plus` custom app.

Do not copy the source code directly. Recreate the UX pattern for this project.

---

## Overall UI Concept

Create a full-screen music player layout with these major zones:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top-left playlist/source indicator                            │
│                                                              │
│                                                              │
│   Left player identity block          Right lyrics block      │
│                                                              │
│   Album art                           Current lyric focused   │
│   Track title                         Nearby lyrics blurred   │
│   Artist                              Romanization/translation│
│   Album/date                          shown under originals   │
│   Playback controls                                          │
│                                                              │
│ Far-left volume slider                                       │
│                                                              │
│ Bottom/right utility buttons                                  │
└──────────────────────────────────────────────────────────────┘
```

The player should be sparse, atmospheric, and readable at large screen sizes.

---

## Visual Structure

### 1. Background

Use a dark muted color field. In the screenshot, the background is a deep teal/blue-gray.

Recommended token approach:

```css
--player-bg: #2f474f;
--text-primary: #f4f7f8;
--text-secondary: rgba(244, 247, 248, 0.72);
--text-muted: rgba(244, 247, 248, 0.48);
--panel-bg: rgba(20, 30, 34, 0.72);
--control-bg: rgba(255, 255, 255, 0.18);
--control-bg-active: rgba(255, 255, 255, 0.32);
--shadow-soft: 0 16px 32px rgba(0, 0, 0, 0.28);
```

The background should not compete with album art or lyrics. Treat it like stage lighting, not decoration.

---

### 2. Top-Left Playlist Indicator

Display the current source above the player content.

Example:

```text
PLAYING FROM PLAYLIST
K-[pop] 🦋🛸💞
```

Layout:

```text
[hamburger icon]  PLAYING FROM PLAYLIST
                  K-[pop] 🦋🛸💞
```

Behavior:

- Hamburger icon can open a playlist drawer, menu, or queue.
- The source label should be small, uppercase, and muted.
- Playlist name should be slightly brighter.

Suggested component name:

```text
PlaylistSourceHeader
```

---

### 3. Left Player Identity Block

This is the main track identity zone.

Elements:

```text
Album artwork
Track title
Artist name
Album / release metadata
Like button
Shuffle button
Previous button
Play / pause button
Next button
Repeat button
Queue/list button
Progress bar
Current time
Total duration
```

Example metadata:

```text
The Chase
Hearts2Hearts
The Chase • Feb 2025
```

Album art behavior:

- Large square cover.
- Soft rounded corners.
- Subtle shadow.
- Centered within the left block.
- Should not stretch or distort.

Suggested CSS:

```css
.album-art {
  width: clamp(260px, 24vw, 460px);
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}
```

Track text behavior:

- Title: bold, large.
- Artist: smaller, underlined/clickable.
- Metadata: muted.
- All track metadata should align to the same horizontal center axis as the album art.

Suggested component name:

```text
TrackIdentityPanel
```

---

### 4. Playback Controls

Controls should be compact and secondary. They should not visually overpower the lyrics.

Recommended control order:

```text
Like | Shuffle | Previous | Play/Pause | Next | Repeat | Queue
```

Progress bar:

```text
1:35  ━━━━━━━━━━━━━━━──────  2:58
```

Behavior:

- Progress fill indicates current playback time.
- Dragging the bar seeks the track.
- Timestamps update live.
- Buttons should support keyboard and pointer interaction.

Suggested component names:

```text
PlaybackControls
ProgressBar
TransportButton
```

---

### 5. Far-Left Volume Slider

The screenshot shows a vertical volume slider on the far-left side.

Example:

```text
63%
┃
┃
┃
🔈
```

Behavior:

- Vertical slider.
- Shows current volume percentage above the slider.
- Speaker icon below the slider.
- Dragging updates volume.
- Optional: clicking speaker toggles mute.

Suggested component name:

```text
VolumeRail
```

Suggested state shape:

```ts
interface VolumeState {
  volume: number; // 0 to 100
  muted: boolean;
  previousVolume: number;
}
```

---

## Lyrics Display System

The lyrics area is the emotional center of the interface.

### 1. Core Behavior

Lyrics should appear as a stacked, synced karaoke-style display.

Current lyric:

```text
I love the way you love the chase
```

Upcoming lyric example:

```text
Hop, 내 모험의 첫걸음을 디뎌
Hop, nae moheom-eui cheosgeol-eum-eul didyeo
```

The current lyric should be sharp, bright, and readable.

Nearby lyrics should be dimmed and blurred.

This creates a depth-of-field effect:

```text
Previous lyric      blurred / dim
Current lyric       sharp / bright
Next lyric          blurred / dim
Further lyric       more blurred / more dim
```

Suggested component name:

```text
SyncedLyricsDisplay
```

---

### 2. Lyric Line States

Each lyric line should render differently based on its relationship to the active line.

Suggested model:

```ts
type LyricLineState =
  | 'past'
  | 'active'
  | 'next'
  | 'future';
```

Suggested styling:

```css
.lyric-line.active {
  opacity: 1;
  filter: blur(0px);
  font-weight: 800;
  transform: scale(1);
}

.lyric-line.nearby {
  opacity: 0.38;
  filter: blur(3px);
  font-weight: 700;
}

.lyric-line.far {
  opacity: 0.18;
  filter: blur(6px);
}
```

Use a smooth transition when the active line changes:

```css
.lyric-line {
  transition:
    opacity 220ms ease,
    filter 220ms ease,
    transform 220ms ease;
}
```

---

### 3. Lyric Data Model

Use a structured lyric model that can handle original text, romanization, and translation.

```ts
interface LyricLine {
  id: string;
  startTimeMs: number;
  endTimeMs?: number;
  original: string;
  romanized?: string;
  translation?: string;
  language?: 'ko' | 'ja' | 'en' | 'mixed' | string;
  speaker?: string; // optional: member/person name from .lrc metadata
}
```

Full lyrics state:

```ts
interface LyricsState {
  lines: LyricLine[];
  activeLineId: string | null;
  displayMode: LyricsDisplayMode;
  translationProvider: TranslationProvider;
  translationDisplay: TranslationDisplay;
  languageOverride: LanguageOverride;
}
```

---

## Lyrics Conversion Settings Panel

The second screenshot shows a conversions panel.

Panel title:

```text
Conversions
```

Fields:

```text
Translation Provider    None
Translation Display     Below origin
Language Override       Off
Display Mode            Romaja
Convert                 ✓
```

This panel controls how the lyric text is converted, translated, romanized, and displayed.

Suggested component name:

```text
LyricsConversionPanel
```

---

## Conversion Settings Explained

### 1. Translation Provider

Current value in screenshot:

```text
None
```

Purpose:

Selects the translation source/service.

Suggested values:

```ts
type TranslationProvider =
  | 'none'
  | 'local'
  | 'deepl'
  | 'google'
  | 'custom';
```

Behavior:

- `none`: do not fetch or display semantic translations.
- `local`: use preloaded translation data.
- `deepl` / `google` / `custom`: call translation API if available.

Important distinction:

Translation changes meaning-language display. It is not pronunciation.

Example:

```text
Original:    내 모험의 첫걸음을 디뎌
Translation: I take the first step of my adventure
```

---

### 2. Translation Display

Current value in screenshot:

```text
Below origin
```

Purpose:

Controls where translated text appears relative to the original lyric.

Suggested values:

```ts
type TranslationDisplay =
  | 'hidden'
  | 'below-origin'
  | 'above-origin'
  | 'replace-origin';
```

Behavior examples:

#### `below-origin`

```text
내 모험의 첫걸음을 디뎌
I take the first step of my adventure
```

#### `above-origin`

```text
I take the first step of my adventure
내 모험의 첫걸음을 디뎌
```

#### `replace-origin`

```text
I take the first step of my adventure
```

---

### 3. Language Override

Current value in screenshot:

```text
Off
```

Purpose:

Forces the lyric processor to treat lyrics as a specific language.

Suggested values:

```ts
type LanguageOverride =
  | 'off'
  | 'ko'
  | 'ja'
  | 'zh'
  | 'en'
  | 'mixed';
```

Behavior:

- `off`: auto-detect language or use lyric metadata.
- `ko`: force Korean handling.
- `ja`: force Japanese handling.
- `mixed`: preserve mixed-language behavior.

Use case:

A NewJeans-style lyric file may contain Korean, English, and Japanese in one song. Auto-detection may fail line-by-line. Language override lets the user force a conversion mode.

---

### 4. Display Mode

Current value in screenshot:

```text
Romaja
```

Purpose:

Controls what lyric format is displayed after conversion.

Suggested values:

```ts
type LyricsDisplayMode =
  | 'original'
  | 'romanized'
  | 'translated'
  | 'original-plus-romanized'
  | 'original-plus-translation'
  | 'original-plus-romanized-plus-translation';
```

For Korean specifically, `Romaja` means Korean text is converted into Latin letters.

Example:

```text
Original: 내 모험의 첫걸음을 디뎌
Romaja:   nae moheom-eui cheosgeol-eum-eul didyeo
```

Romanization is pronunciation guidance, not translation.

---

### 5. Convert Button

Current UI:

```text
Convert    ✓
```

Purpose:

Applies the currently selected conversion settings to the active lyric set.

Behavior:

1. Read current lyrics.
2. Detect or override language.
3. Generate romanization if selected.
4. Fetch/use translation if selected and provider is not `none`.
5. Store converted lines in state.
6. Re-render lyrics display.

Suggested function:

```ts
async function convertLyrics(
  lines: LyricLine[],
  settings: LyricsConversionSettings
): Promise<LyricLine[]> {
  // 1. Determine language per line.
  // 2. Romanize if needed.
  // 3. Translate if needed.
  // 4. Return enriched lyric lines.
}
```

Settings shape:

```ts
interface LyricsConversionSettings {
  translationProvider: TranslationProvider;
  translationDisplay: TranslationDisplay;
  languageOverride: LanguageOverride;
  displayMode: LyricsDisplayMode;
}
```

---

## Original vs Romanized vs Translated Lyrics

These three forms must be treated as separate layers.

| Layer | Example | Purpose |
|---|---|---|
| Original | `내 모험의 첫걸음을 디뎌` | Native lyric text |
| Romanized / Romaja | `nae moheom-eui cheosgeol-eum-eul didyeo` | Pronunciation guide |
| Translation | `I take the first step of my adventure` | Meaning |

Do not confuse romanization with translation.

Romanization answers:

```text
How do I say this?
```

Translation answers:

```text
What does this mean?
```

---

## Display Combinations

### Original Only

```text
내 모험의 첫걸음을 디뎌
```

### Romanized Only

```text
nae moheom-eui cheosgeol-eum-eul didyeo
```

### Original + Romanized

```text
내 모험의 첫걸음을 디뎌
nae moheom-eui cheosgeol-eum-eul didyeo
```

### Original + Translation

```text
내 모험의 첫걸음을 디뎌
I take the first step of my adventure
```

### Original + Romanized + Translation

```text
내 모험의 첫걸음을 디뎌
nae moheom-eui cheosgeol-eum-eul didyeo
I take the first step of my adventure
```

---

## UI Panel Behavior

The conversion panel should appear as an overlay on top of the lyrics/player view.

Visual style:

```css
.conversion-panel {
  background: rgba(20, 30, 34, 0.78);
  backdrop-filter: blur(18px);
  border-radius: 0 0 10px 10px;
  padding: 12px;
  color: var(--text-primary);
}
```

Positioning:

- Can be anchored near the bottom-right utility button.
- Can also appear as a left/right drawer.
- Should not permanently cover the active lyric line unless intentionally opened.

Controls:

- Dropdown for translation provider.
- Dropdown for translation display.
- Dropdown for language override.
- Dropdown for display mode.
- Convert/apply button.

Suggested component tree:

```text
FullScreenPlayer
├── PlaylistSourceHeader
├── VolumeRail
├── TrackIdentityPanel
│   ├── AlbumArtwork
│   ├── TrackMetadata
│   ├── PlaybackControls
│   └── ProgressBar
├── SyncedLyricsDisplay
│   └── LyricLineRenderer
└── LyricsConversionPanel
    ├── TranslationProviderSelect
    ├── TranslationDisplaySelect
    ├── LanguageOverrideSelect
    ├── DisplayModeSelect
    └── ConvertButton
```

---

## Lyrics Rendering Logic

Pseudo-flow:

```ts
function getActiveLyricLine(lines: LyricLine[], currentTimeMs: number) {
  return lines.find((line, index) => {
    const nextLine = lines[index + 1];
    const end = line.endTimeMs ?? nextLine?.startTimeMs ?? Infinity;
    return currentTimeMs >= line.startTimeMs && currentTimeMs < end;
  });
}
```

Rendering logic:

```ts
function renderLyricText(line: LyricLine, settings: LyricsConversionSettings) {
  const blocks: string[] = [];

  switch (settings.displayMode) {
    case 'original':
      blocks.push(line.original);
      break;

    case 'romanized':
      blocks.push(line.romanized ?? line.original);
      break;

    case 'translated':
      blocks.push(line.translation ?? line.original);
      break;

    case 'original-plus-romanized':
      blocks.push(line.original);
      if (line.romanized) blocks.push(line.romanized);
      break;

    case 'original-plus-translation':
      if (settings.translationDisplay === 'above-origin' && line.translation) {
        blocks.push(line.translation);
        blocks.push(line.original);
      } else if (settings.translationDisplay === 'replace-origin' && line.translation) {
        blocks.push(line.translation);
      } else {
        blocks.push(line.original);
        if (line.translation) blocks.push(line.translation);
      }
      break;

    case 'original-plus-romanized-plus-translation':
      blocks.push(line.original);
      if (line.romanized) blocks.push(line.romanized);
      if (line.translation) blocks.push(line.translation);
      break;
  }

  return blocks;
}
```

---

## Korean Romanization Notes

For Korean lyrics, `Romaja` should convert Hangul into Latin-script Korean pronunciation.

Example:

```text
내 모험의 첫걸음을 디뎌
nae moheom-eui cheosgeol-eum-eul didyeo
```

Implementation options:

1. Use a Korean romanization package.
2. Use preprocessed romanized lyric data.
3. Generate romanization server-side.
4. Store `.lrc` companion files for original, romanized, and translated lyrics.

Recommended for reliability:

```text
Use pre-authored lyric layers when possible.
```

Reason:

Automatic romanization can be ugly, inconsistent, or wrong for idol-pop lyrics, names, stylized English, Japanese text, and mixed-language lines.

---

## .LRC File Support

The project should support `.lrc` lyrics with timestamps.

Basic `.lrc` example:

```lrc
[00:01.35]I love the way you love the chase
[00:04.20]Hop, 내 모험의 첫걸음을 디뎌
[00:04.20]Hop, nae moheom-eui cheosgeol-eum-eul didyeo
```

Better structured approach:

Use separate lyric layers:

```text
song.original.lrc
song.romaja.lrc
song.en.lrc
```

Example:

```lrc
// song.original.lrc
[00:04.20]Hop, 내 모험의 첫걸음을 디뎌

// song.romaja.lrc
[00:04.20]Hop, nae moheom-eui cheosgeol-eum-eul didyeo

// song.en.lrc
[00:04.20]Hop, I take the first step of my adventure
```

Then merge by timestamp:

```ts
interface MergedLyricLine {
  startTimeMs: number;
  original?: string;
  romanized?: string;
  translation?: string;
}
```

This avoids guessing whether a repeated timestamp line is original, romanized, or translated.

---

## Recommended Tags for Lyric Modes

Use compact UI labels:

```text
ORG = Original lyrics
ROM = Romanized lyrics
EN  = English translation
JP  = Japanese translation
KO  = Korean original
```

For multilingual lyrics, avoid calling the original layer `KO` unless the whole lyric file is Korean.

Recommended neutral label:

```text
ORG
```

Reason:

A song can contain Korean, English, and Japanese in the same original lyric file. `ORG` means “the official/default lyric text,” regardless of language mixture.

---

## Interaction Requirements

### Keyboard

Implement these shortcuts if they do not conflict with the rest of the app:

```text
F      Toggle full-screen player
T      Toggle TV/display mode
C      Toggle conversion/config panel
L      Toggle lyrics visibility
Q      Toggle queue/playlist panel
ESC    Exit full-screen mode or close open overlay
Space  Play/pause
←/→    Seek backward/forward
↑/↓    Volume up/down
```

### Pointer

Required pointer interactions:

- Click play/pause.
- Drag progress bar to seek.
- Drag volume slider.
- Click conversion button to open panel.
- Click Convert to apply settings.
- Click outside panel to close it.

---

## State Architecture

Suggested global/full-screen player state:

```ts
interface FullScreenPlayerState {
  isFullScreen: boolean;
  isTvMode: boolean;
  showLyrics: boolean;
  showQueue: boolean;
  showConversionPanel: boolean;

  track: TrackMetadata | null;
  playback: PlaybackState;
  volume: VolumeState;
  lyrics: LyricsState;
}
```

Track metadata:

```ts
interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  album?: string;
  releaseDate?: string;
  artworkUrl?: string;
  sourceType?: 'playlist' | 'album' | 'queue' | 'search' | 'liked' | string;
  sourceName?: string;
}
```

Playback state:

```ts
interface PlaybackState {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  shuffle: boolean;
  repeatMode: 'off' | 'track' | 'context';
}
```

---

## Implementation Priority

### Phase 1 — Static Layout

Build the full-screen shell:

```text
- Background
- Top-left playlist header
- Album art
- Track metadata
- Playback controls
- Progress bar
- Volume rail
- Lyrics column
```

Use mock data first.

---

### Phase 2 — Synced Lyrics

Implement:

```text
- LRC parser
- Active lyric detection
- Focused active lyric styling
- Blurred nearby lyric styling
- Smooth lyric transitions
```

---

### Phase 3 — Lyrics Mode Switching

Implement display modes:

```text
ORG
ROM
EN
ORG + ROM
ORG + EN
ORG + ROM + EN
```

Use preloaded lyric layers before attempting automatic translation/romanization.

---

### Phase 4 — Conversion Panel

Implement the conversion/settings overlay:

```text
- Translation Provider
- Translation Display
- Language Override
- Display Mode
- Convert button
```

The panel should mutate lyric rendering state, not destroy original lyric data.

---

### Phase 5 — Polish

Add:

```text
- Keyboard shortcuts
- TV mode
- Queue panel
- Config persistence
- LocalStorage settings
- Responsive scaling
- Better transition timing
```

---

## Non-Negotiable UX Rules

1. The active lyric must always be the clearest text on the screen.
2. Romanization must never replace translation conceptually. Keep them separate.
3. Original lyrics must be preserved even when converted modes are active.
4. Mixed-language original lyrics should use `ORG`, not a single language tag.
5. Controls should stay secondary. This is a display-mode player, not a dashboard.
6. The conversion panel should be accessible but not visually dominant.
7. Pre-authored lyric layers are safer than automatic conversion for stylized pop lyrics.
8. Full-screen mode must remain usable with keyboard only.

---

## Visual Design Direction

The interface should feel like:

```text
Spotify full-screen mode + karaoke lyric stage + soft cinematic depth-of-field
```

Not like:

```text
A settings-heavy admin panel
A dense DAW interface
A YouTube clone
A normal web audio player
```

The player is the room. The lyrics are the vocalist. The album art is the poster on the back wall. Controls are just the stage crew in black.

