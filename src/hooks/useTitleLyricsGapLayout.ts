import { useLayoutEffect, useState, type RefObject } from "react";
import { FIGMA } from "../figma/layout";
import { displayStemPlayerTitle } from "../utils/displayTrackTitle";

/** Figma Title (3:282) slot width — fallback until Supernatural is measured in-browser. */
const SUPERNATURAL_TITLE_TEXT_WIDTH_FALLBACK = FIGMA.titleRow.titleStack.trackTitle.width;

/** `--shadow-pop-4` offset — keep lyrics box inset so the hard shadow is not clipped. */
const POP_SHADOW_PAD = 4;

let cachedSupernaturalTitleTextWidth: number | null = null;

function supernaturalReferenceTextWidth(): number {
  return cachedSupernaturalTitleTextWidth ?? SUPERNATURAL_TITLE_TEXT_WIDTH_FALLBACK;
}

export interface TitleLyricsGapLayout {
  /** Extra flex offset so lyrics start at (title text right + Figma gap). */
  lyricsMarginLeft: number;
  /** Lyrics container width for the current title length. */
  lyricsWidth: number;
}

/**
 * Keeps the Supernatural Figma gap between COOL title text and lyrics box for every song.
 * lyricsLeft = titleTextWidth + (figmaLyricsLeft − supernaturalTextWidth)
 */
export function useTitleLyricsGapLayout(
  title: string,
  fontsReady: boolean,
  titleCoolLineRef: RefObject<HTMLParagraphElement | null>,
  titleBlockRef: RefObject<HTMLDivElement | null>,
): TitleLyricsGapLayout {
  const [layout, setLayout] = useState<TitleLyricsGapLayout>(() => ({
    lyricsMarginLeft: -FIGMA.titleRow.titleLyricsOverlap,
    lyricsWidth: FIGMA.titleRow.lyricsWidth,
  }));

  useLayoutEffect(() => {
    if (!fontsReady) return;

    const coolLine = titleCoolLineRef.current;
    const titleBlock = titleBlockRef.current;
    if (!coolLine || !titleBlock) return;

    const measure = () => {
      // offsetWidth — layout px in the scaled content frame; getBoundingClientRect is
      // post-transform screen px and shrinks with scale(), inflating lyricsWidth.
      const titleTextWidth = coolLine.offsetWidth;
      const titleBlockWidth = titleBlock.offsetWidth;

      if (displayStemPlayerTitle(title) === "Supernatural" && titleTextWidth > 0) {
        cachedSupernaturalTitleTextWidth = titleTextWidth;
      }

      const referenceTextWidth = supernaturalReferenceTextWidth();
      const gap = FIGMA.titleRow.lyricsLeft - referenceTextWidth;
      const lyricsLeft = Math.min(
        FIGMA.titleRow.trackInfoWidth,
        Math.max(0, titleTextWidth + gap),
      );
      const lyricsWidth = Math.max(
        0,
        FIGMA.titleRow.trackInfoWidth - lyricsLeft - POP_SHADOW_PAD,
      );
      const lyricsMarginLeft = lyricsLeft - titleBlockWidth;

      setLayout({ lyricsMarginLeft, lyricsWidth });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(coolLine);
    observer.observe(titleBlock);
    return () => observer.disconnect();
  }, [title, fontsReady, titleCoolLineRef, titleBlockRef]);

  return layout;
}
