import { useMemo } from "react";
import { buildBackgroundDecorLayout } from "../../figma/backgroundDecorLayout";
import { useViewportSize } from "../../hooks/useViewportSize";
import PlayerBackgroundDecor from "./PlayerBackgroundDecor";
import "../../styles/background-decor.css";

interface PlayerViewportBackgroundProps {
  fontsReady?: boolean;
}

/**
 * Full-viewport backdrop — gradient base + COOL decor (Figma 1:66).
 * Fixed to the screen so mix-blend-screen interacts with the gradient everywhere.
 */
export default function PlayerViewportBackground({
  fontsReady = true,
}: PlayerViewportBackgroundProps) {
  const { width, height } = useViewportSize();
  const placements = useMemo(
    () => buildBackgroundDecorLayout(width, height),
    [width, height],
  );

  return (
    <div className="player-viewport-bg pointer-events-none fixed inset-0" aria-hidden>
      <div className="player-viewport-bg__gradient absolute inset-0 bg-page-gradient" />
      {fontsReady ? (
        <div className="player-viewport-bg__decor absolute inset-0 overflow-visible">
          <PlayerBackgroundDecor placements={placements} />
        </div>
      ) : null}
    </div>
  );
}
