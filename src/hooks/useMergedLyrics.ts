import { useEffect, useState } from "react";
import { mergeLyricLayers } from "../utils/mergeLyrics";
import { parseLrc } from "../utils/lrcParser";
import { publicAssetUrl } from "../utils/publicAssetUrl";
import type { SongLrcFiles } from "../types";
import type { MergedLyricLine } from "../types/lyricsPlus";

async function fetchLrc(path: string): Promise<string> {
  const res = await fetch(publicAssetUrl(path));
  if (!res.ok) throw new Error(`Missing lyrics: ${path}`);
  return res.text();
}

export function useMergedLyrics(lrc: SongLrcFiles | undefined, enabled: boolean) {
  const [lines, setLines] = useState<MergedLyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !lrc) {
      setLines([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [org, rom, en] = await Promise.all([
          lrc.org ? fetchLrc(lrc.org).then(parseLrc) : Promise.resolve([]),
          lrc.rom ? fetchLrc(lrc.rom).then(parseLrc) : Promise.resolve([]),
          lrc.en ? fetchLrc(lrc.en).then(parseLrc) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setLines(mergeLyricLayers(org, rom, en));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.warn(err);
        setLines([]);
        setError("Lyrics could not be loaded.");
        setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [lrc, enabled, lrc?.org, lrc?.rom, lrc?.en]);

  return { lines, loading, error };
}
