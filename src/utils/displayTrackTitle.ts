export const PLAYER_ARTIST_NAME = "NewJeans";

/** Trailing parenthetical on catalog titles, e.g. "(Instrumental)" or "(250 Remix)". */
const TITLE_SUFFIX_RE = /\s*(\([^)]+\))\s*$/;

/** Titles at or above this length (after suffix strip) show as acronyms on the stem player only. */
const LONG_TITLE_LENGTH = 22;

/** Preferred acronyms for catalog titles where auto-generation is awkward. */
const TITLE_ACRONYM_OVERRIDES: Record<string, string> = {
  "NewJeans X MY DEMON": "NJMD",
  "Our Night is more beautiful than your Day": "ONIMBTYD",
  "Be Who You Are": "BWYAR",
  "Be Who You Are (Real Magic)": "BWYAR",
  "Be Who You Are (Real Magic) (feat. JID, NewJeans & Camilo)": "BWYAR",
  "Beautiful Restriction": "BTFRST",
  "A Time Called You (Original Soundtrack from the Netflix Series)": "ATCY",
};

export function parseTrackTitle(title: string): {
  displayTitle: string;
  titleSuffixes: string[];
} {
  const suffixes: string[] = [];
  let displayTitle = title.trimEnd();

  for (;;) {
    const match = displayTitle.match(TITLE_SUFFIX_RE);
    if (!match || match.index === undefined) break;
    suffixes.unshift(match[1]);
    displayTitle = displayTitle.slice(0, match.index).trimEnd();
  }

  return { displayTitle, titleSuffixes: suffixes };
}

function acronymFromTitle(title: string): string {
  const trimmed = title.trim();
  const override = TITLE_ACRONYM_OVERRIDES[trimmed];
  if (override) return override;

  const words = trimmed
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word));

  return words
    .map((word) => word.replace(/[^A-Za-z0-9]/g, "").charAt(0))
    .join("")
    .toUpperCase();
}

function applyTitleAcronym(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;
  const override = TITLE_ACRONYM_OVERRIDES[trimmed];
  if (override) return override;
  if (trimmed.length < LONG_TITLE_LENGTH) return trimmed;
  return acronymFromTitle(trimmed);
}

/** Strip trailing bracket suffixes — used everywhere except stem player COOL title. */
export function displayTrackTitle(title: string): string {
  return parseTrackTitle(title).displayTitle;
}

/** Stem player COOL title — suffixes move to metadata; long names become acronyms. */
export function displayStemPlayerTitle(title: string): string {
  return applyTitleAcronym(displayTrackTitle(title));
}

/** Bracketed suffixes for the metadata row, e.g. "(250 Remix) (Instrumental)". */
export function trackTitleSuffixes(title: string): string[] {
  return parseTrackTitle(title).titleSuffixes;
}

/** Space-joined bracket suffixes for metadata rows. */
export function trackTitleSuffix(title: string): string | undefined {
  const suffixes = trackTitleSuffixes(title);
  return suffixes.length > 0 ? suffixes.join(" ") : undefined;
}

/** Fullscreen chat opener — e.g. “NewJeans - Supernatural”. */
export function formatFullscreenChatSongTitle(songTitle: string): string {
  return `${PLAYER_ARTIST_NAME} - ${displayTrackTitle(songTitle)}`;
}
