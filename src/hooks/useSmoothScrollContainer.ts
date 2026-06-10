import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { computeChatScrollTarget, getMaxScrollTop } from "../utils/smoothScrollToCenter";

/** Matches HomePageCardCarousel — exponential follow (per second). */
const SCROLL_SMOOTHING = 11;
const SETTLE_EPS = 0.2;
const VELOCITY_DECAY = 0.9;
const WHEEL_VELOCITY_GAIN = 0.32;
const FLICK_VELOCITY_GAIN = 0.45;
const MOMENTUM_THRESHOLD = 0.05;
const WHEEL_IDLE_MS = 120;
const MAX_FRAME_DT = 0.032;
const MAX_FLICK_VELOCITY = 2400;
/** scrollTop below sync target by this much = user scrolled up to older lyrics. */
const SCROLL_UP_THRESHOLD = 32;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface UseSmoothScrollContainerOptions {
  /** Lower-third anchor for programmatic scroll-to-element (0–1). */
  anchorRatio?: number;
  /** Active lyric — used when re-syncing to the current line. */
  getSyncElement?: () => HTMLElement | null;
}

/**
 * Home-page-style smooth scroll on a native overflow container — exponential
 * follow, wheel momentum, touch flick — without grid/card snapping.
 */
export function useSmoothScrollContainer(
  scrollRef: RefObject<HTMLDivElement | null>,
  options: UseSmoothScrollContainerOptions = {},
) {
  const anchorRatio = options.anchorRatio ?? 0.8;
  const getSyncElementRef = useRef(options.getSyncElement);
  getSyncElementRef.current = options.getSyncElement;

  const targetRef = useRef(0);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const isTouchingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const touchLastYRef = useRef(0);
  const touchLastTimeRef = useRef(0);
  const touchVelocitySampleRef = useRef(0);
  const touchStartOffsetRef = useRef(0);
  const wheelIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackElementRef = useRef<HTMLElement | null>(null);
  const userDetachedRef = useRef(false);
  const isFollowingRef = useRef(false);
  const [isUserDetached, setIsUserDetached] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const setUserDetached = useCallback((detached: boolean) => {
    if (userDetachedRef.current === detached) return;
    userDetachedRef.current = detached;
    setIsUserDetached(detached);
  }, []);

  const setFollowing = useCallback((following: boolean) => {
    if (isFollowingRef.current === following) return;
    isFollowingRef.current = following;
    setIsFollowing(following);
  }, []);

  const stopTracking = useCallback(() => {
    trackElementRef.current = null;
    setFollowing(false);
  }, [setFollowing]);

  const scrollToElement = useCallback(
    (element: HTMLElement) => {
      const container = scrollRef.current;
      if (!container) return;

      setUserDetached(false);
      trackElementRef.current = element;
      setFollowing(true);
      velocityRef.current = 0;
      targetRef.current = computeChatScrollTarget(container, element, anchorRatio);
    },
    [anchorRatio, scrollRef, setFollowing, setUserDetached],
  );

  const updateScrolledUp = useCallback(
    (scrollTop: number, container: HTMLElement) => {
      if (trackElementRef.current || isFollowingRef.current) {
        if (userDetachedRef.current) setUserDetached(false);
        return;
      }

      const syncEl = getSyncElementRef.current?.();
      if (!syncEl) {
        setUserDetached(false);
        return;
      }

      const syncTarget = computeChatScrollTarget(container, syncEl, anchorRatio);
      const scrolledUp = scrollTop < syncTarget - SCROLL_UP_THRESHOLD;
      setUserDetached(scrolledUp);
    },
    [anchorRatio, setUserDetached],
  );

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    offsetRef.current = node.scrollTop;
    targetRef.current = node.scrollTop;

    let running = true;
    let lastTime = performance.now();

    const applyDelta = (delta: number) => {
      const maxScroll = getMaxScrollTop(node);
      targetRef.current = clamp(targetRef.current + delta, 0, maxScroll);
      velocityRef.current += delta * WHEEL_VELOCITY_GAIN;

      if (wheelIdleRef.current) clearTimeout(wheelIdleRef.current);
      wheelIdleRef.current = setTimeout(() => {
        velocityRef.current = 0;
        wheelIdleRef.current = null;
      }, WHEEL_IDLE_MS);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, MAX_FRAME_DT);
      lastTime = now;

      const maxScroll = getMaxScrollTop(node);
      let target = clamp(targetRef.current, 0, maxScroll);

      const tracked = trackElementRef.current;
      if (tracked) {
        target = computeChatScrollTarget(node, tracked, anchorRatio);
        targetRef.current = target;
      } else if (!isTouchingRef.current) {
        const velocity = velocityRef.current;
        if (Math.abs(velocity) > MOMENTUM_THRESHOLD) {
          target = clamp(target + velocity * dt, 0, maxScroll);
          targetRef.current = target;
          velocityRef.current = velocity * VELOCITY_DECAY ** (dt * 60);
        } else {
          velocityRef.current = 0;
        }
      }

      const current = offsetRef.current;
      const follow = 1 - Math.exp(-SCROLL_SMOOTHING * dt);
      const next =
        Math.abs(target - current) < SETTLE_EPS
          ? target
          : current + (target - current) * follow;

      offsetRef.current = next;
      node.scrollTop = next;

      if (tracked && Math.abs(next - target) < SETTLE_EPS) {
        trackElementRef.current = null;
        setFollowing(false);
      }

      updateScrolledUp(next, node);

      if (running) requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stopTracking();
      applyDelta(event.deltaY);
    };

    const onTouchStart = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? 0;
      if (wheelIdleRef.current) {
        clearTimeout(wheelIdleRef.current);
        wheelIdleRef.current = null;
      }
      stopTracking();
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
      const maxScroll = getMaxScrollTop(node);
      targetRef.current = clamp(
        touchStartOffsetRef.current + (touchStartYRef.current - y),
        0,
        maxScroll,
      );
    };

    const onTouchEnd = () => {
      if (!isTouchingRef.current) return;
      isTouchingRef.current = false;
      velocityRef.current = clamp(
        touchVelocitySampleRef.current * 1000 * FLICK_VELOCITY_GAIN,
        -MAX_FLICK_VELOCITY,
        MAX_FLICK_VELOCITY,
      );
    };

    const rafId = requestAnimationFrame(tick);

    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    node.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      if (wheelIdleRef.current) clearTimeout(wheelIdleRef.current);
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [anchorRatio, scrollRef, setFollowing, stopTracking, updateScrolledUp]);

  return { scrollToElement, isUserDetached, isFollowing };
}
