export const PLAYER_ARTIST_NAME = "NewJeans";

/** Trailing parenthetical on catalog titles, e.g. "(Instrumental)" or "(250 Remix)". */
const TITLE_SUFFIX_RE = /\s*(\([^)]+\))\s*$/;

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

/** Player COOL title — bracketed suffixes live on the metadata line. */
export function displayTrackTitle(title: string): string {
  return parseTrackTitle(title).displayTitle;
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
