import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
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
const SNAP_PULL = 0.12;
const SNAP_ZONE = 0.38;
const MAX_FRAME_DT = 0.032;

export interface HomePageCardCarouselHandle {
  scrollToTop: () => void;
}

interface HomePageCardCarouselProps {
  releases: Release[];
  onScrolledChange?: (scrolled: boolean) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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

const HomePageCardCarousel = forwardRef<HomePageCardCarouselHandle, HomePageCardCarouselProps>(
  function HomePageCardCarousel({ releases, onScrolledChange }, ref) {
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

    const [offset, setOffset] = useState(0);

    const trackHeight = releases.length * CARD_HEIGHT + Math.max(0, releases.length - 1) * CARD_GAP;
    const maxOffset = Math.max(0, (releases.length - VISIBLE_CARDS) * STEP_Y);

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        targetRef.current = 0;
      },
    }));

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

      const tick = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, MAX_FRAME_DT);
        lastTime = now;

        let target = clamp(targetRef.current, 0, maxOffset);

        if (!isTouchingRef.current) {
          const velocity = velocityRef.current;
          if (Math.abs(velocity) > 0.05) {
            target = clamp(target + velocity * dt, 0, maxOffset);
            targetRef.current = target;
            velocityRef.current = velocity * VELOCITY_DECAY ** (dt * 60);
          } else {
            velocityRef.current = 0;
            const snap = Math.round(target / STEP_Y) * STEP_Y;
            if (Math.abs(target - snap) < STEP_Y * SNAP_ZONE) {
              const pulled = target + (snap - target) * SNAP_PULL;
              targetRef.current = clamp(pulled, 0, maxOffset);
              target = targetRef.current;
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
        setOffset(next);

        if (running) rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return () => {
        running = false;
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      };
    }, [maxOffset]);

    const applyDelta = useCallback(
      (delta: number) => {
        targetRef.current = clamp(targetRef.current + delta, 0, maxOffset);
        velocityRef.current += delta * WHEEL_VELOCITY_GAIN;
      },
      [maxOffset],
    );

    useEffect(() => {
      const node = viewportRef.current;
      if (!node) return;

      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        applyDelta(event.deltaY);
      };

      const onTouchStart = (event: TouchEvent) => {
        isTouchingRef.current = true;
        velocityRef.current = 0;
        const y = event.touches[0]?.clientY ?? 0;
        touchStartYRef.current = y;
        touchLastYRef.current = y;
        touchLastTimeRef.current = performance.now();
        touchStartOffsetRef.current = targetRef.current;
      };

      const onTouchMove = (event: TouchEvent) => {
        event.preventDefault();
        const y = event.touches[0]?.clientY ?? touchStartYRef.current;
        const now = performance.now();
        const dt = Math.max(now - touchLastTimeRef.current, 1);
        touchVelocitySampleRef.current = (touchLastYRef.current - y) / dt;
        touchLastYRef.current = y;
        touchLastTimeRef.current = now;
        targetRef.current = clamp(
          touchStartOffsetRef.current + (touchStartYRef.current - y),
          0,
          maxOffset,
        );
      };

      const onTouchEnd = () => {
        isTouchingRef.current = false;
        velocityRef.current = clamp(
          touchVelocitySampleRef.current * 1000 * FLICK_VELOCITY_GAIN,
          -STEP_Y * 3,
          STEP_Y * 3,
        );
      };

      node.addEventListener("wheel", onWheel, { passive: false });
      node.addEventListener("touchstart", onTouchStart, { passive: true });
      node.addEventListener("touchmove", onTouchMove, { passive: false });
      node.addEventListener("touchend", onTouchEnd, { passive: true });
      node.addEventListener("touchcancel", onTouchEnd, { passive: true });

      return () => {
        node.removeEventListener("wheel", onWheel);
        node.removeEventListener("touchstart", onTouchStart);
        node.removeEventListener("touchmove", onTouchMove);
        node.removeEventListener("touchend", onTouchEnd);
        node.removeEventListener("touchcancel", onTouchEnd);
      };
    }, [applyDelta, maxOffset]);

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
                className="home-page-card home-page-card-carousel__card"
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
                <div className="home-page-card-metadata">
                  <img
                    src={getReleaseCoverArt(release)}
                    alt=""
                    className="h-[88px] w-[88px] shrink-0 rounded-[6px] object-cover"
                  />
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
                  aria-label={`Open ${release.title}`}
                >
                  <img src={figmaAssets.homePagePlay} alt="" className="h-[44px] w-[44px] max-w-none" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    );
  },
);

export default HomePageCardCarousel;
