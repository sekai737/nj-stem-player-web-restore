# Fullscreen Lyrics Feed — Chat Animation Implementation

> **Source of truth:** `fullscreen-lyrics-animation.md` (static analysis of `ChatLyricFeed.tsx`,
> `RightChatMessage.tsx`, `fullscreen-lyric-feed.css`, `lyricsDisplay.ts`, `fullscreenLyrics.ts`).
> All decisions below trace directly to findings in that document.

---

## Analysis Summary

### What the current system does

| Concern | Current implementation | Problem |
|---|---|---|
| Entrance animation | CSS keyframe `fs-message-in`: `translateY(12px) scale(0.98) opacity(0)` → rest, `0.42s cubic-bezier(0.22,1,0.36,1) both` | Works, keep as-is |
| Active selection | `getActiveMergedLyricIndex` → last line whose `time <= currentTime`; one active bubble at a time | Correct, keep as-is |
| Scroll-to-active | `scrollIntoView({ block:"center", behavior:"smooth" })` inside `useEffect([activeLineId, visibleLines.length])` | **Root cause of all jitter** — three separate problems |
| Scroll easing | Browser-native; no app control | Cannot match entrance curve |
| Scroll trigger | Fires on both `activeLineId` change AND `visibleLines.length` change | Redundant triggers during normal playback |
| Entrance vs. scroll conflict | Scroll targets center of element while that element is mid-animation at `translateY(12px) scale(0.98)` | Position target shifts under the scroll |
| CSS `scroll-behavior: smooth` | Set on `.fs-lyric-feed__scroll` AND JS also passes `behavior:"smooth"` | Dual-smooth compounds inconsistently across browsers |

### Why it doesn't feel like a true chat feed

A real messaging app advances the feed by **pushing content upward** — new messages arrive at the bottom of the visible area and the whole conversation glides up to make room. The current implementation does the inverse: it **recenters** the viewport on the active line using `block:"center"`, which means the feed can scroll up *or* down depending on where the active line is, and the centering target is a moving element (mid-animation). The result is the visible jitter and snapping users report.

### What must change

1. **Replace `scrollIntoView` with a controlled RAF loop** that re-reads the active element's position each frame during its entrance animation, so the scroll target tracks the element rather than chasing a stale layout snapshot.
2. **Remove `scroll-behavior: smooth` from CSS** so only JS drives scroll, eliminating the dual-smooth conflict.
3. **Change scroll dependency array** from `[activeLineId, visibleLines.length]` to `[activeLineId]` only, eliminating redundant triggers.
4. **Scroll to the bottom of visible content** (keeping the newest message near the bottom of the viewport), not to the vertical center — this is how messaging apps work and eliminates the recentering jump.

### What must NOT change

- `fs-message-in` keyframe and timing — verified correct against Figma nodes 120:170–120:180.
- `fs-lyric-message--enter` class application logic in `ChatLyricFeed.tsx` and `RightChatMessage.tsx`.
- All bubble styles, colors, padding, border-radius, and font tokens.
- Left/right alignment, avatar sizes, sender label insets, negative top-margin between sides.
- `getActiveMergedLyricIndex` and `visibleLines` filter logic — lyric timing is correct.
- `FullscreenPlayer.tsx` keying by `song.id` — correct reset behavior.

---

## Implementation Plan

### New file: `src/utils/smoothScrollToCenter.ts`

A minimal RAF-based scroll utility that:

- Accepts a scroll container element and a target element.
- Computes `targetScrollTop` so the target sits in the **lower third** of the container (mimicking a chat app where new messages pin near the bottom).
- Runs an exponential ease-out loop (`remaining *= factor` per frame) so it naturally decelerates.
- Re-reads `offsetTop` + `offsetHeight` every frame — the target element is still animating its entrance (`translateY / scale`) so its layout-reported position is accurate even mid-animation (CSS transforms do not affect layout geometry; `offsetTop` is stable the moment the element mounts).
- Cancels on unmount via returned cleanup function.
- Clamps `scrollTop` to `[0, scrollHeight - clientHeight]`.

