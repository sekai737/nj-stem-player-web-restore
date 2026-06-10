import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { getReleaseCoverArt, getSelectableSongs } from "../../data/catalog";
import { figmaAssets } from "../../figma/assets";
import type { Release } from "../../types";

/** Figma card row — 120px card + 32px gap. */
const CARD_HEIGHT = 120;
const CARD_GAP = 32;
const STEP_Y = CARD_HEIGHT + CARD_GAP;
const VISIBLE_CARDS = 4;
/** Exactly 4 card bodies + 3 gaps (576px). */
const VIEWPORT_CONTENT_HEIGHT =
  VISIBLE_CARDS * CARD_HEIGHT + (VISIBLE_CARDS - 1) * CARD_GAP;
/** Room for drop-shadow below the bottom card without clipping. */
const SHADOW_BLEED = 4;
const VIEWPORT_HEIGHT = VIEWPORT_CONTENT_HEIGHT + SHADOW_BLEED;

/** Lyric carousel reference — active card scale + ease. */
const ACTIVE_SCALE = 0.92;
const DUCK_Y = 10;
/** Exponential follow — higher = snappier, lower = floatier (per second). */
const SCROLL_SMOOTHING = 11;
const SETTLE_EPS = 0.2;
const VELOCITY_DECAY = 0.9;
const WHEEL_VELOCITY_GAIN = 0.32;
const FLICK_VELOCITY_GAIN = 0.45;
/** Momentum below this triggers grid snap settle. */
const SNAP_VELOCITY_THRESHOLD = 0.05;
/** Target pull onto card steps once scroll input / momentum ends. */
const SNAP_SMOOTHING = 18;
/** After the last wheel tick, clear inertia and snap. */
const WHEEL_IDLE_MS = 120;
const MAX_FRAME_DT = 0.032;

export interface HomePageCardCarouselHandle {
  scrollToTop: () => void;
}

