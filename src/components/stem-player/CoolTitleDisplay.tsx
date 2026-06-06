import { getTitleGlyphRenderData } from "../../figma/randomizedTitleFonts";

interface CoolTitleDisplayProps {
  title: string;
}

/**
 * COOL_FONT track title (Figma 3:282) — fixed Figma pattern for “Supernatural”,
 * deterministic randomized families per grapheme for all other titles.
 */
export default function CoolTitleDisplay({ title }: CoolTitleDisplayProps) {
  const glyphs = getTitleGlyphRenderData(title);

  return (
    <div className="title-cool-block shrink-0">
      <p className="title-cool-line">
        {glyphs.map(({ glyph, className }, index) => (
          <span key={`${index}-${glyph}`} className={className}>
            {glyph}
          </span>
        ))}
      </p>
    </div>
  );
}
