import type { StemId } from "../types";

/** Stereo pan per stem (mono stems are spread across the field). */
export const STEM_PAN: Record<StemId, number> = {
  vocals: 0,
  instruments: -0.55,
  drums: 0.15,
  bass: 0.55,
};