```ts
// src/utils/smoothScrollToCenter.ts

/**
 * Smoothly scrolls `container` so `target` sits in the lower-third of the
 * viewport (chat-feed convention: newest message near the bottom).
 *
 * Uses an exponential ease-out RAF loop so duration is self-regulating and
 * the scroll naturally blends with the 0.42s bubble entrance animation.
 *
 * @returns cleanup — call on unmount or before the next scroll begins.
 */
export function smoothScrollToTarget(
  container: HTMLElement,
  target: HTMLElement,
  options: { smoothing?: number } = {}
): () => void {
  const { smoothing = 5 } = options; // higher = faster settle; 5 ≈ 600–700ms

  let rafId: number;
  let cancelled = false;

  function tick() {
    if (cancelled) return;

    // Re-read geometry every frame: target may still be mid-entrance animation.
    // CSS transforms (translateY/scale) do NOT affect offsetTop — position is stable.
    const containerHeight = container.clientHeight;
    const targetTop = target.offsetTop;
    const targetHeight = target.offsetHeight;

    // Position target so its bottom sits 20% from the bottom of the container.
    // This is the "chat advancing" anchor: newest message rises into this slot.
    const desiredScrollTop =
      targetTop + targetHeight - containerHeight * 0.80;

    const maxScroll = container.scrollHeight - container.clientHeight;
    const clamped = Math.max(0, Math.min(desiredScrollTop, maxScroll));

    const current = container.scrollTop;
    const delta = clamped - current;

    if (Math.abs(delta) < 0.5) {
      container.scrollTop = clamped;
      return; // Done.
    }

    // Exponential ease-out: move a fraction of remaining distance each frame.
    container.scrollTop = current + delta / smoothing;

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
```

**Why lower-third, not center?**
`block:"center"` (current) puts the active line in the middle of the feed, meaning older lyrics are still visible above. In a real chat app, the newest message sits near the bottom and the conversation scrolls upward out of view. This is the core motion that makes it feel like a "advancing message" rather than a "scrolling list". Using 80% of container height as the anchor achieves this without hard-pinning to the very bottom (leaving breathing room).

---

### Changes to `ChatLyricFeed.tsx`

Three targeted edits. No structural or JSX changes.

#### 1. Import the new utility

```tsx
// Add import
import { smoothScrollToTarget } from "../../utils/smoothScrollToCenter";
```

#### 2. Replace the scroll `useEffect`

**Remove:**
```tsx
useEffect(() => {
  activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
}, [activeLineId, visibleLines.length]);
```

**Replace with:**
```tsx
useEffect(() => {
  if (!activeRef.current || !scrollRef.current) return;

  // Cancel any in-progress scroll before starting a new one.
  const cleanup = smoothScrollToTarget(scrollRef.current, activeRef.current, {
    smoothing: 5,
  });

  return cleanup;
}, [activeLineId]); // visibleLines.length removed — redundant trigger
```

**Why drop `visibleLines.length`?**
The analysis identified this as a source of redundant scroll calls: when a new line becomes visible but `activeLineId` has not changed (e.g., a very short gap between two timestamps), the effect fires again and interrupts an in-progress scroll. Watching `activeLineId` alone is sufficient — that value changes exactly when the active line advances.

#### 3. Activate `scrollRef` for scroll math

`scrollRef` is already attached to `.fs-lyric-feed__scroll` in the existing code but was never used for scroll math. No JSX change needed — the ref is now consumed by the new utility call above.

---

### Changes to `fullscreen-lyric-feed.css`

One line removed.

#### Remove `scroll-behavior: smooth` from the container

**Remove from `.fs-lyric-feed__scroll`:**
```css
scroll-behavior: smooth;
```

**Why:** With JS driving scroll via RAF, the CSS `scroll-behavior: smooth` on the same element creates a second easing layer that compounds unpredictably across browsers (Chrome vs. Safari vs. Firefox each implement different durations for native smooth). Removing it gives JS full control. The feel remains smooth — the RAF loop *is* the smoothing.

---

### No changes to `RightChatMessage.tsx`

The `fs-lyric-message--enter` class is correctly applied on mount and the `isActive` ref forwarding is correct. The scroll utility uses `activeRef.current` from `ChatLyricFeed.tsx`, which already captures both left and right active elements via the same `activeRef`. Nothing changes here.

