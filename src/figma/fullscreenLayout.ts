/**
 * Fullscreen Mode (Figma node 120:93) — 1800×956 content frame measurements.
 * @see docs/figma-design-tokens-audit.md
 */
export const FIGMA_FULLSCREEN = {
  frame: { width: 1800, height: 956 },
  insetX: 60,
  header: {
    /** Figma 120:261 */
    height: 88,
    paddingY: 16,
    contentHeight: 56,
    iconSize: 56,
    titleSize: 32,
  },
  footer: {
    height: 92,
    pillRadius: 48,
    pillPaddingX: 24,
    pillPaddingY: 8,
    labelSize: 24,
    sendIconWidth: 48,
    sendIconHeight: 46,
  },
  main: {
    top: 88,
    bottom: 92,
    /** Header bottom → footer top (Figma 120:93): 956 − 88 − 92 */
    usableHeight: 776,
    lyricInsetLeft: 60,
  },
  lyricFeed: {
    /** First member message frame (120:170) — y=88 within 120:93 (header bottom). */
    columnTopPx: 88,
    avatarSize: 72,
    haerinAvatarWidth: 70,
    nameSize: 24,
    nameOffsetLeft: 96,
    bubblePaddingX: 32,
    bubblePaddingY: 16,
    bubbleRadius: 24,
    bubbleTextSize: 32,
    timestampSize: 24,
    emojiSize: 26,
    rowGap: 24,
    /** Vertical gap between messages (Figma 120:170 → 120:189 ≈ 32px) */
    messageGap: 32,
    /** Last bubble bottom → footer top (Figma 120:205 → 120:94: 864 − 832) */
    footerGap: 32,
  },
  /** Frame 22 (127:194) — x=1075 y=158 w=661 h=640 within 120:93 */
  rightCluster: {
    left: 1075,
    top: 158,
    width: 661,
    height: 640,
    /** Lyrics column ends before the cluster (1075 − inset 60). */
    lyricColumnWidth: 1015,
    /** Frame 24 (161:152) — shifts playback+volume inward */
    shiftX: 52,
    /** Frame 23 (161:151) — card + stems */
    playback: {
      width: 569,
      height: 640,
      cardToStemGap: 24,
      /** Master mix — card only (426); stems column (24 + 119) collapses */
      masterWidth: 426,
    },
    /** Gap Frame 23 end (569) → volume (649) */
    volumeGap: 80,
  },
  /** Control Icons — Figma 121:434 (x=450, y=196 within Frame 23) */
  stemStack: {
    designWidth: 119,
    designHeight: 248,
    width: 119,
    height: 248,
    gap: 24,
    offsetX: 450,
    offsetTop: 196,
    buttonWidth: 119,
    buttonHeight: 44,
    paddingX: 16,
    paddingY: 8,
    iconGap: 16,
    radiusLead: 22,
    radiusRest: 25,
    iconSize: 24,
    labelsWidth: 45,
    soloWidth: 16,
    muteWidth: 21,
    soloMuteHeight: 28,
    soloMuteGap: 8,
  },
  /**
   * Now Playing Card — Figma 121:299 at (0, 0) in Frame 23
   * Sized to 640/772 of the header–footer usable band.
   */
  playerCard: {
    /** Card frame (120:298) — 426×640 */
    designWidth: 426,
    designHeight: 640,
    width: 426,
    height: 640,
    contentInsetX: 33,
    contentInsetTop: 32,
    innerWidth: 360,
    sectionGap: 16,
    artSize: 360,
    radius: 16,
    titleSize: 32,
    artistSize: 16,
    artistOffsetTop: 4,
    albumSize: 12,
    albumOffsetTop: 4,
    metaWidth: 190,
    titleLineHeight: 38,
    innerHeight: 567,
    progressRowWidth: 332,
    progressInsetX: 14,
    transportGap: 64,
    navIconSize: 40,
    playSize: 64,
    playIconWidth: 28,
    playIconHeight: 32,
    progressWidth: 272,
    progressHeight: 16,
    progressTrackHeight: 4,
    progressThumbSize: 16,
    progressRowGap: 10,
    timeSize: 11,
  },
  /**
   * Volume Slider — Figma 120:241 (x=649, y=118 in Frame 24)
   * Height is 404/640 of the Now Playing Card; shares --fs-ui-scale with card.
   */
  volume: {
    designWidth: 68,
    designHeight: 404,
    width: 68,
    height: 404,
    paddingX: 16,
    paddingY: 24,
    gap: 16,
    radius: 37,
    labelSize: 16,
    labelHeight: 19,
    trackWidth: 8,
    trackHeight: 288,
    trackRadius: 4,
    thumbSize: 24,
    iconWidth: 24,
    iconHeight: 17,
    /** y within right cluster (127:194) */
    offsetTop: 118,
  },
} as const;
