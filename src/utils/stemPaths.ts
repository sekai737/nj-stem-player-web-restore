import type { Song, StemId, StemTrack } from "../types";

/** Catalog stem id → filename segment (e.g. instruments → other). */
const STEM_FILE_SEGMENT: Record<StemId | "master", string> = {
  vocals: "vocals",
  instruments: "other",
  drums: "drums",
  bass: "bass",
  master: "master",
};

/** `/stems/{releaseId}/{slug}-{segment}.flac` under /public (e.g. supernatural-vocals.flac). */
export function stemFilePath(
  releaseId: string,
  stem: StemId | "master",
  slug = releaseId,
  ext = "flac",
): string {
  const folder = encodeURIComponent(releaseId);
  const segment = STEM_FILE_SEGMENT[stem];
  const file = encodeURIComponent(`${slug}-${segment}.${ext}`);
  return `/stems/${folder}/${file}`;
}

export function songStemSlug(song: Song, releaseId: string): string {
  return song.stemSlug ?? releaseId;
}

export function songUsesStemConvention(song: Song): boolean {
  return song.stems.length > 0 && song.stems.every((stem) => !stem.src);
}

export function resolveSongStems(releaseId: string, song: Song): StemTrack[] {
  const slug = songStemSlug(song, releaseId);
  return song.stems.map((stem) => ({
    ...stem,
    src: stem.src ?? stemFilePath(releaseId, stem.id, slug),
  }));
}

export function resolveSongMasterSrc(releaseId: string, song: Song): string | undefined {
  if (song.masterSrc) return song.masterSrc;
  if (song.stemsZipFiles?.[0]) return song.stemsZipFiles[0];
  if (songUsesStemConvention(song)) {
    return stemFilePath(releaseId, "master", songStemSlug(song, releaseId));
  }
  return undefined;
}

export function enrichSong(releaseId: string, song: Song): Song {
  const stems = resolveSongStems(releaseId, song);
  const masterSrc = resolveSongMasterSrc(releaseId, song);
  return {
    ...song,
    stems,
    ...(masterSrc ? { masterSrc } : {}),
  };
}
