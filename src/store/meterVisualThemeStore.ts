import { create } from "zustand";
import {
  DEFAULT_METER_VISUAL_THEME_ID,
  type MeterVisualThemeId,
} from "../meters/meterVisualThemes";

interface MeterVisualThemeState {
  visualThemeId: MeterVisualThemeId;
  setVisualThemeId: (id: MeterVisualThemeId) => void;
}

export const useMeterVisualThemeStore = create<MeterVisualThemeState>((set) => ({
  visualThemeId: DEFAULT_METER_VISUAL_THEME_ID,
  setVisualThemeId: (id) => set({ visualThemeId: id }),
}));
