import type { CSSProperties } from "react";
import { BG_DECOR_FONT_SIZE, BG_DECOR_STARS } from "../../figma/backgroundElements";

function px(value: number) {
  return `${value}px`;
}

/** Figma BG Elements (1:66) — 1920×1080 document pixels (scaled by parent transform). */
export default function PlayerBackgroundDecor() {
  return (
    <div className="bg-elements" aria-hidden>
      {BG_DECOR_STARS.map((star) => {
        const innerStyle = star.transform ? { transform: star.transform } : undefined;
        const glyphBoxStyle: CSSProperties = {
          width: px(star.glyphWidth),
          height: px(star.glyphHeight),
        };

        const glyph = (
          <span
            className="bg-decor-star__glyph"
            aria-hidden
            style={{ fontSize: px(BG_DECOR_FONT_SIZE) }}
          >
            {star.character}
          </span>
        );

        return (
          <div
            key={star.nodeId}
            className={`bg-decor-star bg-decor-star--${star.color}`}
            data-figma-node={star.nodeId}
            style={{
              left: px(star.left),
              top: px(star.top),
              width: px(star.width),
              height: px(star.height),
            }}
          >
            {star.transform ? (
              <div className="bg-decor-star__inner" style={innerStyle}>
                <div className="bg-decor-star__glyph-box" style={glyphBoxStyle}>
                  {glyph}
                </div>
              </div>
            ) : (
              <div className="bg-decor-star__glyph-box" style={glyphBoxStyle}>
                {glyph}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
