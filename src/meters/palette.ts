/**
 * @deprecated Prefer `getMeterVisualTokens` from `./meterVisualThemes`.
 * Re-exports default theme for any legacy imports.
 */
export {
  type MeterVisualThemeId,
  type MeterVisualTokens,
  getMeterVisualTokens,
  METER_VISUAL_THEMES,
  METER_VISUAL_THEME_IDS,
  DEFAULT_METER_VISUAL_THEME_ID,
} from "./meterVisualThemes";

import { getMeterVisualTokens } from "./meterVisualThemes";

export const METER_THEME = getMeterVisualTokens("blue");
export const MAGMA_LUT = METER_THEME.lut;
