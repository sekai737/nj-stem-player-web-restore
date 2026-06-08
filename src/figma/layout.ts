/** Stem Player frame (1:58) — 1920×1080 artboard, content column 1800px @ inset 60×56 */
/** Figma spacing primitive — matches `--spacing-sp-8` (8px). */
const SP_8 = 8;

/**
 * Figma Frame 12 (26:213): Frame 10 (lyrics row, 26:207) and Frame 11 (meters row, 26:212) share this Y.
 * Keeps Meters Box (26:215) top-aligned with Lyrics container (26:214).
 */
const CONTENT_ROW_TOP = 96;
const CONTENT_WIDTH = 1800;

/**
 * Figma Track Info Container (26:207) @ x=306 — title + lyrics in the 1800px column.
 * Title (26:216) w=562; Lyrics (26:214) x=546 w=948 → Title mr-[-16px] overlap.
 */
const METERS_BOX_WIDTH = 273;
/** Figma 26:207 x=306 → meters (273) + 33px gap. */
const FRAME_10_LEFT = 306;
const TITLE_FRAME_WIDTH = 562;
const TITLE_FRAME_HEIGHT = 127;
/** Figma Title `mr-[-16px]` — lyrics start at x=546 (562 − 16). */
const TITLE_LYRICS_OVERLAP = 16;
/** Lyrics container (26:214) — MCP w=948 h=120; Frame 10 row h=127 */
const LYRICS_CONTAINER_WIDTH = 948;
const LYRICS_CONTAINER_HEIGHT = 120;

/**
 * Figma Title (26:216) — dev-mode child frames (MCP metadata, document space).
 * 3:314 y=0 h=22 → 3:282 y=22 h=86 → 3:280 y=108 h=19 (127 total; item spacing 0).
 */
const TITLE_NOW_PLAYING = { left: 0, top: 0, width: 76, height: 22 } as const;
const TITLE_TRACK_TITLE = { left: 1, top: 22, width: 511, height: 86 } as const; // 3:282 x≈0.706
const TITLE_METADATA = { left: 0, top: 108, width: 562, height: 19 } as const;
/** Legacy absolute slot — Title (26:216) now uses flex-col items-start in SongTitleBlock. */
const TITLE_TRACK_SLOT_TOP = TITLE_NOW_PLAYING.top + TITLE_NOW_PLAYING.height;
const TITLE_TRACK_SLOT_HEIGHT = TITLE_METADATA.top - TITLE_TRACK_SLOT_TOP;

/** Figma `small-stars.svg` — 1836×984, centered in Stem Player frame (1:58) */
const SMALL_STARS_WIDTH = 1836;
const SMALL_STARS_HEIGHT = 984;
const SMALL_STARS_LEFT = (1920 - SMALL_STARS_WIDTH) / 2;
const SMALL_STARS_TOP = (1080 - SMALL_STARS_HEIGHT) / 2;

