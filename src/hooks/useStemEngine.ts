import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { extractPeaks } from "../audio/extractPeaks";
import { publicAssetUrl } from "../utils/publicAssetUrl";
import { getSongMasterSrc, songHasMasterMix } from "../utils/songMaster";
import { attachMeterBus, detachMeterBus } from "../audio/meterBus";
import { resetMeterStore } from "../meters/meterStore";
import type { Song, StemId } from "../types";
import { stemAudibility, usePlayerStore } from "../store/playerStore";

interface StemNodes {
  buffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  gain: GainNode;
}

interface MixNodes {
  buffer: AudioBuffer;
  source: AudioBufferSourceNode | null;
  gain: GainNode;
}

function disconnectStemNodes(stems: Partial<Record<StemId, StemNodes>>): void {
  (Object.values(stems) as StemNodes[]).forEach((stem) => {
    try {
      stem.source?.stop();
    } catch {
      /* already stopped */
    }
    stem.source = null;
    try {
      stem.gain.disconnect();
    } catch {
      /* already disconnected */
    }
  });
}

function disconnectMix(mix: MixNodes | null): void {
  if (!mix) return;
  try {
    mix.source?.stop();
  } catch {
    /* already stopped */
  }
  mix.source = null;
  try {
    mix.gain.disconnect();
  } catch {
    /* already disconnected */
  }
}

function usesStemPlayback(): boolean {
  const { fullscreenOpen, fullscreenUseStems } = usePlayerStore.getState();
  return !fullscreenOpen || fullscreenUseStems;
}

