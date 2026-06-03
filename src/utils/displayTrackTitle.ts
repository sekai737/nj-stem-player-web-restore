export const PLAYER_ARTIST_NAME = "NewJeans";

/** Player COOL title — “(Instrumental)” lives in metadata, not the display name. */
export function displayTrackTitle(title: string): string {
  return title.replace(/\s*\(instrumental\)\s*$/i, "").trimEnd();
}

/** Fullscreen chat opener — e.g. “NewJeans - Supernatural”. */
export function formatFullscreenChatSongTitle(songTitle: string): string {
  return `${PLAYER_ARTIST_NAME} - ${displayTrackTitle(songTitle)}`;
}