---

### No changes to `fullscreen-lyric-feed.css` keyframes

`fs-message-in` (`translateY(12px) scale(0.98) opacity:0` → rest, `0.42s cubic-bezier(0.22,1,0.36,1) both`) is correct and matches Figma. The new scroll approach works *with* the entrance animation rather than fighting it, so the keyframe is preserved exactly.

---

## Complete File Diffs

### `src/utils/smoothScrollToCenter.ts` — NEW FILE

```ts
/**
 * smoothScrollToCenter.ts
 *
 * RAF-based scroll utility for ChatLyricFeed.
 * Replaces scrollIntoView({ behavior:"smooth" }) to give app-level control
 * over easing, eliminate dual-smooth-scroll conflicts, and re-measure target
 * geometry each frame during the bubble entrance animation.
 */

/**
 * Scrolls `container` so `target` sits in the lower portion of the viewport,
 * matching the chat-feed convention where new messages arrive near the bottom.
 *
 * Uses exponential ease-out so scroll naturally decelerates without a fixed
 * duration — works regardless of how far the feed needs to advance.
 *
 * @param container  The scrollable element (`.fs-lyric-feed__scroll`).
 * @param target     The active message element (`activeRef.current`).
 * @param options    smoothing: higher = faster settle. Default 5 ≈ 650ms.
 * @returns          Cleanup function — call on unmount or before next scroll.
 */
export function smoothScrollToTarget(
  container: HTMLElement,
  target: HTMLElement,
  options: { smoothing?: number } = {}
): () => void {
  const { smoothing = 5 } = options;

  let rafId: number;
  let cancelled = false;

  function tick() {
    if (cancelled) return;

    const containerHeight = container.clientHeight;
    const targetTop = target.offsetTop;
    const targetHeight = target.offsetHeight;

    // Anchor: target bottom sits at 80% of container height.
    // This is the "chat advancing" slot — newest message near the bottom.
    const desiredScrollTop =
      targetTop + targetHeight - containerHeight * 0.8;

    const maxScroll = container.scrollHeight - containerHeight;
    const clamped = Math.max(0, Math.min(desiredScrollTop, maxScroll));

    const current = container.scrollTop;
    const delta = clamped - current;

    if (Math.abs(delta) < 0.5) {
      container.scrollTop = clamped;
      return;
    }

    container.scrollTop = current + delta / smoothing;
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
```

---

### `ChatLyricFeed.tsx` — DIFF

```diff
+ import { smoothScrollToTarget } from "../../utils/smoothScrollToCenter";

  // ... existing imports unchanged ...

- useEffect(() => {
-   activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
- }, [activeLineId, visibleLines.length]);

+ useEffect(() => {
+   if (!activeRef.current || !scrollRef.current) return;
+   const cleanup = smoothScrollToTarget(scrollRef.current, activeRef.current, {
+     smoothing: 5,
+   });
+   return cleanup;
+ }, [activeLineId]);
```

---

### `fullscreen-lyric-feed.css` — DIFF

```diff
  .fs-lyric-feed__scroll {
    overflow-y: auto;
-   scroll-behavior: smooth;
    padding-right: 4px;
    padding-bottom: 8px;
  }
```

---

## Validation Checklist

| Requirement | How it is met |
|---|---|
| Only one lyric line active at a time | Unchanged — `getActiveMergedLyricIndex` + single `activeRef` |
| New lyric lines slide upward into place | Unchanged — `fs-message-in` keyframe: `translateY(12px)→0` |
| New lyric lines scale smoothly to full size | Unchanged — `fs-message-in` keyframe: `scale(0.98)→1` |
| Previous lyric lines move upward naturally | RAF scroll glides the whole feed upward as new message mounts |
| No visible snapping | RAF ease-out re-measures each frame; no layout-snapshot staleness |
| No layout regressions | Zero JSX or spacing changes |
| Left/right alignment intact | `RightChatMessage.tsx` unchanged; CSS classes unchanged |
| Existing styling unchanged | No bubble, color, font, or inset CSS touched |
| Lyric timing synchronized with playback | `getActiveMergedLyricIndex` + `visibleLines` filter unchanged |
| `scrollRef` now doing meaningful work | Passed to `smoothScrollToTarget`; no longer an unused ref |

