import { useMemo } from "react";
import { figmaStarAssets } from "../figma/assets";
import {
  buildStarFieldLayout,
  STAR_FIELD_REFERENCE,
  STAR_FIELD_TINT,
  type StarFieldOptions,
} from "../figma/starFieldLayout";

interface StarFieldProps extends StarFieldOptions {
  /** Reference container size the layout is computed against. */
  width?: number;
  height?: number;
  /** Sprite assets to scatter (defaults to the Figma small-star sprites). */
  assets?: readonly string[];
  /** Sprite fill color — uses the asset shape as a mask. */
  color?: string;
  className?: string;
}

/**
 * Scatters the small-star sprites across its container in a deterministic,
 * jittered star field (Figma "Small Stars" 227:288). Absolutely positioned —
 * the parent controls placement/size; sprite positions are percentage-based so
 * the field scales with the container.
 */
export default function StarField({
  width = STAR_FIELD_REFERENCE.width,
  height = STAR_FIELD_REFERENCE.height,
  assets = figmaStarAssets,
  color = STAR_FIELD_TINT,
  className,
  count,
  seed,
  minSize,
  maxSize,
}: StarFieldProps) {
  const placements = useMemo(
    () =>
      buildStarFieldLayout(width, height, {
        count,
        seed,
        minSize,
        maxSize,
        assetCount: assets.length,
      }),
    [width, height, count, seed, minSize, maxSize, assets.length],
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden${
        className ? ` ${className}` : ""
      }`}
      aria-hidden
    >
      {placements.map((star) => {
        const asset = assets[star.assetIndex]!;
        const positionStyle = {
          left: `${star.centerXPct}%`,
          top: `${star.centerYPct}%`,
          width: star.size,
          height: star.size,
          transform: "translate(-50%, -50%)",
        } as const;

        if (color) {
          return (
            <div
              key={star.id}
              className="absolute max-w-none"
              style={{
                ...positionStyle,
                backgroundColor: color,
                WebkitMaskImage: `url(${asset})`,
                maskImage: `url(${asset})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          );
        }

        return (
          <img
            key={star.id}
            src={asset}
            alt=""
            className="absolute max-w-none"
            style={positionStyle}
          />
        );
      })}
    </div>
  );
}
