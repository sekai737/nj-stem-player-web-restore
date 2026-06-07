# Fullscreen Lyrics Feed — Animation & Scroll Analysis

Analysis of the chat-style lyrics feed in fullscreen mode. Visual source of truth: Figma nodes referenced in `fullscreen-lyric-feed.css` (120:170, 120:173, 120:174, 120:176, 120:180).

**Primary components**

| Role | File |
|------|------|
| Feed orchestration | `src/components/fullscreen/ChatLyricFeed.tsx` |
| Right-aligned messages | `src/components/fullscreen/RightChatMessage.tsx` |
| Styles & keyframes | `src/components/fullscreen/fullscreen-lyric-feed.css` |
| Layout constants | `src/figma/fullscreenLayout.ts` (`FIGMA_FULLSCREEN.lyricFeed`) |
| Active line selection | `src/utils/lyricsDisplay.ts` (`getActiveMergedLyricIndex`) |
| Bubble text content | `src/utils/fullscreenLyrics.ts` (`getLyricBubbleLines`) |
| Text rendering | `src/components/LyricText.tsx` |
| Fullscreen shell | `src/components/fullscreen/FullscreenPlayer.tsx` |

**Out of scope (not mounted in current fullscreen UI):** `src/components/fullscreen/SyncedLyricsDisplay.tsx` — legacy list-style lyrics; `FullscreenPlayer` imports `ChatLyricFeed` only.

---

## 1. Lyric Bubble Entrance Animation

### Trigger conditions

- CSS class `fs-lyric-message--enter` drives the entrance animation.
- **Right-aligned messages** (song title opener, Pharrell / guest lines): applied in `RightChatMessage` on every render of that component.
- **Left-aligned member messages**: applied inline in `ChatLyricFeed` on each member `<article>`.
- Animation runs when the element **first mounts** in the DOM. Existing messages keep the class on subsequent `currentTime` updates but do not re-run the animation unless the element remounts (e.g. song change — `ChatLyricFeed` is keyed by `song.id` in `FullscreenPlayer.tsx`).
- New lyrics appear when `visibleLines` grows: lines where `line.time <= currentTime` and `hasDisplayableLyricContent(line)` is true.

### Slide behavior

- Keyframe `fs-message-in` animates from `translateY(12px)` to `translateY(0)`.
- Applied to the entire message `<article>`, not the bubble alone (avatar, sender label, timestamp move with the message).

### Scale behavior

- Entrance: `scale(0.98)` → `scale(1)` on the message `<article>` via the same keyframe.
- **Active state does not scale.** `fs-lyric-bubble--active` only adds `box-shadow: var(--shadow-pop-4)` — no transform transition on activation/deactivation.

### Opacity behavior

- Entrance: `opacity: 0` → `opacity: 1` on the message `<article>`.
- No opacity change tied to active/inactive state.

### Timing and easing

