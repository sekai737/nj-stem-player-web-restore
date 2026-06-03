import { useEffect, useState } from "react";
import { COOL_TITLE_FONT_FAMILIES, coolTitleFontHrefForFamily } from "../figma/coolTitleStyle";

/**
 * All licensed @font-face families used in the stem player UI.
 * Sizes match the text styles in typography.css.
 */
export const LICENSED_FONT_SPECS = [
  "normal 24px Swis721BTBold",
  "normal 24px Swis721BTRoman",
  "normal 16px Swis721BTRoman",
  "normal 24px Swiss721Medium",
  "normal 16px Swiss721Medium",
  "normal 16px Swiss721Regular",
  "normal 48px Swiss721Medium",
  "normal 32px Swis721LtBTLight",
  "normal 24px Swis721LtBTLight",
  "normal 24px NotoSansKR-VF",
  "normal 16px NotoSansKR-VF",
  "normal 24px NotoSansJPRegular",
  "normal 16px NotoSansJPRegular",
  "normal 32px NotoSansKRLight",
  "normal 24px NotoSansKRLight",
  "normal 32px NotoSansJPLight",
  "normal 24px NotoSansJPLight",
] as const;

/** Jersey 10 — Google Fonts (index.html) */
export const JERSEY_FONT_SPEC = 'normal 48px "Jersey 10"';

export const PLAYER_FONT_SPECS = [...LICENSED_FONT_SPECS, JERSEY_FONT_SPEC] as const;

/** Figma Title display (3:282) — 96px COOL_FONT faces @see cool-title-fonts.css */
export const COOL_TITLE_FONT_SPECS = COOL_TITLE_FONT_FAMILIES.map(
  (family) => `normal 96px ${JSON.stringify(family)}` as const,
);

export const STEM_PLAYER_FONT_SPECS = [
  ...PLAYER_FONT_SPECS,
  ...COOL_TITLE_FONT_SPECS,
] as const;

function areStemPlayerFontsLoaded(): boolean {
  if (typeof document === "undefined" || !document.fonts?.check) return false;
  return STEM_PLAYER_FONT_SPECS.every((spec) => document.fonts.check(spec));
}

/** Resolves when stem player fonts are loaded (avoids fallback stuck in scaled layers). */
export function useWebFontsReady(): boolean {
  const [ready, setReady] = useState(areStemPlayerFontsLoaded);

  useEffect(() => {
    if (ready) return;

    let cancelled = false;
    void (async () => {
      const results = await Promise.allSettled(
        STEM_PLAYER_FONT_SPECS.map((spec) => document.fonts.load(spec)),
      );
      await document.fonts.ready;

      if (cancelled) return;

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0 && import.meta.env.DEV) {
        console.warn(
          "[fonts] Some faces failed to load. Run `npm run fonts:build` and ensure public/fonts/*.woff2 exist.",
          failed,
        );
      }

      if (import.meta.env.DEV) {
        const missingCool = COOL_TITLE_FONT_FAMILIES.filter(
          (_, i) => !document.fonts.check(COOL_TITLE_FONT_SPECS[i]!),
        );
        if (missingCool.length > 0) {
          console.error(
            "[fonts] COOL title faces missing or not loaded (no silent substitute). Run `npm run fonts:build`.\n" +
              missingCool.map((f) => `  - ${f} → ${coolTitleFontHrefForFamily(f)}`).join("\n"),
          );
        }
      }

      setReady(areStemPlayerFontsLoaded());
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}
