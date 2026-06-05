/**
 * Figma BG Elements (1:66) — COOL_FONT:Goop `?` / `!` decorations.
 * Figma scatters large gray glyphs (screen blend, 50%) across the frame.
 * We reproduce the same density/balance with a deterministic jittered grid so
 * the layer fills the full viewport evenly without clustering or empty areas.
 */

/** Stable seed — identical layout per viewport size on every load. */
const LAYOUT_SEED = 0x4e4a_4247;

/** Slightly denser than Figma reference (7 over 1920×1080 ≈ 1 per ~296k px²). */
const FIGMA_DECOR_AREA_PER_GLYPH = 235_000;

/**
 * ~70% `?` / 30% `!` (Figma weighting), spatially interleaved so neither
 * character clusters. 7 `?` + 3 `!` per 10 placements.
 */
const CHARACTER_PATTERN: readonly ("!" | "?")[] = [
  "?",
  "?",
  "!",
  "?",
  "?",
  "?",
  "!",
  "?",
  "?",
  "!",
];

export type BgDecorPlacement = {
  id: string;
  character: "!" | "?";
  /** Center position as viewport percentage. */
  centerXPct: number;
  centerYPct: number;
  fontSize: number;
  rotation: number;
  skewX: number;
  flipY: boolean;
};

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Build an evenly distributed decoration layout for the live viewport.
 * Jittered grid keeps Figma's visual density while guaranteeing coverage.
 */
export function buildBackgroundDecorLayout(
  viewportW: number,
  viewportH: number,
): BgDecorPlacement[] {
  if (viewportW <= 0 || viewportH <= 0) return [];

  const area = viewportW * viewportH;
  const count = clamp(Math.round(area / FIGMA_DECOR_AREA_PER_GLYPH), 7, 15);

  const aspect = viewportW / viewportH;
  const rows = clamp(Math.round(Math.sqrt(count / aspect)), 1, count);

  const cellH = viewportH / rows;
  /** Avg cell width across rows — used for glyph scale only. */
  const avgCols = count / rows;
  const cellW = viewportW / Math.max(1, avgCols);
  /** Figma glyphs are large/prominent; scale to ~1.15× the smaller cell edge. */
  const fontSize = Math.min(cellW, cellH) * 1.15;

  const rng = mulberry32(LAYOUT_SEED + count * 101 + rows * 17);
  const placements: BgDecorPlacement[] = [];

  /** Spread items per row (remainder on the first rows) so no row is left empty. */
  const basePerRow = Math.floor(count / rows);
  const extra = count % rows;

  let index = 0;
  for (let row = 0; row < rows; row++) {
    const itemsInRow = basePerRow + (row < extra ? 1 : 0);
    /** Stagger alternate rows by half a step to avoid vertical seams / gaps. */
    const rowOffset = row % 2 === 0 ? 0 : 0.5 / itemsInRow;

    for (let col = 0; col < itemsInRow; col++, index++) {
      const colFrac = (col + 0.5) / itemsInRow + rowOffset;
      const rowFrac = (row + 0.5) / rows;

      /** Tight jitter keeps even coverage while breaking up the grid look. */
      const jitterX = (rng() - 0.5) * (viewportW / itemsInRow) * 0.28;
      const jitterY = (rng() - 0.5) * cellH * 0.28;
      const cx = colFrac * viewportW + jitterX;
      const cy = rowFrac * viewportH + jitterY;

      placements.push({
        id: `decor-${index}`,
        character: CHARACTER_PATTERN[index % CHARACTER_PATTERN.length]!,
        centerXPct: clamp((cx / viewportW) * 100, 3, 97),
        centerYPct: clamp((cy / viewportH) * 100, 4, 96),
        fontSize,
        rotation: -150 + rng() * 300,
        skewX: (rng() - 0.5) * 12,
        flipY: rng() > 0.8,
      });
    }
  }

  return placements;
}