interface HomePageCardCarouselProps {
  releases: Release[];
  onScrolledChange?: (scrolled: boolean) => void;
  /** Home page root — wheel/touch in the carousel band scrolls from the side margins too. */
  scrollRootRef?: RefObject<HTMLElement | null>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearestSnapOffset(offset: number, maxOffset: number): number {
  return clamp(Math.round(offset / STEP_Y) * STEP_Y, 0, maxOffset);
}

function getCardMotion(index: number, scrollOffset: number, count: number) {
  const leadingIndex = Math.floor(scrollOffset / STEP_Y);
  const progress = scrollOffset / STEP_Y - leadingIndex;

  const rest = {
    zIndex: index + 1,
    transform: "translate3d(0, 0, 0) scale(1)",
    transformOrigin: "center top",
    opacity: 1,
    visibility: "visible" as const,
    pointerEvents: "auto" as const,
  };

  /** Fully overtaken — hidden only after the next card has completed the step. */
  if (index < leadingIndex) {
    return {
      ...rest,
      visibility: "hidden",
      pointerEvents: "none",
    };
  }

  /** Top card: pinned, scales down, stays beneath the following card. */
  if (progress > 0 && index === leadingIndex && leadingIndex < count - 1) {
    const scale = 1 - progress * (1 - ACTIVE_SCALE);
    const settleY = progress * STEP_Y + progress * DUCK_Y;
    return {
      zIndex: index + 1,
      transform: `translate3d(0, ${settleY}px, 0) scale(${scale})`,
      transformOrigin: "center top",
      visibility: "visible",
      pointerEvents: progress >= 0.5 ? ("none" as const) : ("auto" as const),
    };
  }

  /** Following card: slides up over the top card at full size. */
  if (progress > 0 && index === leadingIndex + 1) {
    return {
      ...rest,
      zIndex: index + 1000,
    };
  }

  /** Bottom visible card: stays in front while the next card scales in from behind. */
  const bottomVisibleIndex = leadingIndex + VISIBLE_CARDS - 1;
  const incomingIndex = leadingIndex + VISIBLE_CARDS;

  if (progress > 0 && index === bottomVisibleIndex && incomingIndex < count) {
    return {
      ...rest,
      zIndex: bottomVisibleIndex + 1000,
    };
  }

  /**
   * 5th card: pinned behind the 4th (bottom) card, scales in as the stack advances.
   * Counter-translate keeps it stacked under the 4th at first, then eases to track position.
   */
  if (progress > 0 && index === incomingIndex && index < count) {
    const scale = ACTIVE_SCALE + progress * (1 - ACTIVE_SCALE);
    const fourthNaturalTop = bottomVisibleIndex * STEP_Y - scrollOffset;
    const incomingNaturalTop = index * STEP_Y - scrollOffset;
    /** Pull up one step so the incoming card sits behind the 4th, not below the gap. */
    const stackBehindY = fourthNaturalTop - incomingNaturalTop;
    const extraY = stackBehindY * (1 - progress);

    return {
      zIndex: bottomVisibleIndex - 1,
      transform: `translate3d(0, ${extraY}px, 0) scale(${scale})`,
      transformOrigin: "center top",
      opacity: progress,
      visibility: "visible",
      pointerEvents: progress >= 0.5 ? ("auto" as const) : ("none" as const),
    };
  }

  return rest;
}

/** Hover lift — exponential follow (same feel as carousel scroll). */
const HOVER_LIFT_PX = 4;
const HOVER_SCALE_DELTA = 0.01;
const HOVER_SMOOTHING = 14;
const HOVER_SETTLE_EPS = 0.001;

function applyCardHoverTransform(el: HTMLDivElement, amount: number): void {
  const lift = -HOVER_LIFT_PX * amount;
  const scale = 1 + HOVER_SCALE_DELTA * amount;
  el.style.transform = `translate3d(0, ${lift}px, 0) scale3d(${scale}, ${scale}, 1)`;
}

function resetCardHoverTransform(el: HTMLDivElement | null): void {
  if (!el) return;
  el.style.transform = "translate3d(0, 0, 0) scale3d(1, 1, 1)";
}

function readHomeScale(node: HTMLElement | null): number {
  const root = node?.closest(".home-page-root") ?? node;
  if (!root) return 1;
  const scale = Number.parseFloat(getComputedStyle(root).getPropertyValue("--home-scale"));
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

const HomePageCardCarousel = forwardRef<HomePageCardCarouselHandle, HomePageCardCarouselProps>(
  function HomePageCardCarousel({ releases, onScrolledChange, scrollRootRef }, ref) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(0);
    const targetRef = useRef(0);
    const velocityRef = useRef(0);
    const isTouchingRef = useRef(false);
    const touchLastYRef = useRef(0);
    const touchLastTimeRef = useRef(0);
    const touchVelocitySampleRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const touchStartYRef = useRef(0);
    const touchStartOffsetRef = useRef(0);
    const hoverTargetRef = useRef(0);
    const hoverAmountRef = useRef(0);
    const hoverCardElRef = useRef<HTMLDivElement | null>(null);
    const hoverRafRef = useRef<number | null>(null);
    const wheelIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [playTooltipReleaseId, setPlayTooltipReleaseId] = useState<string | null>(null);

    const [offset, setOffset] = useState(0);

    const handleCardPointerEnter = useCallback((pointerType: string, el: HTMLDivElement) => {
      if (pointerType !== "mouse") return;

      const previous = hoverCardElRef.current;
      if (previous && previous !== el) {
        resetCardHoverTransform(previous);
        hoverAmountRef.current = 0;
      }

      hoverCardElRef.current = el;
      hoverTargetRef.current = 1;
    }, []);

    const handleCardPointerLeave = useCallback((el: HTMLDivElement) => {
      if (hoverCardElRef.current !== el) return;
      hoverTargetRef.current = 0;
    }, []);

    const trackHeight = releases.length * CARD_HEIGHT + Math.max(0, releases.length - 1) * CARD_GAP;
    const maxOffset = Math.max(0, (releases.length - VISIBLE_CARDS) * STEP_Y);
    const maxOffsetRef = useRef(maxOffset);
    maxOffsetRef.current = maxOffset;

    useEffect(() => {
      return () => {
        if (wheelIdleRef.current) clearTimeout(wheelIdleRef.current);
      };
    }, []);

    useEffect(() => {
      onScrolledChange?.(offset > 8);
    }, [offset, onScrolledChange]);

    useEffect(() => {
      targetRef.current = clamp(targetRef.current, 0, maxOffset);
      offsetRef.current = clamp(offsetRef.current, 0, maxOffset);
    }, [maxOffset]);

    useEffect(() => {
      let running = true;
      let lastTime = performance.now();

      const tickHover = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, MAX_FRAME_DT);
        lastTime = now;

        const target = hoverTargetRef.current;
        const current = hoverAmountRef.current;
        const follow = 1 - Math.exp(-HOVER_SMOOTHING * dt);
        const next =
          Math.abs(target - current) < HOVER_SETTLE_EPS
            ? target
            : current + (target - current) * follow;

        hoverAmountRef.current = next;

        const el = hoverCardElRef.current;
        if (el) {
          applyCardHoverTransform(el, next);
        }

        if (target === 0 && next <= HOVER_SETTLE_EPS) {
          hoverAmountRef.current = 0;
          resetCardHoverTransform(el);
          hoverCardElRef.current = null;
        }

        if (running) hoverRafRef.current = requestAnimationFrame(tickHover);
      };

      hoverRafRef.current = requestAnimationFrame(tickHover);
      return () => {
        running = false;
        if (hoverRafRef.current != null) cancelAnimationFrame(hoverRafRef.current);
      };
    }, []);

