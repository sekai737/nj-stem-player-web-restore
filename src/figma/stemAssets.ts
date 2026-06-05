import type { StemId } from "../types";

/** Intrinsic SVG dimensions from Figma exports (public/figma). */
export const stemLabelSvg: Record<StemId, { src: string; width: number; height: number }> = {
  vocals: { src: "/figma/stem-track-vocals.svg", width: 108, height: 28 },
  instruments: { src: "/figma/stem-track-other.svg", width: 95, height: 28 },
  drums: { src: "/figma/stem-track-drums.svg", width: 105, height: 28 },
  bass: { src: "/figma/stem-track-bass.svg", width: 77, height: 28 },
};

export const soloIconSvg = {
  default: { src: "/figma/solo-icon-default.svg", width: 23, height: 32 },
  clicked: { src: "/figma/solo-icon-clicked.svg", width: 23, height: 32 },
} as const;

/** Fullscreen stem stack solo controls (121:438 / …). */
export const fullscreenSoloIconSvg = {
  default: { src: "/figma/fullscreen-solo-icon-default.svg", width: 16, height: 28 },
  clicked: { src: "/figma/fullscreen-solo-icon-clicked.svg", width: 16, height: 28 },
} as const;

/** Fullscreen stem stack mute controls (121:439 / …). */
export const fullscreenMuteIconSvg = {
  default: { src: "/figma/fullscreen-mute-icon-default.svg", width: 21, height: 28 },
  clicked: { src: "/figma/fullscreen-mute-icon-clicked.svg", width: 21, height: 28 },
} as const;

export const muteIconSvg = {
  default: { src: "/figma/mute-icon-default.svg", width: 32, height: 32 },
  clicked: { src: "/figma/mute-icon-clicked.svg", width: 32, height: 32 },
} as const;
