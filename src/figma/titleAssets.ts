import { figmaAssets } from "./assets";

/** Song title SVG assets — intrinsic dimensions from Figma export (518×66). */
export const supernaturalTitleSvg = {
  src: figmaAssets.supernaturalTitle,
  width: 518,
  height: 66,
} as const;

/** Returns title SVG when a Figma asset exists for this song; otherwise undefined. */
export function getSongTitleSvg(releaseId: string, songId: string) {
  if (releaseId === "supernatural" || songId.startsWith("supernatural")) {
    return supernaturalTitleSvg;
  }
  return undefined;
}
