/**
 * GGD product-page media player (ggd.co / media-player.js + theme.css).
 * @see https://ggd.co/products/one-kit-wonder-the-downbeat
 */
export const GGD_WAVESURFER_OPTIONS = {
  responsive: true,
  cursorWidth: 0,
  barGap: 0,
  barHeight: 1,
  barMinHeight: 1,
  barWidth: 0,
  /**
   * Render supplied peaks as-is. Visual loudness balancing happens in
   * extractPeaks → normalizePeaks; WaveSurfer's own max-normalization would
   * re-stretch each stem to full height and undo that equalization.
   */
  normalize: false,
} as const;

/** Playhead width — matches `--stem-waveform-playhead-width`. */
export const GGD_PLAYHEAD_WIDTH_PX = 4;

/**
 * GGD only drives #progress-bar-inner — no WaveSurfer progress layer.
 * Hide WS v7 clip-path / progress canvases so they don't fight the playhead.
 */
export function disableWaveSurferProgress(waveformMount: HTMLElement | null): void {
  const host = waveformMount?.firstElementChild as HTMLElement | null;
  const shadow = host?.shadowRoot;
  if (!shadow) return;

  shadow.querySelectorAll<HTMLElement>(".progress, .cursor").forEach((el) => {
    el.style.display = "none";
  });

  const canvases = shadow.querySelector<HTMLElement>(".canvases");
  if (canvases) canvases.style.clipPath = "none";
}

/**
 * Position #progress-bar-inner playhead at a snapped pixel X.
 * Uses a fixed 4px solid bar (not border-right on fractional width) for a crisp line.
 */
export function setPlayheadPosition(
  playhead: HTMLElement | null,
  outer: HTMLElement | null,
  progress: number,
): void {
  if (!playhead || !outer) return;
  const trackWidth = outer.offsetWidth;
  if (trackWidth <= 0) return;

  const clamped = Math.min(1, Math.max(0, progress));
  const x = Math.round(clamped * trackWidth);
  // Anchor bar's right edge at x — integer left avoids transform blur under scale()
  playhead.style.left = `${Math.max(0, x - GGD_PLAYHEAD_WIDTH_PX)}px`;
}
