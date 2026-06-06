/**
 * Star-field layout for the Figma "Small Stars" sprites (227:288).
 *
 * `small-stars.svg` scatters ~12 small star sprites across the 1836×984 frame
 * at irregular positions/sizes. We reproduce that density and balance with a
 * deterministic jittered grid so the field feels organic (no rows, no
 * clustering, no large gaps) while staying identical on every render.
 */

/** Reference frame the Figma composition was authored against. */
export const STAR_FIELD_REFERENCE = { width: 1920, height: 1080 } as const;

/** Stable seed — identical layout per (size, options) on every load. */
const LAYOUT_SEED = 0x4e_4a_5f_33;

/** Denser than the small-stars.svg reference (~one per 80k px²). */
const REFERENCE_AREA_PER_STAR = 80_000;

/** Sprite edge range — a touch smaller than the reference. */
const MIN_SIZE = 22;
const MAX_SIZE = 38;

export type StarPlacement = {
  id: string;
  /** Index into the caller's asset list. */
  assetIndex: number;
  /** Center position as a percentage of the container. */
  centerXPct: number;
  centerYPct: number;
  /** Edge length in px, scaled relative to the reference frame width. */
  size: number;
};

export interface StarFieldOptions {
  /** Number of sprites. Defaults to the reference density for the container. */
  count?: number;
  /** Distinct sprite assets to cycle through (for balanced variety). */
  assetCount?: number;
  /** Override the deterministic seed to reshuffle the field. */
  seed?: number;
  minSize?: number;
  maxSize?: number;
}

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

/** Seeded permutation of [0, n) — even sprite variety without adjacent repeats. */
function shuffledOrder(n: number, rng: () => number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/**
 * Build a deterministic, evenly distributed star field for a container.
 * A jittered grid preserves the reference density/balance while breaking up
 * any visible rows or columns.
 */
export function buildStarFieldLayout(
  width: number = STAR_FIELD_REFERENCE.width,
  height: number = STAR_FIELD_REFERENCE.height,
  options: StarFieldOptions = {},
): StarPlacement[] {
  if (width <= 0 || height <= 0) return [];

  const assetCount = Math.max(1, options.assetCount ?? 1);
  const area = width * height;
  const count =
    options.count ?? clamp(Math.round(area / REFERENCE_AREA_PER_STAR), 14, 40);
  if (count <= 0) return [];

  const minSize = options.minSize ?? MIN_SIZE;
  const maxSize = options.maxSize ?? MAX_SIZE;
  /** Keep sprite scale proportional when the container differs from reference. */
  const sizeScale = width / STAR_FIELD_REFERENCE.width;

  const aspect = width / height;
  const rows = clamp(Math.round(Math.sqrt(count / aspect)), 1, count);

  const cellH = height / rows;
  const rng = mulberry32((options.seed ?? LAYOUT_SEED) + count * 131 + rows * 17);
  const variety = shuffledOrder(assetCount, rng);

  const basePerRow = Math.floor(count / rows);
  const extra = count % rows;

  const placements: StarPlacement[] = [];
  let index = 0;

  for (let row = 0; row < rows; row++) {
    const itemsInRow = basePerRow + (row < extra ? 1 : 0);
    /** Stagger alternate rows so columns never line up. */
    const rowOffset = row % 2 === 0 ? 0 : 0.5 / itemsInRow;

    for (let col = 0; col < itemsInRow; col++, index++) {
      const colFrac = (col + 0.5) / itemsInRow + rowOffset;
      const rowFrac = (row + 0.5) / rows;

      /** Tight jitter keeps coverage even while hiding the grid. */
      const jitterX = (rng() - 0.5) * (width / itemsInRow) * 0.55;
      const jitterY = (rng() - 0.5) * cellH * 0.55;
      const cx = colFrac * width + jitterX;
      const cy = rowFrac * height + jitterY;

      const size = (minSize + rng() * (maxSize - minSize)) * sizeScale;

      placements.push({
        id: `star-${index}`,
        assetIndex: variety[index % assetCount]!,
        centerXPct: clamp((cx / width) * 100, 2, 98),
        centerYPct: clamp((cy / height) * 100, 2, 98),
        size,
      });
    }
  }

  return placements;
}
