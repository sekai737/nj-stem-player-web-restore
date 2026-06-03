import JSZip from "jszip";
import type { StemTrack } from "../types";
import { publicAssetUrl } from "./publicAssetUrl";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stemFilename(songSlug: string, stem: StemTrack): string {
  const base = stem.src.split("/").pop() ?? `${stem.id}.flac`;
  const ext = base.includes(".") ? base.slice(base.lastIndexOf(".")) : ".flac";
  return `${songSlug}-${stem.id}${ext}`;
}

function basename(src: string): string {
  return src.split("/").pop() ?? src;
}

async function fetchAsset(src: string): Promise<Blob> {
  try {
    const res = await fetch(publicAssetUrl(src));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${basename(src)}`);
    }
    return await res.blob();
  } catch (err) {
    const name = basename(src);
    if (err instanceof Error && err.message.includes("HTTP")) {
      throw new Error(`Could not download ${name} (${err.message}).`);
    }
    throw new Error(
      `Could not download ${name}. Check that the dev server is running and the file exists under public/.`,
    );
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Fetch stem files and download a .zip (user gesture / click). */
export async function downloadSongStems(
  songTitle: string,
  stems: StemTrack[],
  stemsZipFiles?: string[],
  onProgress?: (message: string) => void,
): Promise<void> {
  const songSlug = slugify(songTitle) || "song";
  const zip = new JSZip();

  if (stemsZipFiles && stemsZipFiles.length > 0) {
    const total = stemsZipFiles.length;
    for (let i = 0; i < total; i++) {
      const src = stemsZipFiles[i]!;
      onProgress?.(`Downloading ${i + 1}/${total}: ${basename(src)}…`);
      const blob = await fetchAsset(src);
      zip.file(basename(src), blob);
    }
  } else {
    if (stems.length === 0) return;

    const total = stems.length;
    for (let i = 0; i < total; i++) {
      const stem = stems[i]!;
      onProgress?.(`Downloading ${i + 1}/${total}: ${stem.label}…`);
      const blob = await fetchAsset(stem.src);
      zip.file(stemFilename(songSlug, stem), blob);
    }
  }

  onProgress?.("Building ZIP…");
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${songSlug}-stems.zip`);
}

/** Fetch and download a single MIDI file for the current song (keeps public filename). */
export async function downloadSongMidi(_songTitle: string, midiSrc: string): Promise<void> {
  const blob = await fetchAsset(midiSrc);
  triggerDownload(blob, basename(midiSrc));
}