| Property | Value | Source |
|----------|-------|--------|
| Duration | `0.42s` | `.fs-lyric-message--enter` |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` | `.fs-lyric-message--enter` |
| Fill mode | `both` | `.fs-lyric-message--enter` |
| Keyframe name | `fs-message-in` | `fullscreen-lyric-feed.css` |

---

## 2. Auto-Scroll Behavior

### How the active lyric is selected

1. `currentTime` comes from `usePlayerStore`.
2. `visibleLines` = merged lines with `line.time <= currentTime` and displayable content (`ChatLyricFeed.tsx`).
3. `activeLineId` = `visibleLines[getActiveMergedLyricIndex(visibleLines, currentTime)].id`.
4. `getActiveMergedLyricIndex` returns the index of the **last** line whose `time <= currentTime` (walks forward until time exceeds `currentTime`).
5. Exactly **one** active bubble for the whole feed (comment in code: avoids active shadow lingering on the wrong side when right-side lines are current).

Active ref assignment:

- Right lines: `ref` on `RightChatMessage` when `isActive`.
- Member lines: `ref` on inline `<article>` when `isActive`.
- Stored in `activeRef` (`useRef<HTMLElement | null>`).

### How the feed scrolls to the active line

```tsx
useEffect(() => {
  activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
}, [activeLineId, visibleLines.length]);
```

- Scroll container: `.fs-lyric-feed__scroll` (`scrollRef` on the div; scroll is driven by `scrollIntoView` on the active message, not manual `scrollTop`).
- Target: vertically center the active message in the scroll viewport (`block: "center"`).
- CSS on container: `scroll-behavior: smooth` (`.fs-lyric-feed__scroll`).

### Scroll duration and easing

- **Not defined in application code.** Duration and easing come from the browser’s native “smooth” scroll implementation for `scrollIntoView` and/or `scroll-behavior: smooth`.
- No custom easing curve, duration constant, or `requestAnimationFrame` scroll loop exists in the current feed code.
- **Needs verification:** exact duration and curve vary by browser (Chrome, Safari, Firefox differ).

Approximate feel (observed behavior, not code-defined):

- Typically shorter and more linear/snappy than the 0.42s bubble entrance.
- Not tempo-synced to track BPM (unlike stem-player `SyncedLyricsDisplay` in `src/components/lyrics/SyncedLyricsDisplay.tsx`, which uses `src/utils/lyricsAnimation.ts`).

### Smooth vs. jumpy assessment (from code)

| Factor | Effect |
|--------|--------|
| Native `scrollIntoView` | Limited control; can feel abrupt compared to bubble entrance |
| `visibleLines.length` in effect deps | Extra scroll calls when visible count changes even if `activeLineId` is unchanged — **needs verification** whether this occurs during normal playback |
| Entrance animation layout shift | Active line grows from `translateY(12px) scale(0.98)` while scroll targets its center — target position moves during the 0.42s entrance |
| Dual smooth hints | Both `behavior: "smooth"` on `scrollIntoView` and `scroll-behavior: smooth` on the container — interaction is **needs verification** |
| No scroll clamping | Native scroll handles bounds; no explicit max-scroll math in feed code |

**Current code state:** scroll behavior is browser-native, not custom-eased. User-facing “jumpy” reports are consistent with this implementation, especially when a new message mounts and animates while scroll recenters.

---

## 3. Layout Behavior

### Left / right chat alignment

| Message type | Alignment | CSS |
|--------------|-----------|-----|
| Song title opener (`SongTitleChatMessage` → `RightChatMessage`) | Right | `fs-lyric-message--right` |
| Pharrell / guest (`line.member === "pharrell"`) | Right | `RightChatMessage` → `fs-lyric-message--right` |
| NewJeans members | Left (default column flow) | `fs-lyric-message` without `--right` |

Right-side rules (`.fs-lyric-message--right`):

- `align-self: flex-end`, `align-items: flex-end`, `margin-right: var(--fs-lyric-edge-inset)` (60px), `margin-left: auto`, `max-width: 100%`.
- Row uses `flex-direction: row-reverse` (timestamp on the outer edge, avatar inward).
- Bubble corner: `border-top-right-radius: 0` (tail on top-right); background `var(--main-container-primary)`.

Left-side member messages:

- Sender row inset: `margin-left: var(--fs-lyric-name-inset)` (96px).
- Default bubble: `border-top-left-radius: 0` (tail on top-left); background `var(--gradient-language-selected)`.

**Transition between sides:** First left message after a right block gets negative top margin:

```css
.fs-lyric-message--right + .fs-lyric-message:not(.fs-lyric-message--right) {
  margin-top: calc(-1 * (var(--fs-lyric-feed-name-size, 24px) + var(--spacing-sp-8)));
}
```

### Sender labels

- Element: `.fs-lyric-message__sender`
- Font: Swiss 721 Regular, 24px (`--fs-lyric-feed-name-size`)
- Layout: flex row, 8px gap between name and emoji
- Right messages: sender `justify-content: flex-end`, `margin-right: 96px`
- Left messages: `margin-left: 96px`
- Opener name: `FULLSCREEN_CHAT_OPENER.name` (`"sekai★⁷³⁷"`) from `src/data/members.ts`
- Member names: `MEMBERS[line.member].name`

### Avatars

| Context | Size | Notes |
|---------|------|-------|
| Default member / right portrait | 72×72px | `FIGMA_FULLSCREEN.lyricFeed.avatarSize` |
| Haerin | 70×72px width×height | `haerinAvatarWidth` override in `ChatLyricFeed.tsx` |
| Shape | Circle | `border-radius: 50%`, `overflow: hidden`, `object-fit: cover` |
| Opener / Pharrell | Via `RightChatMessage` | Portrait + optional emoji row |

Emoji beside sender name: 26×26px PNG (`--fs-lyric-message__emoji`). Opener shows five member emoji icons in a row.

### Bubble spacing

| Token | Value | Usage |
|-------|-------|-------|
| Message gap | 32px | `.fs-lyric-message { margin-bottom: 32px }` — matches Figma `messageGap` |
| Last message | 4px bottom | `.fs-lyric-message:last-child` |
| Row gap (avatar ↔ bubble ↔ time) | 24px | `.fs-lyric-message__row { gap: var(--spacing-sp-24) }` |
| Bubble padding | 16px × 32px | `.fs-lyric-bubble` |
| Bubble border radius | 24px | Tail corner zeroed per side |
| Scroll padding | 4px right, 8px bottom | `.fs-lyric-feed__scroll` — room for active shadow |

### Wrapped text behavior

- Bubble: `display: flex; flex-direction: column; flex-shrink: 0` — shrink-to-fit width, not full-row stretch.
- Line text: `.fs-lyric-bubble__line` at 32px, `line-height: normal`, `text-align: left`.
- Multi-line lyrics: multiple `.fs-lyric-bubble__line` `<p>` elements; no extra margin between stacked lines (`margin-top: 0`).
- Script runs: `LyricText` splits Korean/Japanese/Latin with appropriate font classes (`.lyric-run--kr`, `--jp`, `--latin`).
- **No explicit `max-width` on bubbles** — wrapping width is constrained by the flex row and lyrics column (`flex: 1; min-width: 0` on `.fs-player__lyrics-col`). Long unbroken strings: **needs verification** on narrow viewports.
- Conversion / translation lines: controlled by `getLyricBubbleLines` + store `translationDisplay` — layout unchanged, content lines may increase bubble height.

---

## 4. Problems Found

### Scroll / animation timing

1. **Native scroll, no app-level easing** — `scrollIntoView({ behavior: "smooth" })` cannot match the 0.42s `cubic-bezier(0.22, 1, 0.36, 1)` bubble entrance; scroll and entrance are decoupled.
2. **Competing layout motion** — scroll targets vertical center while the new message animates `translateY(12px)` and `scale(0.98→1)`, shifting the scroll target mid-animation.
3. **Redundant scroll triggers** — effect depends on `[activeLineId, visibleLines.length]`; length-only changes may fire scroll without an active-line change (**needs verification** during playback).
4. **Dual smooth-scroll hints** — JS `behavior: "smooth"` plus CSS `scroll-behavior: smooth` on the same container; may produce inconsistent or compounded motion (**needs verification** per browser).

### Missing animation

5. **No active-state transition** — `fs-lyric-bubble--active` toggles box-shadow instantly; no scale-up or fade on activation (entrance scale does not repeat for active state).
6. **No scroll-linked animation** — unlike stem-player lyrics (`src/components/lyrics/SyncedLyricsDisplay.tsx` + `src/utils/lyricsAnimation.ts`), fullscreen feed does not use transform-based scroll or tempo-scaled duration.

### Jitter / snapping

7. **Browser-dependent snap** — native smooth scroll often eases quickly and can feel like a snap when chained with new DOM nodes mounting.
8. **`scrollRef` unused for scroll math** — ref is attached but scroll position is not measured or animated programmatically; no correction loop during entrance animation.

### Layout / structure

9. **Duplicated message markup** — member lines are inline in `ChatLyricFeed.tsx`; right/guest lines use `RightChatMessage.tsx`. Same CSS classes but two code paths; drift risk.
10. **Legacy component** — `src/components/fullscreen/SyncedLyricsDisplay.tsx` duplicates scroll-via-`scrollIntoView` pattern but is unused; may confuse future work.

### Responsive

11. **Viewport cap** — `@media (max-width: 1200px)` sets `.fs-lyric-feed__scroll { max-height: 40vh }`; scroll centering behavior in short viewports is **needs verification**.

---

## 5. Recommended Fixes

Prioritized changes that preserve Figma layout, bubble styling, member attribution, and entrance animation.

### A. Replace native scroll with controlled easing (high impact)

**Goal:** Glide to active line with softer, longer easing synced to lyric activation.

**Approach:**

1. Remove or avoid `scrollIntoView` in `ChatLyricFeed.tsx`.
2. Add a small utility (e.g. `src/utils/smoothScrollToCenter.ts`) that:
   - Computes centered `scrollTop` from container + active element geometry.
   - Animates via `requestAnimationFrame` with exponential ease-out (e.g. smoothing constant ~5–6 for ~600–800ms settle).
   - Re-measures the active element each frame during the 0.42s entrance so layout shift does not cause jumps.
   - Clamps to `[0, scrollHeight - clientHeight]`.
3. Trigger in `useLayoutEffect` on **`activeLineId` only** (drop `visibleLines.length` unless a measured edge case requires it).
4. Remove `scroll-behavior: smooth` from `.fs-lyric-feed__scroll` to avoid fighting JS-driven scroll.

**Files:** `ChatLyricFeed.tsx`, `fullscreen-lyric-feed.css`, new scroll utility.

**Reference implementation:** `src/components/lyrics/SyncedLyricsDisplay.tsx` + `computeLyricsScrollOffset` in `src/utils/lyricsAnimation.ts` (transform-based, different layout — use for patterns only, not direct reuse).

### B. Reduce scroll vs. entrance conflict (medium impact)

**Options (pick one; verify visually against Figma):**

- Start scroll after one `requestAnimationFrame` once active ref is set (minimal delay).
- Continue re-targeting scroll during entrance (part of A) — preferred; no timing change to bubble CSS.
- **Do not** shorten or remove `fs-message-in` without design approval.

**Files:** Same as A.

### C. Active bubble polish (low impact, optional)

If design intends a subtle “pop” on activation beyond shadow:

- Add a short CSS transition on `box-shadow` only (preserve layout).
- Avoid transform scale on active bubble unless Figma specifies it — current design uses shadow only.

**Files:** `fullscreen-lyric-feed.css` only.

### D. Consolidate message rendering (maintainability)

- Render member lines through a shared `LeftChatMessage` or extend `RightChatMessage` with a `variant="left" | "right"` prop.
- Keeps `fs-lyric-message--enter`, refs, and active class logic in one place.

**Files:** `ChatLyricFeed.tsx`, `RightChatMessage.tsx` (or new sibling component).

**Do not change:** bubble padding, fonts, colors, sender/avatar positions, or Figma insets.

### E. Cleanup (low risk)

- Remove or clearly deprecate `src/components/fullscreen/SyncedLyricsDisplay.tsx` if confirmed unused.
- Document that `scrollRef` should either drive programmatic scroll or be removed if redundant.

---

## Quick Reference — Key Code Locations

**Entrance animation**

```css
/* fullscreen-lyric-feed.css */
.fs-lyric-message--enter {
  animation: fs-message-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

**Auto-scroll**

```tsx
/* ChatLyricFeed.tsx */
useEffect(() => {
  activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
}, [activeLineId, visibleLines.length]);
```

**Active selection**

```tsx
const idx = getActiveMergedLyricIndex(visibleLines, currentTime);
return idx >= 0 ? visibleLines[idx].id : null;
```

---

*Generated from static analysis of the repository. Runtime feel (browser scroll curves, narrow viewport wrapping) marked “needs verification” where not encoded in source.*
