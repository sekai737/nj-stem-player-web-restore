import { useMemo } from "react";
import { buildBackgroundDecorLayout } from "../../figma/backgroundDecorLayout";
import {
  STAR_FIELD_REFERENCE,
  STEM_PLAYER_STAR_FIELD_SEED,
} from "../../figma/starFieldLayout";
import StarField from "../StarField";
import PlayerBackgroundDecor from "./PlayerBackgroundDecor";
import "../../styles/background-decor.css";

interface PlayerViewportBackgroundProps {
  fontsReady?: boolean;
}

/**
 * Full-viewport backdrop — gradient base + COOL decor (Figma 1:66) + star field.
 * Uses the same fixed 1920×1080 reference as Home and Song Select so stars and
 * glyphs stay stable on resize/zoom.
 */
export default function PlayerViewportBackground({
  fontsReady = true,
}: PlayerViewportBackgroundProps) {
  const decorPlacements = useMemo(
    () =>
      buildBackgroundDecorLayout(
        STAR_FIELD_REFERENCE.width,
        STAR_FIELD_REFERENCE.height,
      ),
    [],
  );

  return (
    <div className="player-viewport-bg pointer-events-none fixed inset-0" aria-hidden>
      <div className="player-viewport-bg__gradient absolute inset-0 bg-page-gradient" />
      {fontsReady ? <PlayerBackgroundDecor placements={decorPlacements} /> : null}
      <StarField
        width={STAR_FIELD_REFERENCE.width}
        height={STAR_FIELD_REFERENCE.height}
        seed={STEM_PLAYER_STAR_FIELD_SEED}
      />
    </div>
  );
}