export const FIGMA = {
  /** Frame 12 — Y shared by lyrics row (Frame 10) and meters/stems row (Frame 11) */
  contentRowTop: CONTENT_ROW_TOP,
  frame: { width: 1920, height: 1080 },
  /** Decorative stars overlay (public/figma/small-stars.svg) */
  smallStars: {
    left: SMALL_STARS_LEFT,
    top: SMALL_STARS_TOP,
    width: SMALL_STARS_WIDTH,
    height: SMALL_STARS_HEIGHT,
  },
  inset: { x: 60, y: 56 },
  /** Frame 12 (node 26:213) — 1800×956 @ content inset */
  content: { width: CONTENT_WIDTH, height: 956 },
  header: { height: 44, icon: 44, iconGap: 12, fixedNavIcon: 35, fixedNavIconGap: 8 },
  /** Frame 11 (node 26:212) — 1800×860; meters top-left (0,0), stem block y=160, progress y=820 */
  main: { top: CONTENT_ROW_TOP, height: 860 },
  /** Frame 10 (26:207) — title row + lyrics; overlap via titleLyricsOverlap */
  titleRow: {
    left: FRAME_10_LEFT,
    top: CONTENT_ROW_TOP,
    /** Track Info row width — content column minus Frame 10 inset (1800 − 306). */
    trackInfoWidth: CONTENT_WIDTH - FRAME_10_LEFT,
    /** Figma 26:214 x within 26:207 — lyrics left when Title is w=562 mr-[-16]. */
    lyricsLeft: TITLE_FRAME_WIDTH - TITLE_LYRICS_OVERLAP,
    /** Figma Title negative margin toward lyrics (flex gap is 0). */
    titleLyricsOverlap: TITLE_LYRICS_OVERLAP,
    titleWidth: TITLE_FRAME_WIDTH,
    /** Title group (26:216) — MCP h=127 */
    titleHeight: TITLE_FRAME_HEIGHT,
    /** Lyrics container (26:214) — widened left to match meters→title gap (was 884) */
    lyricsWidth: LYRICS_CONTAINER_WIDTH,
    lyricsHeight: LYRICS_CONTAINER_HEIGHT,
    /** Frame 10: Title extends 7px below Lyrics (127 − 120); metadata sits in that band per Figma y=108. */
    titleExtendsBelowLyrics: TITLE_FRAME_HEIGHT - LYRICS_CONTAINER_HEIGHT,
    /** Title child frames — Now Playing dimensions; title/metadata use flex flow in SongTitleBlock. */
    titleStack: {
      nowPlaying: TITLE_NOW_PLAYING,
      trackTitle: TITLE_TRACK_TITLE,
      trackTitleSlot: {
        left: TITLE_NOW_PLAYING.left,
        top: TITLE_TRACK_SLOT_TOP,
        width: TITLE_FRAME_WIDTH,
        height: TITLE_TRACK_SLOT_HEIGHT,
      },
      metadata: TITLE_METADATA,
    },
  },
  meters: {
    left: 0,
    top: 0,
    /** Meters Box (node 26:215) — Figma MCP: 273×768, instance @ (0,0) in Frame 11 */
    width: METERS_BOX_WIDTH,
    height: 768,
    /** Label pill (node 10:84) — Green Gradient, pop shadow 2×; Figma absolute frame 76×25 @ left 99 top 6 */
    label: { left: 99, top: 6, width: 76, height: 25 },
    /** Drop-down (node 73:897) — 24×24 component; positioned SP_8 from Meters Box top-left */
    themePicker: { left: SP_8, top: SP_8, icon: 24 },
    /**
     * Plot stack inside Meters Box — Figma file has no separate frame for live plots; inset uses design tokens.
     * Top: theme row bottom + SP_8 = SP_8 (picker top) + 24 (picker height) + SP_8 = 40px.
     * x / bottom / gap: SP_8 (matches `--spacing-sp-8`).
     */
    plotsInset: {
      top: SP_8 + 24 + SP_8,
      x: SP_8,
      bottom: SP_8,
      gap: SP_8,
    },
  },
  stems: {
    left: 305,
    top: 160,
    width: 1495,
    height: 608,
    rowWidth: 1495,
    rowHeight: 128,
    rowGap: 32,
    trackWidth: 1342,
    trackHeight: 128,
    trackPaddingX: 48,
    trackPaddingY: 24,
    trackGap: 32,
    trackRadius: 16,
    labelWidth: 109,
    labelHeight: 26,
    labelFontSize: 48,
    waveformHeight: 80,
    waveformRadius: 16,
    soloMuteGap: 16,
    soloWidth: 22,
    muteWidth: 31,
    soloMuteHeight: 28,
    soloMuteFontSize: 64,
    volumeWidth: 121,
    volumeHeight: 43,
    volumeGap: 5,
    volumePadding: 16,
    volumeRadius: 24,
    volumeIconWidth: 15,
    volumeIconHeight: 11,
    sliderWidth: 69,
    sliderHeight: 16,
    sliderTrackHeight: 4,
    sliderKnobSize: 16,
    /** Horizontal drag gain — lower = slower, more forgiving scrub. */
    volumeDragSensitivity: 0.58,
    /** Click/tap eases toward target (1 = jump, lower = softer). */
    volumeClickBlend: 0.82,
    /** Keyboard nudge per arrow key (0–1). */
    volumeKeyStep: 0.018,
    /** Volume % hover label (above knob) */
    volumeTooltip: {
      offsetY: 6,
      paddingX: 8,
      paddingY: 2,
      radius: 8,
      fontSize: 12,
    },
  },
  /** Frame 113:107 — Previous Song + Progress bar + Next Song @ y=820, w=1800 */
  transportRow: {
    left: 0,
    top: 820,
    width: 1800,
    height: 40,
    gap: 113,
    songNavIcon: 40,
  },
  progress: {
    width: 1494,
    height: 40,
    paddingX: 24,
    paddingY: 8,
    gap: 24,
    radius: 50,
    playWidth: 20,
    playHeight: 22,
    trackWidth: 1281,
    trackHeight: 24,
    trackBarHeight: 4,
    trackBarRadius: 2,
    knobRadius: 11,
  },
} as const;