export function useStemEngine(song: Song | undefined, releaseId?: string) {
  const audioRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    limiter: DynamicsCompressorNode;
    stems: Partial<Record<StemId, StemNodes>>;
    mix: MixNodes | null;
    startTime: number;
    offset: number;
    raf: number;
  } | null>(null);
  const loadIdRef = useRef(0);
  const loadStateRef = useRef<{ songLoadKey: string; stemPlayback: boolean } | null>(
    null,
  );
  /** Blocks preserve-playback resume on stem/master reload right after a song change. */
  const suppressPreserveResumeRef = useRef(false);
  /** Invalidates in-flight requestAnimationFrame time loops after halt/seek/song change. */
  const playbackSessionRef = useRef(0);
  const songLoadKey = song
    ? `${releaseId ?? ""}:${song.id}:${song.stems.map((stem) => stem.src).join("|")}:${song.masterSrc ?? ""}`
    : "";

  const channels = usePlayerStore((s) => s.channels);
  const fullscreenOpen = usePlayerStore((s) => s.fullscreenOpen);
  const fullscreenUseStems = usePlayerStore((s) => s.fullscreenUseStems);
  /** Stems vs master — only changes when mode actually switches, not on every fullscreen toggle. */
  const stemPlayback = !fullscreenOpen || fullscreenUseStems;
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const advanceCurrentTime = usePlayerStore((s) => s.advanceCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const setStemsLoading = usePlayerStore((s) => s.setStemsLoading);
  const setStemsLoadProgress = usePlayerStore((s) => s.setStemsLoadProgress);
  const setStemsLoadError = usePlayerStore((s) => s.setStemsLoadError);
  const masterVolume = usePlayerStore((s) => s.masterVolume);
  const transportSeq = usePlayerStore((s) => s.transportSeq);

  const applyGains = useCallback(() => {
    const engine = audioRef.current;
    if (!engine) return;
    const { ctx, stems, mix } = engine;
    const now = ctx.currentTime;

    if (mix) {
      mix.gain.gain.setTargetAtTime(1, now, 0.02);
      return;
    }

    const mixer = usePlayerStore.getState().channels;
    (Object.keys(stems) as StemId[]).forEach((id) => {
      const node = stems[id];
      if (!node) return;
      const level = stemAudibility(mixer, id);
      node.gain.gain.setTargetAtTime(level, now, 0.05);
    });
  }, []);

  const ensureContext = useCallback(() => {
    if (!audioRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = usePlayerStore.getState().masterVolume;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -4;
      limiter.knee.value = 3;
      limiter.ratio.value = 10;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.12;
      master.connect(limiter);
      audioRef.current = {
        ctx,
        master,
        limiter,
        stems: {},
        mix: null,
        startTime: 0,
        offset: 0,
        raf: 0,
      };
    }
    const engine = audioRef.current;
    attachMeterBus(engine.ctx, engine.limiter);
    return engine;
  }, []);

  useEffect(() => {
    return () => {
      detachMeterBus();
      resetMeterStore();
    };
  }, []);

  useEffect(() => {
    applyGains();
  }, [channels, applyGains]);

  useEffect(() => {
    const engine = audioRef.current;
    if (!engine) return;
    const now = engine.ctx.currentTime;
    engine.master.gain.setTargetAtTime(masterVolume, now, 0.02);
  }, [masterVolume]);

  const stopSources = useCallback(() => {
    const engine = audioRef.current;
    if (!engine) return;
    (Object.values(engine.stems) as StemNodes[]).forEach((stem) => {
      try {
        stem.source?.stop();
      } catch {
        /* already stopped */
      }
      stem.source = null;
    });
    if (engine.mix) {
      try {
        engine.mix.source?.stop();
      } catch {
        /* already stopped */
      }
      engine.mix.source = null;
    }
  }, []);

  const hasActiveSources = useCallback(() => {
    const engine = audioRef.current;
    if (!engine) return false;
    if (engine.mix?.source) return true;
    return (Object.values(engine.stems) as StemNodes[]).some((stem) => stem.source !== null);
  }, []);

  const invalidatePlaybackSession = useCallback(() => {
    playbackSessionRef.current += 1;
  }, []);

  const stopPlayback = useCallback(
    (resetTime = false) => {
      invalidatePlaybackSession();
      const engine = audioRef.current;
      if (engine) {
        if (resetTime) {
          engine.offset = 0;
        }
        stopSources();
        cancelAnimationFrame(engine.raf);
        engine.raf = 0;
      }
      if (resetTime) {
        setCurrentTime(0);
      }
      setPlaying(false);
    },
    [invalidatePlaybackSession, stopSources, setPlaying, setCurrentTime],
  );

  useLayoutEffect(() => {
    invalidatePlaybackSession();
    const engine = audioRef.current;
    if (!engine) return;
    stopSources();
    cancelAnimationFrame(engine.raf);
    engine.raf = 0;
  }, [transportSeq, invalidatePlaybackSession, stopSources]);

  const startSources = useCallback((engine: NonNullable<typeof audioRef.current>) => {
    const { ctx } = engine;
    engine.startTime = ctx.currentTime;

    if (engine.mix) {
      const source = ctx.createBufferSource();
      source.buffer = engine.mix.buffer;
      source.connect(engine.mix.gain);
      source.start(0, engine.offset);
      engine.mix.source = source;
      return;
    }

    (Object.entries(engine.stems) as [StemId, StemNodes][]).forEach(([, stem]) => {
      const source = ctx.createBufferSource();
      source.buffer = stem.buffer;
      source.connect(stem.gain);
      source.start(0, engine.offset);
      stem.source = source;
    });
  }, []);

  const startTimeLoop = useCallback(
    (engine: NonNullable<typeof audioRef.current>) => {
      const session = playbackSessionRef.current;
      const transportSeq = usePlayerStore.getState().transportSeq;
      const run = () => {
        if (playbackSessionRef.current !== session) {
          engine.raf = 0;
          return;
        }
        if (usePlayerStore.getState().transportSeq !== transportSeq) {
          engine.raf = 0;
          return;
        }
        if (!song) {
          engine.raf = 0;
          return;
        }
        if (!usePlayerStore.getState().isPlaying || !hasActiveSources()) {
          engine.raf = 0;
          return;
        }
        const t = engine.offset + (engine.ctx.currentTime - engine.startTime);
        const clamped = Math.min(t, song.durationSec);
        advanceCurrentTime(clamped, transportSeq);
        if (t >= song.durationSec) {
          invalidatePlaybackSession();
          setPlaying(false);
          stopSources();
          engine.offset = 0;
          setCurrentTime(0);
          engine.raf = 0;
          return;
        }
        engine.raf = requestAnimationFrame(run);
      };

      cancelAnimationFrame(engine.raf);
      engine.raf = requestAnimationFrame(run);
    },
    [
      song,
      advanceCurrentTime,
      setCurrentTime,
      setPlaying,
      stopSources,
      hasActiveSources,
      invalidatePlaybackSession,
    ],
  );

  const loadSong = useCallback(async (preservePlayback = false) => {
    if (!song) return;
    const loadId = ++loadIdRef.current;
    const engine = ensureContext();
    const useStems = usesStemPlayback();
    const savedOffset = preservePlayback
      ? Math.max(0, engine.offset || usePlayerStore.getState().currentTime)
      : 0;
    const loadTransportSeq = usePlayerStore.getState().transportSeq;
    const savedPlaying =
      preservePlayback &&
      !suppressPreserveResumeRef.current &&
      usePlayerStore.getState().isPlaying;

    if (!preservePlayback) {
      stopPlayback(true);
    } else {
      stopSources();
    }
    disconnectStemNodes(engine.stems);
    disconnectMix(engine.mix);
    engine.stems = {};
    engine.mix = null;

    if (preservePlayback) {
      engine.offset = Math.min(savedOffset, song.durationSec);
      setCurrentTime(engine.offset);
    } else {
      resetMeterStore();
      usePlayerStore.getState().clearStemPeaks();
      engine.offset = 0;
      setCurrentTime(0);
      setPlaying(false);
    }

    setStemsLoading(true);
    setStemsLoadProgress(0);
    setStemsLoadError(null);

    const { ctx, master } = engine;

    try {
      if (useStems) {
        usePlayerStore.getState().clearStemPeaks();
        let maxDuration = 0;
        const total = song.stems.length;
        const loadErrors: string[] = [];

        if (total === 0) setStemsLoadProgress(1);

        for (let i = 0; i < song.stems.length; i++) {
          const stem = song.stems[i]!;
          try {
            let res: Response;
            try {
              res = await fetch(publicAssetUrl(stem.src!));
            } catch {
              throw new Error(`Network error loading ${stem.label}`);
            }
            if (!res.ok) throw new Error(`Missing stem file: ${stem.src}`);
            const arrayBuffer = await res.arrayBuffer();
            if (loadId !== loadIdRef.current) return;
            const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
            if (loadId !== loadIdRef.current) return;

            const stemId = stem.id as StemId;
            const gain = ctx.createGain();
            gain.connect(master);
            engine.stems[stemId] = { buffer, source: null, gain };
            usePlayerStore.getState().setStemPeaks(stemId, extractPeaks(buffer), buffer.duration);
            maxDuration = Math.max(maxDuration, buffer.duration);
          } catch (err) {
            const msg = err instanceof Error ? err.message : `Failed to load ${stem.label}`;
            loadErrors.push(msg);
            console.warn(err);
          } finally {
            if (loadId === loadIdRef.current) {
              setStemsLoadProgress(total > 0 ? (i + 1) / total : 1);
            }
          }
        }

        if (loadId !== loadIdRef.current) return;

        if (Object.keys(engine.stems).length === 0) {
          setStemsLoadError(
            loadErrors[0] ??
              "Could not load stems. Keep the dev server running and confirm files exist under public/stems/.",
          );
        } else if (loadErrors.length > 0) {
          setStemsLoadError(`Some stems failed to load (${loadErrors.length}). Playback uses loaded stems only.`);
        }

        setDuration(maxDuration || song.durationSec);
        applyGains();
        return;
      }

      const masterSrc = getSongMasterSrc(song);
      if (!masterSrc) {
        setStemsLoadError("No master mix available for this track.");
        setDuration(song.durationSec);
        return;
      }

      try {
        let res: Response;
        try {
          res = await fetch(publicAssetUrl(masterSrc));
        } catch {
          throw new Error("Network error loading master mix");
        }
        if (!res.ok) throw new Error(`Missing master file: ${masterSrc}`);
        const arrayBuffer = await res.arrayBuffer();
        if (loadId !== loadIdRef.current) return;
        const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        if (loadId !== loadIdRef.current) return;

        const gain = ctx.createGain();
        gain.connect(master);
        engine.mix = { buffer, source: null, gain };
        setDuration(buffer.duration || song.durationSec);
        applyGains();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load master mix";
        setStemsLoadError(msg);
        setDuration(song.durationSec);
        console.warn(err);
      } finally {
        if (loadId === loadIdRef.current) {
          setStemsLoadProgress(1);
        }
      }
    } finally {
      if (loadId === loadIdRef.current) {
        setStemsLoading(false);
        setStemsLoadProgress(1);

        if (
          savedPlaying &&
          loadTransportSeq === usePlayerStore.getState().transportSeq
        ) {
          const hasAudio =
            engine.mix !== null || Object.keys(engine.stems).length > 0;
          if (hasAudio) {
            await engine.ctx.resume();
            startSources(engine);
            setPlaying(true);
            startTimeLoop(engine);
          }
        } else if (!preservePlayback) {
          suppressPreserveResumeRef.current = false;
        }
      }
    }
  }, [
    songLoadKey,
    ensureContext,
    stopSources,
    stopPlayback,
    setCurrentTime,
    setPlaying,
    setDuration,
    setStemsLoading,
    setStemsLoadProgress,
    setStemsLoadError,
    applyGains,
    startSources,
    startTimeLoop,
  ]);

  useEffect(() => {
    const prev = loadStateRef.current;
    const songChanged = prev === null || prev.songLoadKey !== songLoadKey;

    if (songChanged) {
      suppressPreserveResumeRef.current = true;
      if (song && !songHasMasterMix(song)) {
        usePlayerStore.getState().setFullscreenUseStems(true);
      }
      stopPlayback(true);
    }

    const currentStemPlayback =
      !usePlayerStore.getState().fullscreenOpen ||
      usePlayerStore.getState().fullscreenUseStems;
    const modeChanged =
      prev !== null &&
      prev.songLoadKey === songLoadKey &&
      prev.stemPlayback !== currentStemPlayback;

    if (!songChanged && !modeChanged) {
      return undefined;
    }

    const preservePlayback =
      modeChanged && !songChanged && !suppressPreserveResumeRef.current;
    loadStateRef.current = { songLoadKey, stemPlayback: currentStemPlayback };

    void loadSong(preservePlayback);

    return () => {
      invalidatePlaybackSession();
      const engine = audioRef.current;
      if (!engine) return;
      stopSources();
      cancelAnimationFrame(engine.raf);
      engine.raf = 0;
    };
  }, [
    songLoadKey,
    stemPlayback,
    loadSong,
    stopSources,
    stopPlayback,
    invalidatePlaybackSession,
    song,
  ]);

  const play = useCallback(async () => {
    if (!song || usePlayerStore.getState().stemsLoading) return;
    const engine = ensureContext();
    await engine.ctx.resume();

    if (engine.mix) {
      stopSources();
      startSources(engine);
      setPlaying(true);
      startTimeLoop(engine);
      return;
    }

    if (Object.keys(engine.stems).length === 0) {
      console.warn("No stems loaded. Add stem files under public/stems/");
      return;
    }
    stopSources();
    startSources(engine);
    setPlaying(true);
    startTimeLoop(engine);
  }, [song, ensureContext, stopSources, setPlaying, startTimeLoop, startSources]);

  const pause = useCallback(() => {
    const engine = audioRef.current;
    if (!engine) return;
    invalidatePlaybackSession();
    engine.offset += engine.ctx.currentTime - engine.startTime;
    stopSources();
    setPlaying(false);
    cancelAnimationFrame(engine.raf);
    engine.raf = 0;
  }, [invalidatePlaybackSession, stopSources, setPlaying]);

  const seek = useCallback(
    (time: number) => {
      if (!song) return;
      const engine = ensureContext();
      const wasPlaying = usePlayerStore.getState().isPlaying;
      engine.offset = Math.max(0, Math.min(time, song.durationSec));
      setCurrentTime(engine.offset);
      if (wasPlaying) {
        stopSources();
        void play();
      }
    },
    [song, ensureContext, setCurrentTime, stopSources, play],
  );

  const togglePlay = useCallback(async () => {
    if (usePlayerStore.getState().isPlaying || hasActiveSources()) pause();
    else await play();
  }, [play, pause, hasActiveSources]);

  return { play, pause, togglePlay, seek, reload: loadSong };
}
