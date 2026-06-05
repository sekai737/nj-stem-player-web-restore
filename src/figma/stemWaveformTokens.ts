/** Read a resolved CSS custom property from `:root` (for canvas APIs that need hex/rgb strings). */
export function readCssColorVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Figma stem waveform trace — `--stem-waveform-trace`. */
export function getStemWaveformTraceColor(): string {
  return readCssColorVar("--stem-waveform-trace", "rgba(102, 102, 102, 0.35)");
}

/** Figma stem waveform playhead — `--stem-waveform-playhead`. */
export function getStemWaveformPlayheadColor(): string {
  return readCssColorVar("--stem-waveform-playhead", "#ffffff");
}