    useEffect(() => {
      let running = true;
      let lastTime = performance.now();

      const tick = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, MAX_FRAME_DT);
        lastTime = now;

        let target = clamp(targetRef.current, 0, maxOffset);

        if (!isTouchingRef.current) {
          const velocity = velocityRef.current;
          if (Math.abs(velocity) > SNAP_VELOCITY_THRESHOLD) {
            target = clamp(target + velocity * dt, 0, maxOffset);
            targetRef.current = target;
            velocityRef.current = velocity * VELOCITY_DECAY ** (dt * 60);
          } else {
            velocityRef.current = 0;
            const snapTarget = nearestSnapOffset(target, maxOffset);
            if (Math.abs(target - snapTarget) > SETTLE_EPS) {
              const snapFollow = 1 - Math.exp(-SNAP_SMOOTHING * dt);
              target = target + (snapTarget - target) * snapFollow;
              targetRef.current = clamp(target, 0, maxOffset);
              target = targetRef.current;
            } else {
              targetRef.current = snapTarget;
              target = snapTarget;
            }
          }
        }

        const current = offsetRef.current;
        const follow = 1 - Math.exp(-SCROLL_SMOOTHING * dt);
        const next =
          Math.abs(target - current) < SETTLE_EPS
            ? target
            : current + (target - current) * follow;

        offsetRef.current = next;
        setOffset((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));

        if (running) rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return () => {
        running = false;
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
    }, [maxOffset]);

    const applyDelta = useCallback((delta: number) => {
      const scale = readHomeScale(scrollRootRef?.current ?? viewportRef.current);
      const designDelta = delta / scale;
      targetRef.current = clamp(targetRef.current + designDelta, 0, maxOffsetRef.current);
      velocityRef.current += designDelta * WHEEL_VELOCITY_GAIN;

      if (wheelIdleRef.current) clearTimeout(wheelIdleRef.current);
      wheelIdleRef.current = setTimeout(() => {
        velocityRef.current = 0;
        wheelIdleRef.current = null;
      }, WHEEL_IDLE_MS);
    }, [scrollRootRef]);

    const isInCarouselBand = useCallback((clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return false;
      const band = viewport.getBoundingClientRect();
      return clientY >= band.top && clientY <= band.bottom;
    }, []);

    const isOverCarousel = useCallback((clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return false;
      const rect = viewport.getBoundingClientRect();
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }, []);

    const bindScrollInput = useCallback(
      (node: HTMLElement, options?: { bandOnly?: boolean; capture?: boolean }) => {
        const bandOnly = options?.bandOnly ?? false;
        const capture = options?.capture ?? false;

        const onWheel = (event: WheelEvent) => {
          if (bandOnly) {
            if (!isInCarouselBand(event.clientY)) return;
            if (isOverCarousel(event.clientX, event.clientY)) return;
          }
          event.preventDefault();
          applyDelta(event.deltaY);
        };

        const onTouchStart = (event: TouchEvent) => {
          const y = event.touches[0]?.clientY ?? 0;
          const x = event.touches[0]?.clientX ?? 0;
          if (bandOnly) {
            if (!isInCarouselBand(y)) return;
            if (isOverCarousel(x, y)) return;
          }
          if (wheelIdleRef.current) {
            clearTimeout(wheelIdleRef.current);
            wheelIdleRef.current = null;
          }
          isTouchingRef.current = true;
          velocityRef.current = 0;
          touchStartYRef.current = y;
          touchLastYRef.current = y;
          touchLastTimeRef.current = performance.now();
          touchStartOffsetRef.current = targetRef.current;
        };

        const onTouchMove = (event: TouchEvent) => {
          if (!isTouchingRef.current) return;
          event.preventDefault();
          const y = event.touches[0]?.clientY ?? touchStartYRef.current;
          const now = performance.now();
          const dt = Math.max(now - touchLastTimeRef.current, 1);
          touchVelocitySampleRef.current = (touchLastYRef.current - y) / dt;
          touchLastYRef.current = y;
          touchLastTimeRef.current = now;
          const scale = readHomeScale(scrollRootRef?.current ?? viewportRef.current);
          targetRef.current = clamp(
            touchStartOffsetRef.current + (touchStartYRef.current - y) / scale,
            0,
            maxOffsetRef.current,
          );
        };

        const onTouchEnd = () => {
          if (!isTouchingRef.current) return;
          isTouchingRef.current = false;
          velocityRef.current = clamp(
            touchVelocitySampleRef.current * 1000 * FLICK_VELOCITY_GAIN,
            -STEP_Y * 3,
            STEP_Y * 3,
          );
        };

        const clearWheelIdle = () => {
          if (wheelIdleRef.current) {
            clearTimeout(wheelIdleRef.current);
            wheelIdleRef.current = null;
          }
        };

        const listenerCapture = { capture } as const;

        node.addEventListener("wheel", onWheel, { passive: false, capture });
        node.addEventListener("touchstart", onTouchStart, { passive: true, capture });
        node.addEventListener("touchmove", onTouchMove, { passive: false, capture });
        node.addEventListener("touchend", onTouchEnd, { passive: true, capture });
        node.addEventListener("touchcancel", onTouchEnd, { passive: true, capture });

        return () => {
          clearWheelIdle();
          node.removeEventListener("wheel", onWheel, listenerCapture);
          node.removeEventListener("touchstart", onTouchStart, listenerCapture);
          node.removeEventListener("touchmove", onTouchMove, listenerCapture);
          node.removeEventListener("touchend", onTouchEnd, listenerCapture);
          node.removeEventListener("touchcancel", onTouchEnd, listenerCapture);
        };
      },
      [applyDelta, isInCarouselBand, isOverCarousel, scrollRootRef],
    );

