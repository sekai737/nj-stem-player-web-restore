import { useEffect, useState } from "react";
import type { LyricLanguage, SongLrcFiles } from "../types";
import type { LyricLine } from "../types";
import { parseLrc } from "../utils/lrcParser";
import { usePlayerStore } from "../store/playerStore";

export function useLyrics(lrc: SongLrcFiles | undefined) {
  const lyricLanguage = usePlayerStore((s) => s.lyricLanguage);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lang = lyricLanguage === "all" ? "org" : lyricLanguage;
    const path = lrc?.[lang];
    if (!path) {
      setLines([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Missing lyrics file: ${path}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        setLines(parseLrc(text));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn(err);
        setLines([]);
        setError(
          lang === "org"
            ? "Original lyrics file not found."
            : `${lang.toUpperCase()} lyrics not available yet.`,
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lrc, lyricLanguage]);

  return { lines, loading, error };
}
