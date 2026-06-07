/** Figma 262:193 Song Selector Page — reference frame 1920×1080. */
export const SONG_SELECT_REFERENCE = { width: 1920, height: 1080 } as const;

export const FIGMA_SONG_SELECT = {
  main: {
    width: 1112,
    height: 803.156,
    left: 404,
    top: 138,
    gap: 40,
  },
  homeIcon: {
    left: 60,
    top: 56,
    size: 44,
  },
  songInfo: {
    height: 718.156,
    paddingX: 240,
    paddingY: 32,
    gap: 24,
    radius: 24,
  },
  albumInfo: {
    width: 284,
    titleSize: 48,
    titleHeight: 58,
    metaSize: 16,
    metaHeight: 19,
  },
  carousel: {
    width: 632,
    height: 392,
    gap: 69,
    navSize: 56,
    centerSize: 392,
    centerBorder: 4,
    sideSize: 296,
    sideTop: 48,
    /** Figma 262:427 / 262:430 absolute positions in Images Container (262:380). */
    sidePrevLeft: -207,
    sideNextLeft: 543,
  },
  trackInfo: {
    width: 172,
    titleWidth: 194,
    titleSize: 32,
    titleHeight: 38,
    indexSize: 16,
    indexHeight: 19,
    gap: 4,
  },
  openPlayer: {
    width: 220.059,
    height: 52.156,
    /** Figma 262:382 — text vector inside Open Player Button (262:354) */
    text: {
      left: 32,
      top: 10,
      width: 156.059,
      height: 36.156,
    },
  },
  remixFilter: {
    width: 642,
    height: 45,
    left: 235,
    gap: 478,
    paddingX: 24,
    paddingY: 8,
    radius: 64,
    labelSize: 24,
    iconSize: 24,
  },
} as const;