    useImperativeHandle(
      ref,
      () => ({
        scrollToTop: () => {
          targetRef.current = 0;
          offsetRef.current = 0;
          velocityRef.current = 0;
          setOffset(0);
        },
      }),
      [],
    );

    useLayoutEffect(() => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      return bindScrollInput(viewport);
    }, [bindScrollInput]);

    useLayoutEffect(() => {
      const root = scrollRootRef?.current;
      if (!root) return;
      return bindScrollInput(root, { bandOnly: true, capture: true });
    }, [bindScrollInput, scrollRootRef]);

    const stageStyle = {
      "--home-card-step-y": `${STEP_Y}px`,
      "--home-card-viewport-h": `${VIEWPORT_HEIGHT}px`,
    } as CSSProperties;

    return (
      <div
        ref={viewportRef}
        className="home-page-card-carousel"
        style={stageStyle}
        aria-label="Release list"
      >
        <div
          className="home-page-card-carousel__track"
          style={{
            height: trackHeight,
            transform: `translate3d(0, ${-offset}px, 0)`,
          }}
        >
          {releases.map((release, index) => {
            const songCount = getSelectableSongs(release).length;
            const motion = getCardMotion(index, offset, releases.length);

            return (
              <article
                key={release.id}
                className="home-page-card-carousel__card"
                style={{
                  top: index * STEP_Y,
                  zIndex: motion.zIndex,
                  transform: motion.transform,
                  transformOrigin: motion.transformOrigin,
                  opacity: motion.opacity,
                  visibility: motion.visibility,
                  pointerEvents: motion.pointerEvents,
                }}
              >
                <div
                  className="home-page-card"
                  onPointerEnter={(event) =>
                    handleCardPointerEnter(event.pointerType, event.currentTarget)
                  }
                  onPointerLeave={(event) => handleCardPointerLeave(event.currentTarget)}
                >
                  <div className="home-page-card-metadata">
                    {release.spotifyUrl ? (
                      <a
                        href={release.spotifyUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="home-page-card-cover"
                        aria-label={`Open ${release.title} on Spotify`}
                      >
                        <img
                          src={getReleaseCoverArt(release)}
                          alt=""
                          className="h-[88px] w-[88px] shrink-0 rounded-[6px] object-cover"
                        />
                      </a>
                    ) : (
                      <img
                        src={getReleaseCoverArt(release)}
                        alt=""
                        className="h-[88px] w-[88px] shrink-0 rounded-[6px] object-cover"
                      />
                    )}
                    <div className="home-page-card-text">
                      <h2 className="home-page-card-title">{release.title}</h2>
                      <p className="home-page-card-meta">
                        {release.type} &bull; {release.year} &bull; {songCount} song
                        {songCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/release/${release.id}`}
                    className="home-page-card-play"
                    aria-label={`Play ${release.title}`}
                    onMouseEnter={() => setPlayTooltipReleaseId(release.id)}
                    onMouseLeave={() => setPlayTooltipReleaseId(null)}
                    onFocus={() => setPlayTooltipReleaseId(release.id)}
                    onBlur={() => setPlayTooltipReleaseId(null)}
                  >
                    <span
                      role="status"
                      aria-live="polite"
                      className={`home-page-card-play__tooltip${
                        playTooltipReleaseId === release.id
                          ? " home-page-card-play__tooltip--visible"
                          : ""
                      }`}
                    >
                      Play {release.title}
                    </span>
                    <img src={figmaAssets.homePagePlay} alt="" className="h-[44px] w-[44px] max-w-none" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  },
);

export default HomePageCardCarousel;