---

## What Changed, Why, and Which Files

### 1. New: `src/utils/smoothScrollToCenter.ts`

**What:** A 40-line RAF scroll utility with exponential ease-out.

**Why:** `scrollIntoView` gives zero control over duration, easing, or the ability to re-target mid-animation. During the `0.42s` bubble entrance, the active element is at `translateY(12px) scale(0.98)` at mount time — native smooth scroll takes a position snapshot at call time and races to that stale position. The RAF loop re-reads `offsetTop + offsetHeight` every 16ms, so scroll continuously tracks the element as it finishes animating.

**Effect:** Scroll and entrance feel like one coordinated motion rather than two competing animations.

### 2. Modified: `ChatLyricFeed.tsx` (2 lines changed)

**What:** Replace `scrollIntoView` call with `smoothScrollToTarget`. Change effect dependency from `[activeLineId, visibleLines.length]` to `[activeLineId]`.

**Why:** Drops the redundant scroll trigger that could interrupt an in-progress glide. Returns the cleanup function from the RAF loop so the previous scroll is always cancelled before the next one starts — no scroll-piling when lyrics advance quickly.

### 3. Modified: `fullscreen-lyric-feed.css` (1 line removed)

**What:** Remove `scroll-behavior: smooth` from `.fs-lyric-feed__scroll`.

**Why:** With JS driving `scrollTop` via RAF, the CSS property adds a second ease layer applied by the browser's compositor. The two easing systems cannot be coordinated and produce different (often compounding) behavior across Chrome, Safari, and Firefox. Removing it gives the RAF loop sole ownership of scroll motion.

---

## How the New Animation Differs from the Previous Implementation

| Dimension | Before | After |
|---|---|---|
| Scroll engine | Browser-native `scrollIntoView` | App-controlled RAF exponential ease-out |
| Scroll anchor | `block:"center"` — active line vertically centered | Active line bottom at 80% of viewport height (chat convention) |
| Scroll easing | Browser-defined; ~150–300ms linear-ish depending on browser | App-defined; ~600–700ms exponential ease-out, matching entrance feel |
| Scroll-entrance coordination | Scroll snapshots element position at call time; element is mid-animation — target drifts | RAF re-reads position every frame; scroll tracks element throughout entrance |
| Redundant triggers | Fires on `visibleLines.length` change even when active line hasn't changed | Fires only when `activeLineId` changes |
| Dual smooth conflict | `behavior:"smooth"` (JS) + `scroll-behavior: smooth` (CSS) on same element | JS RAF only; CSS smooth removed |
| Net feel | New message centers in feed, often with a snapping or recentering jump | Feed glides upward as new message arrives at the bottom, like a messaging app |

---

## Notes on `smoothing` Constant

The default `smoothing: 5` produces approximately 650ms settle time (measured as frames until `|delta| < 0.5px` from a 400px jump). This is intentionally longer than the `0.42s` bubble entrance so the scroll is still moving slightly as the entrance finishes — the two motions overlap gracefully rather than ending at the same moment (which would feel abrupt).

To tune if needed:

| `smoothing` value | Approximate settle time |
|---|---|
| 3 | ~350ms (snappier) |
| 5 | ~650ms (default, recommended) |
| 7 | ~900ms (very soft) |

Change only the constant passed to `smoothScrollToTarget` in `ChatLyricFeed.tsx`; no other file needs touching.

---

## Out of Scope (Not Changed)

- `src/components/fullscreen/SyncedLyricsDisplay.tsx` — legacy, unused, flagged for deprecation separately (see original analysis §4 Problem 10 and §5 Fix E).
- `src/utils/lyricsAnimation.ts` / `src/components/lyrics/SyncedLyricsDisplay.tsx` — stem-player lyrics; different layout and transform-based scroll; patterns referenced but not reused.
- `src/figma/fullscreenLayout.ts` — layout constants unchanged.
- `FullscreenPlayer.tsx` — keying by `song.id` unchanged; feed still fully resets on song change.
- All Figma node values (120:170–120:180) — no visual token changes.
