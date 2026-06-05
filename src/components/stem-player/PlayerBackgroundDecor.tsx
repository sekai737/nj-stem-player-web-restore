import type { BgDecorPlacement } from "../../figma/backgroundDecorLayout";

interface PlayerBackgroundDecorProps {
  placements: readonly BgDecorPlacement[];
}

/** Figma BG Elements (1:66) — COOL_FONT:Goop `?` / `!`, screen blend @ 50%. */
export default function PlayerBackgroundDecor({ placements }: PlayerBackgroundDecorProps) {
  return (
    <div className="bg-elements" aria-hidden data-node-id="1:66">
      {placements.map((star) => (
        <span
          key={star.id}
          className="bg-decor-star__glyph"
          data-figma-node="1:66"
          style={{
            left: `${star.centerXPct}%`,
            top: `${star.centerYPct}%`,
            fontSize: `${star.fontSize}px`,
            transform: `translate(-50%, -50%) rotate(${star.rotation}deg) skewX(${star.skewX}deg)${
              star.flipY ? " scaleY(-1)" : ""
            }`,
          }}
        >
          {star.character}
        </span>
      ))}
    </div>
  );
}
