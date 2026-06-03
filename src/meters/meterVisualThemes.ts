/**
 * Meter visualization themes — Figma gray wells + Swiss labels for color presets.
 * Default = original dark “black panel” meters (magma spectrogram, cyan/pink accents).
 */

export type MeterVisualThemeId =
  | "default"
  | "green"
  | "blue"
  | "yellow"
  | "pink"
  | "purple";

export const METER_VISUAL_THEME_IDS: MeterVisualThemeId[] = [
  "default",
  "blue",
  "pink",
  "yellow",
  "green",
  "purple",
];

export interface MeterVisualTokens {
  /** Spectrogram heat LUT (RGBA premultiplied-friendly, A=255 in LUT) */
  lut: Uint8ClampedArray;
  plotWell: string;
  text: string;
  textMuted: string;
  grid: string;
  gridStrong: string;
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  spectrumFill: string;
  spectrumLine: string;
  spectrumBarLow: string;
  spectrumBarMid: string;
  spectrumBarHigh: string;
  fontMedium: string;
  fontRegular: string;
  /** Correlation bar trough (neutral, subtle) */
  correlationTrough: string;
}

type MeterTokenOverrides = Partial<
  Pick<
    MeterVisualTokens,
    | "plotWell"
    | "text"
    | "textMuted"
    | "grid"
    | "gridStrong"
    | "spectrumFill"
    | "spectrumLine"
    | "spectrumBarLow"
    | "spectrumBarMid"
    | "spectrumBarHigh"
    | "correlationTrough"
  >
>;

