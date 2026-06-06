import { useMemo } from "react";
import { figmaStarAssets } from "../figma/assets";
import {
  buildStarFieldLayout,
  STAR_FIELD_REFERENCE,
  type StarFieldOptions,
} from "../figma/starFieldLayout";

interface StarFieldProps extends StarFieldOptions {
  /** Reference container size the layout is computed against. */
  width?: number;
  height?: number;
  /** Sprite assets to scatter (defaults to the Figma small-star sprites). */
  assets?: readonly string[];
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
      {placements.map((star) => (
        <img
          key={star.id}
          src={assets[star.assetIndex]}
          alt=""
          className="absolute max-w-none"
          style={{
            left: `${star.centerXPct}%`,
            top: `${star.centerYPct}%`,
            width: star.size,
            height: star.size,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