function buildLut(stops: [number, number, number][], size = 512): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(size * 4);
  for (let i = 0; i < size; i++) {
    const t = size > 1 ? i / (size - 1) : 0;
    const idx = t * (stops.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.min(stops.length - 1, lower + 1);
    const frac = idx - lower;
    const [r0, g0, b0] = stops[lower];
    const [r1, g1, b1] = stops[upper];
    const o = i * 4;
    lut[o] = Math.round(r0 + (r1 - r0) * frac);
    lut[o + 1] = Math.round(g0 + (g1 - g0) * frac);
    lut[o + 2] = Math.round(b0 + (b1 - b0) * frac);
    lut[o + 3] = 255;
  }
  return lut;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function gridFromPrimary(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const FONTS = {
  fontMedium: "Swiss721Medium, sans-serif",
  fontRegular: "Swiss721Regular, sans-serif",
} as const;

const PLOT_WELL = "rgb(179 179 179 / 0.2)";
const TEXT = "#000000";
const TEXT_MUTED = "#999999";
const CORR_TROUGH = "rgba(0, 0, 0, 0.08)";

/** Magma-style heatmap (original dark spectrogram) */
const MAGMA_LUT_STOPS: [number, number, number][] = [
  [0, 0, 4],
  [40, 12, 72],
  [120, 28, 108],
  [200, 40, 100],
  [240, 88, 48],
  [252, 168, 32],
  [252, 228, 92],
  [255, 255, 220],
];

const GREEN_LUT: [number, number, number][] = [
  [255, 255, 255],
  [240, 255, 230],
  [210, 255, 180],
  [180, 250, 120],
  [145, 229, 62],
  [120, 220, 50],
  [88, 254, 51],
  [50, 200, 30],
];

const BLUE_LUT: [number, number, number][] = [
  [255, 255, 255],
  [230, 245, 255],
  [194, 228, 253],
  [161, 202, 254],
  [120, 180, 255],
  [1, 172, 254],
  [0, 140, 220],
  [0, 100, 180],
];

const YELLOW_LUT: [number, number, number][] = [
  [255, 255, 255],
  [255, 255, 235],
  [255, 255, 180],
  [255, 255, 100],
  [255, 240, 50],
  [255, 220, 30],
  [230, 200, 20],
  [200, 160, 10],
];

const PINK_LUT: [number, number, number][] = [
  [255, 255, 255],
  [255, 235, 245],
  [255, 200, 225],
  [255, 150, 200],
  [255, 110, 180],
  [255, 78, 164],
  [232, 50, 138],
  [200, 30, 110],
];

const PURPLE_LUT: [number, number, number][] = [
  [255, 255, 255],
  [245, 235, 255],
  [230, 200, 255],
  [200, 150, 255],
  [160, 100, 240],
  [120, 60, 220],
  [90, 40, 180],
  [60, 20, 120],
];

function makeTokens(
  lutStops: [number, number, number][],
  primary: string,
  secondary: string,
  tertiary: string,
  accent: string,
  spectrumFillAlpha: string,
  overrides?: MeterTokenOverrides,
): MeterVisualTokens {
  const base: MeterVisualTokens = {
    lut: buildLut(lutStops),
    plotWell: PLOT_WELL,
    text: TEXT,
    textMuted: TEXT_MUTED,
    grid: gridFromPrimary(primary, 0.12),
    gridStrong: gridFromPrimary(primary, 0.22),
    primary,
    secondary,
    tertiary,
    accent,
    spectrumFill: spectrumFillAlpha,
    spectrumLine: accent,
    spectrumBarLow: tertiary,
    spectrumBarMid: secondary,
    spectrumBarHigh: primary,
    fontMedium: FONTS.fontMedium,
    fontRegular: FONTS.fontRegular,
    correlationTrough: CORR_TROUGH,
  };
  return { ...base, ...overrides };
}

export const METER_VISUAL_THEMES: Record<MeterVisualThemeId, MeterVisualTokens> = {
  /** Dark panel + magma heatmap + cyan/pink (original EasyMeter-style look) */
  default: makeTokens(
    MAGMA_LUT_STOPS,
    "#5ce1ff",
    "#78c9ff",
    "#ff6eb4",
    "#ff6eb4",
    "rgba(90, 200, 255, 0.22)",
    {
      plotWell: "#0a0812",
      text: "rgba(200, 240, 255, 0.92)",
      textMuted: "rgba(140, 180, 210, 0.55)",
      grid: "rgba(120, 201, 255, 0.14)",
      gridStrong: "rgba(120, 201, 255, 0.28)",
      spectrumLine: "#5ce1ff",
      spectrumBarLow: "#9b4dff",
      spectrumBarMid: "#3ecf8e",
      spectrumBarHigh: "#5ce1ff",
      correlationTrough: "rgba(0, 0, 0, 0.4)",
    },
  ),
  green: makeTokens(
    GREEN_LUT,
    "#58fe33",
    "#91e53e",
    "#e8ffd8",
    "#3dd41a",
    "rgba(145, 229, 62, 0.28)",
  ),
  blue: makeTokens(
    BLUE_LUT,
    "#01acfe",
    "#a1cafe",
    "#c2e4fd",
    "#0090d4",
    "rgba(1, 172, 254, 0.22)",
  ),
  yellow: makeTokens(
    YELLOW_LUT,
    "#ffff26",
    "#ffe566",
    "#fffce0",
    "#e8c800",
    "rgba(255, 255, 38, 0.26)",
  ),
  pink: makeTokens(
    PINK_LUT,
    "#ff6eb4",
    "#ffb8dc",
    "#ffe0f0",
    "#e84d9a",
    "rgba(255, 110, 180, 0.28)",
  ),
  purple: makeTokens(
    PURPLE_LUT,
    "#a855f7",
    "#c4b5fd",
    "#ede9fe",
    "#7c3aed",
    "rgba(168, 85, 247, 0.24)",
  ),
};

export function getMeterVisualTokens(id: MeterVisualThemeId): MeterVisualTokens {
  return METER_VISUAL_THEMES[id];
}

export const DEFAULT_METER_VISUAL_THEME_ID: MeterVisualThemeId = "blue";

export const METER_THEME_LABELS: Record<MeterVisualThemeId, string> = {
  default: "Default",
  green: "Green",
  blue: "Blue",
  yellow: "Yellow",
  pink: "Pink",
  purple: "Purple",
};
