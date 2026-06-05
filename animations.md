# Animation Documentation

> **Compiled from source inspection of:**
> - `daksh2k/Spicetify-stuff` (cloned from `https://github.com/daksh2k/Spicetify-stuff`, branch `master`)
> - `spicetify/cli` — `CustomApps/` subtree (cloned from `https://github.com/spicetify/cli`, branch `main`)

---

## Source Overview

### Repository 1 — `daksh2k/Spicetify-stuff`

The relevant sub-project is `Extensions/full-screen/`. It provides a Spotify fullscreen overlay with two display modes ("Default" and "TV"). Animation code is spread across:

- **SCSS files** (`src/styles/`) — CSS `@keyframes`, `transition`, `transform`, and pseudo-class hover effects.
- **`src/utils/animation.ts`** — Canvas-based `requestAnimationFrame` loops for background transitions and the animated rotating background.
- **`src/utils/background.ts`** — Orchestrates which animation function to call based on user settings.
- **`src/ui/components/UpNext/UpNext.ts`** — Slide-in/out and scrolling marquee logic for the "Up Next" banner.
- **`src/utils/utils.ts`** — Helper `fadeAnimation()` that adds/removes CSS classes to trigger keyframe animations on buttons.
- **`src/app.tsx`** — Calls `fadeAnimation()` for player-control state changes.

All other extensions (`auto-skip`, `volumePercentage`, `playNext`, `savePlaylists`) contain **no animation-related code**.

### Repository 2 — `spicetify/cli`, `CustomApps/`

Three custom apps were reviewed: `lyrics-plus`, `new-releases`, and `reddit`.

- **`lyrics-plus/`** — The main source of animation. Contains rich CSS and JS animations for synced lyrics scrolling, Karaoke word fill, blur effects, a loading spinner, a pause-indicator (idling circles), a background color transition, and config-button fade-in.
- **`new-releases/`** — One UI animation: a play-button that fades in and scales up on card hover.
- **`reddit/`** — One micro-interaction: a button that scales up (`scale(1.04)`) on hover. No dedicated `@keyframes` or `transition` blocks beyond that.

---

## Animation Index

| # | Animation Name | Source File | Trigger | Type | Summary |
|---|---|---|---|---|---|
| 1 | `fadeUp` | `full-screen/src/styles/base.scss` | CSS class `.fade-up` added by JS | CSS keyframe | Element fades in while translating upward 10 px |
| 2 | `fadeDo` | `full-screen/src/styles/base.scss` | CSS class `.fade-do` added by JS | CSS keyframe | Element fades in while translating downward 10 px |
| 3 | `fadeRi` | `full-screen/src/styles/base.scss` | CSS class `.fade-ri` added by JS | CSS keyframe | Element fades in while translating rightward 10 px |
| 4 | `fadeLe` | `full-screen/src/styles/base.scss` | CSS class `.fade-le` added by JS | CSS keyframe | Element fades in while translating leftward 10 px |
| 5 | `fs-button` hover scale | `full-screen/src/styles/base.scss` | CSS `:hover` | CSS transition + transform | Control buttons scale up 1.2× and saturate on hover |
| 6 | Fullscreen icon hover scale | `full-screen/src/styles/base.scss` | CSS `:hover` | CSS transition + transform | The activation icon in the playbar scales 1.08× on hover |
| 7 | Foreground / meta text transition | `full-screen/src/styles/base.scss`, `defaultMode.scss` | Song change or lyrics toggle (class change) | CSS transition | Album art, title, artist, album label, and progress bar reposition and resize smoothly |
| 8 | Lyrics container slide + collapse | `full-screen/src/styles/base.scss` | `.lyrics-unavailable` / `.lyrics-hide-force` class added | CSS transform (no explicit `transition` here; relies on `#fsd-foreground` parent transition) | Lyrics panel flies off-screen and collapses to near-zero via `translateX(1000px) scale3d(0.1, 0.1, 0.1) rotate(45deg)` |
| 9 | Context container transition | `full-screen/src/styles/base.scss` | Song change / show-hide logic | CSS transition (`1s ease-in-out`) | Context (playlist/album source info) fades and repositions over 1 s |
| 10 | Up-Next panel slide in/out | `full-screen/src/styles/base.scss` + `UpNext.ts` | Track nearing end, or track change | CSS transition (`0.75s ease-in-out`) + JS `transform` override | "Up Next" card slides in from the right (`translateX(750px → 0px)`) and back |
| 11 | `fsd_translate` marquee | `full-screen/src/styles/base.scss` + `UpNext.ts` | Text wider than container | CSS keyframe + JS `animation` string | Long song/artist names in the Up Next card scroll left and bounce back, indefinitely |
| 12 | `fsd_cssmarquee` | `full-screen/src/styles/base.scss` | (Defined but unused in current code — see Unclear Findings) | CSS keyframe | One-direction text scroll; pauses at 0% for first 18%, then scrolls to end |
| 13 | Canvas background cross-fade (`animateCanvas`) | `full-screen/src/utils/animation.ts` | Song change (album/artist art backgrounds) | JS `requestAnimationFrame` + Canvas alpha | Previous album/artist image fades out as new one fades in using a sine-eased alpha curve |
| 14 | Canvas color cross-fade (`animateColor`) | `full-screen/src/utils/animation.ts` | Song change (dynamic/static color backgrounds) | JS `requestAnimationFrame` + Canvas alpha | Previous background color rectangle fades out as new color fades in, sine-eased |
| 15 | Animated rotating canvas (`animatedRotatedCanvas`) | `full-screen/src/utils/animation.ts` | "Animated Album Art" background selected | JS `requestAnimationFrame` + Canvas rotate | Album art is drawn twice, rotating continuously around opposing origins — an Apple Music–like spinning effect |
| 16 | Queue panel transform | `full-screen/src/styles/base.scss` + `utils.ts` | Sidebar queue opened | CSS class `.fsd-transform-animation` + `transition: transform 0.4s ease-in-out` | Queue panel slides in from the right edge |
| 17 | Overview card show/hide | `full-screen/src/ui/components/OverviewPopup/styles.scss` | Visibility toggle / `.c-hidden` class | CSS transition (`0.8s ease-in-out`) + transform | Overview popup scales down and flies off to top (`scale(0.5) translateY(-300px)`) when hidden |
| 18 | Overview button hover scale | `full-screen/src/ui/components/OverviewPopup/styles.scss` | `:hover` | CSS transition + transform | Buttons inside the overview card scale to 1.1× |
| 19 | Volume bar height transition | `full-screen/src/ui/components/VolumeBar/styles.scss` | Volume level change | CSS transition (`0.1s`) | The inner fill of the vertical volume bar adjusts height smoothly |
| 20 | Volume bar slide in/out | `full-screen/src/ui/components/VolumeBar/styles.scss` | `.v-hidden` class toggle | CSS transition (`0.6s`) | Volume bar slides off-screen left and collapses (`translateX(-100px) scale(0.1)`) |
| 21 | Progress bar / volume bar thumb scale | `full-screen/src/ui/components/ProgressBar/styles.scss`, `VolumeBar/styles.scss` | `:hover` / `.dragging` | CSS transform (`scale(1.4)`, `scale(1.1)`) | Seek/volume thumb dot enlarges on drag |
| 22 | Settings slider toggle | `full-screen/src/styles/settings.scss` | `input:checked` state | CSS transition (`0.3s ease-in-out`) + `translateX(24px)` | Toggle switch thumb slides and changes colour when turned on/off |
| 23 | Settings button micro-transition | `full-screen/src/styles/settings.scss` | `:active` / click | CSS transition (`33ms cubic-bezier(0.3, 0, 0, 1)`) | Config panel buttons apply a very fast press feedback |
| 24 | SVG icon color transition | `full-screen/src/styles/base.scss` | Theme change / button state | CSS transition (`0.3s`) | SVG fills inside the foreground transition between colors |
| 25 | Background scale transform (animated mode) | `full-screen/src/styles/base.scss` | `animated_album` background mode | CSS `transform: scale(3, 3.5)` (static, not animated) | Canvas is zoomed out to fill the screen before rotation begins (applied as a layout transform, not a keyframe) |
| 26 | Synced lyrics line scroll + scale | `lyrics-plus/style.css` + `Pages.js` | Active lyric line changes (per song position) | CSS transition (`cubic-bezier(0, 0, 0.58, 1)`) + `transform: translateY + scale(1.1)` | Lines continuously restack; the active line scales to 1.1× and is highlighted |
| 27 | Synced lyrics blur effect | `lyrics-plus/style.css` | Blur enabled setting + active line position | CSS `filter: blur(...)` driven by `--blur-index` CSS var | Lines farther from the active line receive progressively more blur |
| 28 | Unsynced lyrics color transition | `lyrics-plus/style.css` | Active line changes | CSS transition (`0.25s cubic-bezier(0, 0, 0.58, 1)`) on `color` | Inactive lines transition their text color to active color when focused |
| 29 | Karaoke word fill | `lyrics-plus/style.css` + `Pages.js` | Real-time playback position within a word | CSS `transition` on `background-position` + `--word-duration` | A gradient sweep fills each word left-to-right in sync with its timed duration |
| 30 | Karaoke word fill — RTL | `lyrics-plus/style.css` + `Pages.js` | RTL text detected | Same as above, reversed gradient direction | Right-to-left sweep for Arabic/Hebrew etc. |
| 31 | Lyrics background color transition | `lyrics-plus/style.css` | Song/provider change | CSS transition (`0.25s ease-out`) on `background-color` | The lyrics background panel transitions between color values |
| 32 | Lyrics config button fade (FAD mode) | `lyrics-plus/style.css` | Hover over lyrics container (FAD mode) | CSS transition (`0.2s cubic-bezier(0, 0, 0.58, 1)`) on `opacity` | Config gear button fades from invisible to visible on hover |
| 33 | Idling indicator (pause circles) | `lyrics-plus/style.css` + `Pages.js` | Lyric pause gap detected | CSS transition on `transform` + `opacity`; `--indicator-delay` controls stagger | Three circles pulse in size/opacity in a staggered wave to indicate musical pauses |
| 34 | Loading spinner (ripple SVG) | `lyrics-plus/Pages.js` | Lyrics loading state | SVG `<animate>` elements (SMIL) | Two concentric circles expand from radius 0 to 40 and fade out, offset by 0.5 s, looping indefinitely |
| 35 | New-releases play button reveal | `new-releases/style.css` | Card `:hover` | CSS transition (`opacity 0.3s ease`) | Play/close button fades in from invisible when hovering a release card |
| 36 | New-releases close button scale | `new-releases/style.css` | `:hover` | CSS `transform: scale(1.1)` | Close button on release cards enlarges on hover |
| 37 | Reddit button hover scale | `reddit/style.css` | `:hover` | CSS `transform: scale(1.04)` + 33 ms transition | Action buttons scale up very slightly on hover |

---

## Detailed Animation Notes

---

### 1–4 — Directional Fade-In Keyframes (`fadeUp`, `fadeDo`, `fadeRi`, `fadeLe`)

**File:** `Extensions/full-screen/src/styles/base.scss`
**Selectors:** `.fade-up`, `.fade-do`, `.fade-ri`, `.fade-le`

```scss
@keyframes fadeUp {
    0%   { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeDo {
    0%   { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeRi {
    0%   { opacity: 0; transform: translateX(10px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes fadeLe {
    0%   { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
}

.fade-do { animation: fadeDo 0.5s cubic-bezier(0.3, 0, 0, 1); }
.fade-up { animation: fadeUp 0.5s cubic-bezier(0.3, 0, 0, 1); }
.fade-ri { animation: fadeRi 0.5s cubic-bezier(0.3, 0, 0, 1); }
.fade-le { animation: fadeLe 0.5s cubic-bezier(0.3, 0, 0, 1); }
```

**Visually:** An element slides in 10 px from the given direction while fading from transparent to fully opaque.

**Trigger:** Applied programmatically by `Utils.fadeAnimation()` in `src/utils/utils.ts`:

```typescript
static fadeAnimation(element: HTMLElement, animClass = "fade-do") {
    element.classList.remove(animClass);
    element.classList.add(animClass);
    setTimeout(() => element.classList.remove(animClass), 800);
}
```

Called in `app.tsx` for player controls on state change:
- Play/pause button → `fade-do` (default)
- Next track button → `fade-ri`
- Previous track button → `fade-le`
- Heart, shuffle, repeat, queue buttons → `fade-do`

**Duration:** 0.5 s | **Easing:** `cubic-bezier(0.3, 0, 0, 1)` | **Loop:** None (class removed after 800 ms)

---

### 5 — `.fs-button` Hover Scale + Saturate

**File:** `Extensions/full-screen/src/styles/base.scss`
**Selector:** `.fs-button:hover`

```scss
.fs-button {
    transition:
        all 0.3s var(--transition-function),
        transform 0.1s var(--transition-function);
    &:hover {
        transform: scale(1.2);
        filter: saturate(1.5) contrast(1.5) !important;
        background: var(--theme-hover-color);
    }
}
```

**Visually:** All fullscreen player control buttons scale to 120 % of their size and boost color saturation/contrast. A subtle background highlight fills in.

**Trigger:** CSS `:hover` pseudo-class.

**Duration:** `transform` — 0.1 s; other properties — 0.3 s | **Easing:** `var(--transition-function)` (defaults to `ease-in-out`) | **Variable dependency:** `--transition-function` set in `base.scss`

---

### 6 — Fullscreen Activation Icon Hover

**File:** `Extensions/full-screen/src/styles/base.scss`
**Selector:** `#fullscreen-default-button:hover`, `#fullscreen-tv-button:hover`

```scss
&:hover {
    transform: scale(1.08);
    color: var(--spice-text);
}
```

**Visually:** The small fullscreen and TV icons in Spotify's player bar scale up slightly on hover.

**Trigger:** CSS `:hover` | **Transition:** Inherits browser default (no explicit duration set here).

---

### 7 — Foreground / Song Meta Cross-Transition

**Files:** `Extensions/full-screen/src/styles/base.scss`, `defaultMode.scss`

```scss
#fsd-art,
#fsd-details,
#fsd-status,
#fsd-progress-parent {
    transition: all var(--transition-duration) var(--transition-function);
}
#fsd-title,
#fsd-artist,
#fsd-album {
    transition: all var(--transition-duration) var(--transition-function);
}
#fsd-foreground {
    transition: all var(--transition-duration) var(--transition-function);
}
```

**Default values:** `--transition-duration: 0.8s`, `--transition-function: ease-in-out`.

**Visually:** When lyrics become available or unavailable, the album art box, title, artist/album labels, and progress bar all smoothly reposition and resize. The foreground panel as a whole also translates horizontally to make room for lyrics.

**Trigger:** CSS class changes (`.lyrics-active`, `.lyrics-unavailable`, `.lyrics-hide-force`) applied by JS.

**Duration:** Configurable via `--transition-duration` (default 0.8 s). User-settable via `backAnimationTime` in Settings (affects `--fs-transition`).

---

### 8 — Lyrics Container Collapse/Exit

**File:** `Extensions/full-screen/src/styles/base.scss`
**Selector:** `#full-screen-display.lyrics-unavailable #fad-lyrics-plus-container`, `#full-screen-display.lyrics-hide-force #fad-lyrics-plus-container`

```scss
&.lyrics-unavailable,
&.lyrics-hide-force {
    #fad-lyrics-plus-container {
        transform: translateX(1000px) scale3d(0.1, 0.1, 0.1) rotate(45deg);
    }
}
```

The parent container has:
```scss
#fad-lyrics-plus-container {
    transition: transform var(--transition-duration) var(--transition-function);
}
```

**Visually:** When lyrics are unavailable or hidden, the entire lyrics panel is thrown off-screen to the right, shrunk to 10 % of its size, and rotated 45°.

**Trigger:** JS adds `.lyrics-unavailable` or `.lyrics-hide-force` to the root `#full-screen-display` element.

**Duration:** `var(--transition-duration)` (0.8 s default) | **Easing:** `ease-in-out`

---

### 9 — Context Container Fade / Transition

**File:** `Extensions/full-screen/src/styles/base.scss`
**Selector:** `#fsd-ctx-container`

```scss
#fsd-ctx-container {
    transition: all 1s ease-in-out;
    opacity: 1;
}
```

**Visually:** The context information box (showing the playlist or album from which the song is playing) transitions smoothly when shown or hidden.

**Trigger:** `opacity` and positional changes driven by JS on song change or mouse-move event. The `contextDisplay` setting controls whether it responds to `mousemove` or is always visible.

**Duration:** 1 s | **Easing:** `ease-in-out`

---

### 10 — Up Next Panel Slide In / Out

**File:** `Extensions/full-screen/src/styles/base.scss` (transition declaration) + `Extensions/full-screen/src/ui/components/UpNext/UpNext.ts` (JS control)

```scss
#fsd-upnext-container {
    transition: transform 0.75s ease-in-out;
    transform: translateX(750px); /* starts off-screen */
}
```

```typescript
// Show
DOM.fsd_myUp.style.transform = "translateX(0px)";
// Hide
DOM.fsd_myUp.style.transform = "translateX(750px)";
```

**Visually:** The "Up Next" card slides in from beyond the right edge of the screen and slides back out when hidden.

**Trigger (smart mode):** A `setTimeout` fires based on `upnextTimeToShow` (default: 30 s for Default mode, 45 s for TV mode). The panel appears when remaining play time falls below the threshold.

**Trigger (always mode):** Shows on every song change. Hides if repeat-one is active.

**Duration:** 0.75 s | **Easing:** `ease-in-out`

---

### 11 — Up Next Text Marquee (`fsd_translate`)

**File:** `Extensions/full-screen/src/styles/base.scss` + `Extensions/full-screen/src/ui/components/UpNext/UpNext.ts`

```scss
@keyframes fsd_translate {
    0%, 10% { transform: translateX(0%); }
    50%, 55% { transform: translateX(var(--translate_width_fsd)); }
    100%     { transform: translateX(0%); }
}
```

```typescript
// In UpNext.setupScrollingAnimation():
const animTime = Math.max(
    (DOM.fsd_first_span.offsetWidth - DOM.fsd_next_tit_art.offsetWidth - 2) / 0.035,
    1700,
);
DOM.fsd_myUp.style.setProperty(
    "--translate_width_fsd",
    `-${DOM.fsd_first_span.offsetWidth - DOM.fsd_next_tit_art.offsetWidth + 5}px`,
);
DOM.fsd_next_tit_art_inner.style.animation =
    `fsd_translate ${animTime}ms linear 800ms infinite`;
```

**Visually:** When song + artist text is too wide for the Up Next panel, the text scrolls left until the end of the text is visible, pauses at the midpoint (~5 % of duration), then scrolls back to the start. Loops indefinitely.

**Trigger:** Called when `DOM.fsd_second_span.offsetWidth > DOM.fsd_next_tit_art.offsetWidth - 2`.

**Duration:** Calculated dynamically — minimum 1700 ms. At 0.035 px/ms this means ~1 px per frame at 30 fps. | **Delay:** 800 ms before starting | **Loop:** `infinite` | **Easing:** `linear`

---

### 12 — `fsd_cssmarquee` (Defined, Possibly Unused)

**File:** `Extensions/full-screen/src/styles/base.scss`

```scss
@keyframes fsd_cssmarquee {
    0%   { transform: translateX(0%); }
    18%  { transform: translateX(0%); }
    100% { transform: translateX(var(--translate_width_fsd)); }
}
```

**Visually:** One-direction scroll: holds at start for 18 % of duration, then scrolls to the end position.

**Status:** The keyframe is defined in SCSS but no reference to `fsd_cssmarquee` was found in `.ts` or `.tsx` files. It may be a legacy or draft animation. See **Unclear Findings #1**.

---

### 13 — Canvas Background Cross-Fade (`animateCanvas`)

**File:** `Extensions/full-screen/src/utils/animation.ts`

```typescript
export function animateCanvas(
    prevImg: HTMLImageElement,
    nextImg: HTMLImageElement,
    back: HTMLCanvasElement,
    fromResize = false,
) {
    const animate = (timestamp: number) => {
        const factor = Math.min(elapsed / (configTransitionTime * 1000), 1.0);
        ctx.globalAlpha = 1;
        ctx.drawImage(prevImg, x, y, sizeX, sizeY);         // draw previous at full alpha
        ctx.globalAlpha = Math.sin((Math.PI / 2) * factor); // ease new image in
        ctx.drawImage(nextImg, x, y, sizeX, sizeY);
        if (factor === 1.0) done = true;
        !done && requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
}
```

**Visually:** The album art (or artist art) background cross-dissolves from the previous image to the new image using a sine-eased `globalAlpha` ramp. Blur and brightness are pre-applied via `ctx.filter`.

**Trigger:** Called from `Background.updateBackground()` on song change when `backgroundChoice` is `"album_art"` or `"artist_art"`.

**Duration:** Controlled by user setting `backAnimationTime` (default: 1 s in Default mode, 0.4 s in TV mode). | **Easing:** `Math.sin((Math.PI/2) * factor)` — equivalent to `ease-out`

**Configuration dependencies:**
- `CFM.get("backAnimationTime")` — transition length
- `CFM.get("blurSize")` — applied as canvas filter blur
- `CFM.get("backgroundBrightness")` — applied as canvas filter brightness

---

### 14 — Canvas Color Cross-Fade (`animateColor`)

**File:** `Extensions/full-screen/src/utils/animation.ts`

Identical structure to `animateCanvas` but draws solid color rectangles instead of images.

**Visually:** The background color dissolves from the previous color to the next using the same sine-eased alpha curve.

**Trigger:** Called from `Background.updateBackground()` when `backgroundChoice` is `"dynamic_color"` (color extracted from album art) or `"static_color"` (user-selected hex).

**Duration / Easing:** Same as `animateCanvas`.

---

### 15 — Animated Rotating Canvas (`animatedRotatedCanvas`)

**File:** `Extensions/full-screen/src/utils/animation.ts`

```typescript
export function animatedRotatedCanvas(back: HTMLCanvasElement, bgImg: HTMLImageElement) {
    ctx.filter = `saturate(2) brightness(${brightness}) blur(${blur}px)`;
    function draw() {
        ctx.save();
        ctx.translate(0, 0);
        ctx.rotate(((2 * Math.PI) / 360) * rotationAngle);
        ctx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();

        ctx.save();
        ctx.translate(back.width / 2, 0);
        ctx.rotate(((2 * Math.PI) / 360) * rotationAngle + Math.PI);
        ctx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();

        rotationAngle += rotationSpeed;
        if (isAnimationRunning) requestAnimationFrame(draw);
    }
    isAnimationRunning = true;
    draw();
}
```

**Visually:** The album art is drawn twice on the canvas — one copy rotating from the top-left origin, one copy rotated 180° from the horizontal midpoint — creating a continuously spinning, dream-like blurred and saturated background, similar to the Apple Music animated artwork effect.

**Trigger:** `backgroundChoice === "animated_album"`, set by user.

**Speed:** Controlled by `rotationSpeed` (default `0.25` degrees per frame). User-configurable via `animationSpeed` setting. Independently settable down to near-zero.

**Loop:** Runs indefinitely (`requestAnimationFrame`) while `isAnimationRunning === true`. Stopped when `modifyIsAnimationRunning(false)` is called on mode switch or deactivation.

**Filter:** `saturate(2) brightness(max 0.7) blur(min 28 px)`.

**Note:** Two additional variant functions exist in the same file: `animatedRotatedCanvasV2` (frame-rate-limited to 30 fps to reduce CPU load) and `animatedRotatedCanvasOptimized` (uses an offscreen canvas). Both are present in the source but not called from `background.ts`; only `animatedRotatedCanvas` is actively used. See **Unclear Findings #2**.

---

### 16 — Queue Panel Slide Transition

**File:** `Extensions/full-screen/src/styles/base.scss` + `src/utils/utils.ts`

```scss
.fsd-transform-animation {
    transition: transform 0.4s ease-in-out;
}
.fsd-queue-panel {
    --queue-panel-x: 1000px;
    transform: translateX(var(--queue-panel-x));
}
```

```typescript
// In Utils.toggleQueuePanel():
rightPanel?.classList.add("fsd-transform-animation");
// ... then later:
rightPanel?.classList.remove("fsd-queue-panel", "fsd-transform-animation");
```

**Visually:** The sidebar queue panel slides in from off-screen right.

**Trigger:** User opens the queue sidebar while in fullscreen mode.

**Duration:** 0.4 s | **Easing:** `ease-in-out`

---

### 17 — Overview Card Show / Hide

**File:** `Extensions/full-screen/src/ui/components/OverviewPopup/styles.scss`

```scss
#fsd-overview-card {
    transition: all 0.8s ease-in-out;
    transform: translateX(-50%) scale(1) translateY(0px);

    &.c-hidden {
        transform: translateX(-50%) scale(0.5) translateY(-300px);
    }
    &:hover {
        transform: translateX(-50%) scale(1) translateY(0px);
        background-color: rgba(0, 0, 0, 0.2);
    }
}
```

**Visually:** The clock/overview popup in the top center scales down to 50 % and flies 300 px upward (out of view) when hidden. Re-hovering the area causes it to animate back.

**Trigger:** `.c-hidden` class toggled by JS. Hover re-shows it.

**Duration:** 0.8 s | **Easing:** `ease-in-out`

---

### 18 — Overview Button Hover Scale

**File:** `Extensions/full-screen/src/ui/components/OverviewPopup/styles.scss`

```scss
.fsd-overview-button {
    transition:
        all 0.3s var(--transition-function),
        transform 0.1s var(--transition-function);
    &:hover {
        transform: scale(1.1);
        background: rgba(0, 0, 0, 0.5);
    }
}
```

**Visually:** Buttons inside the overview card (e.g. lock/close icons) scale to 1.1× and darken on hover.

**Duration:** `transform` — 0.1 s | **Easing:** `var(--transition-function)`

---

### 19 — Volume Bar Fill Height Transition

**File:** `Extensions/full-screen/src/ui/components/VolumeBar/styles.scss`

```scss
#fsd-volume-bar-inner {
    transition: height 0.1s var(--transition-function);
}
```

**Visually:** The filled portion of the vertical volume bar smoothly grows or shrinks as the user changes volume.

**Duration:** 0.1 s | **Easing:** `var(--transition-function)`

---

### 20 — Volume Bar Slide In / Out

**File:** `Extensions/full-screen/src/ui/components/VolumeBar/styles.scss`

```scss
#fsd-volume-container {
    transition: transform 0.6s var(--transition-function);
    &.v-hidden {
        transform: translateX(-100px) scale(0.1);
    }
    &.dragging, &:hover {
        transform: translateX(0px) scale(1);
    }
}
```

**Visually:** The left-side vertical volume bar slides off-screen left and shrinks when hidden. It slides back in on hover or drag.

**Trigger:** `.v-hidden` class set by JS based on `volumeDisplay` setting (`"smart"` auto-hides it when not in use).

**Duration:** 0.6 s | **Easing:** `var(--transition-function)`

---

### 21 — Progress / Volume Thumb Drag Scale

**Files:** `ProgressBar/styles.scss`, `VolumeBar/styles.scss`

```scss
/* Progress bar */
&.dragging #progress-thumb { transform: scale(1.4); }
/* Volume bar */
&.dragging #volume-thumb   { transform: scale(1.1); }
```

**Visually:** The circular thumb indicator on both the seek bar and the volume bar enlarges while being dragged, giving tactile feedback.

**Trigger:** `.dragging` class added by JS on `mousedown`.

---

### 22 — Settings Toggle Slider

**File:** `Extensions/full-screen/src/styles/settings.scss`

```scss
.slider {
    transition: all 0.3s ease-in-out;
}
.slider:before {
    transition: all 0.3s ease-in-out;
}
input:checked + .slider:before {
    transform: translateX(24px);
    background-color: var(--theme-color);
    filter: brightness(1.1) saturate(1.2);
}
```

**Visually:** The settings panel toggle switches: the thumb slides 24 px to the right and turns the theme accent color when enabled.

**Trigger:** `input:checked` state.

**Duration:** 0.3 s | **Easing:** `ease-in-out`

---

### 23 — Settings Button Press Feedback

**File:** `Extensions/full-screen/src/styles/settings.scss`

```scss
.main-buttons-button {
    -webkit-transition: all 33ms cubic-bezier(0.3, 0, 0, 1);
    transition: all 33ms cubic-bezier(0.3, 0, 0, 1);
    will-change: transform;
}
```

**Visually:** Config panel primary/secondary buttons respond near-instantly (33 ms) to interactions, following Spotify's native micro-interaction pattern.

**Duration:** 33 ms | **Easing:** `cubic-bezier(0.3, 0, 0, 1)`

---

### 24 — SVG Icon Color Transition

**File:** `Extensions/full-screen/src/styles/base.scss`

```scss
#fsd-foreground svg {
    fill: var(--primary-color);
    transition: all 0.3s var(--transition-function);
}
#fsd-title svg,
#fsd-artist svg,
#fsd-album svg {
    transition: all var(--transition-duration) var(--transition-function);
}
```

**Visually:** All SVG icon fills inside the fullscreen foreground smoothly transition when the theme color or main color changes (e.g. on song change, invert-color toggle).

**Duration:** `0.3s` for most icons; `var(--transition-duration)` (0.8 s) for song-meta icons.

---

### 25 — Animated Background Scale (Layout Pre-transform)

**File:** `Extensions/full-screen/src/styles/base.scss`

```scss
#fsd-background.animated {
    transform: scale(3, 3.5);
    transform-origin: left top;
}
```

**Visually:** When the animated background mode is active, the canvas element is pre-scaled to 3× horizontally and 3.5× vertically from the top-left. This fills the visible area with the spinning art despite the rotation revealing canvas edges.

**Trigger:** The class `animated` is toggled on `#fsd-background` by `Background.updateBackground()` when `backgroundChoice === "animated_album"`. This is a static layout transform, not a CSS animation.

---

### 26 — Synced Lyrics Line Scroll and Active Scale

**File:** `CustomApps/lyrics-plus/style.css` + `CustomApps/lyrics-plus/Pages.js`

```css
.lyrics-lyricsContainer-SyncedLyrics .lyrics-lyricsContainer-LyricsLine {
    transform: translateY(calc(var(--position-index) * var(--lyrics-line-height) + var(--offset)));
    transform-origin: var(--lyrics-align-text);
    transition-timing-function: cubic-bezier(0, 0, 0.58, 1);
    transition-duration: calc(var(--animation-index) * var(--animation-tempo) + 0.1s);
    transition-property: transform, color, opacity;
}

.lyrics-lyricsContainer-LyricsLine.lyrics-lyricsContainer-LyricsLine-active {
    transform: translateY(...) scale(1.1);
    color: var(--lyrics-color-active);
    opacity: 1;
    filter: none !important;
}
```

CSS variables injected via React in `Pages.js`:
```javascript
"--position-index": animationIndex,   // integer: negative = above active, positive = below
"--animation-index": (animationIndex < 0 ? 0 : animationIndex) + 1,
"--blur-index": Math.abs(animationIndex),
```

**Visually:** All lyric lines are stacked absolutely and continuously shift their vertical position via `translateY`. The active line scales up to 1.1× and becomes fully opaque and coloured. Lines transition with a staggered duration — lines farther from the active position take longer to settle.

**Trigger:** `Spicetify.Player.getProgress()` is polled (via `useTrackPosition`); the active line index is computed and React re-renders.

**Duration:** `calc(var(--animation-index) * var(--animation-tempo) + 0.1s)` — e.g. at default `animationTempo: 0.2s`, the line two positions below the active has duration `2 * 0.2 + 0.1 = 0.5 s`. | **Easing:** `cubic-bezier(0, 0, 0.58, 1)`

---

### 27 — Synced Lyrics Blur Effect

**File:** `CustomApps/lyrics-plus/style.css`

```css
.lyrics-lyricsContainer-LyricsContainer.blur-enabled
    .lyrics-lyricsContainer-SyncedLyrics
    .lyrics-lyricsContainer-LyricsLine {
    filter: blur(calc(var(--blur-index) * 1.5px));
}
```

**Visually:** When the blur setting is enabled, lines progressively blur as they move away from the active line. The active line itself has `filter: none !important`, so it remains sharp.

**Trigger:** `blur-enabled` class on the container; `--blur-index` = `Math.abs(animationIndex)` from JS.

---

### 28 — Unsynced Lyrics Line Color Transition

**File:** `CustomApps/lyrics-plus/style.css`

```css
.lyrics-lyricsContainer-UnsyncedLyricsPage .lyrics-lyricsContainer-LyricsLine {
    color: var(--lyrics-color-inactive);
    transition: color 0.25s cubic-bezier(0, 0, 0.58, 1);
}
.lyrics-lyricsContainer-UnsyncedLyricsPage .lyrics-lyricsContainer-LyricsLine-active {
    color: var(--lyrics-color-active);
}
```

**Visually:** In plain (unsynced) lyric mode, the active/focused line transitions its text colour from inactive to active. Hover also triggers the color change.

**Duration:** 0.25 s | **Easing:** `cubic-bezier(0, 0, 0.58, 1)`

---

### 29–30 — Karaoke Word Fill (LTR and RTL)

**File:** `CustomApps/lyrics-plus/style.css` + `CustomApps/lyrics-plus/Pages.js`

```css
.lyrics-lyricsContainer-Karaoke-Word {
    background-image: linear-gradient(
        to right,
        var(--lyrics-color-active),
        var(--lyrics-color-active) 45%,
        var(--lyrics-color-inactive) 55%,
        var(--lyrics-color-inactive)
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 225% 100%;
    background-position: top left 100%;     /* starts fully inactive */
    transition-property: color, background-position;
    transition-duration: calc(var(--word-duration) + 0.05s);
    transition-timing-function: linear;
}

.lyrics-lyricsContainer-Karaoke-WordActive {
    background-position: top left !important; /* sweeps to fully active */
}
```

```javascript
// In Pages.js KaraokeLine renderer:
style: {
    "--word-duration": `${time}ms`,
    transition: !isWordActive || isWordComplete ? "all 0s linear" : "",
}
```

**Visually:** Each word in a karaoke line has a gradient of active-color → inactive-color. As the playback position reaches the word's timestamp, the `background-position` transitions from 100% (fully inactive) to 0% (fully active), creating a left-to-right "fill" that sweeps in sync with the music.

**RTL variant:** The gradient is reversed (`to left`) and `background-position` goes `top right 100% → top right`.

**Timing:** Each word's `--word-duration` is set to its exact duration from the lyrics timestamp data + 50 ms buffer. | **Easing:** `linear`

**Optimization:** When a word is not yet active or already complete, `transition` is set to `"all 0s linear"` to suppress the animation.

---

### 31 — Lyrics Background Color Transition

**File:** `CustomApps/lyrics-plus/style.css`

```css
.lyrics-lyricsContainer-LyricsBackground {
    background-color: var(--lyrics-color-background);
    transition: background-color 0.25s ease-out;
}
```

**Visually:** The lyrics page background panel fades to its new color over 0.25 s when the song changes.

**Duration:** 0.25 s | **Easing:** `ease-out`

---

### 32 — Lyrics Config Button Fade (FAD / Full-Screen Mode)

**File:** `CustomApps/lyrics-plus/style.css`

```css
.lyrics-lyricsContainer-LyricsContainer.fad-enabled .lyrics-config-button-container {
    opacity: 0;
    transition: opacity 0.2s cubic-bezier(0, 0, 0.58, 1);
}
.lyrics-lyricsContainer-LyricsContainer.fad-enabled:hover .lyrics-config-button-container {
    opacity: 1;
}
```

**Visually:** In the FAD (fullscreen display) integration mode, the small config gear button is invisible. It fades in when the user hovers over the lyrics area.

**Duration:** 0.2 s | **Easing:** `cubic-bezier(0, 0, 0.58, 1)`

---

### 33 — Idling / Pause Indicator (Animated Circles)

**File:** `CustomApps/lyrics-plus/style.css` + `CustomApps/lyrics-plus/Pages.js`

```css
.lyrics-idling-indicator__circle {
    opacity: 0.5;
    transform: scale(0.5);
    transition-timing-function: linear;
    transition-duration: var(--indicator-delay);
    transition-property: transform, opacity;
}
.lyrics-idling-indicator__circle.active {
    opacity: 1;
    transform: scale(0.7);
}
.lyrics-idling-indicator {
    opacity: 1;
    transition: opacity 0.2s cubic-bezier(0, 0, 0.58, 1);
}
.lyrics-idling-indicator-hidden {
    opacity: 0;
}
```

```javascript
// In Pages.js getPauseIndicator():
react.createElement("div", {
    className: `lyrics-idling-indicator__circle ${progress >= 0.05 ? "active" : ""}`,
}),
react.createElement("div", {
    className: `lyrics-idling-indicator__circle ${progress >= 0.33 ? "active" : ""}`,
}),
react.createElement("div", {
    className: `lyrics-idling-indicator__circle ${progress >= 0.66 ? "active" : ""}`,
})
```

**Visually:** During a lyric pause (a gap between lyric lines), three small circles appear in place of the lyric text. They progressively pulse from `scale(0.5), opacity 0.5` to `scale(0.7), opacity 1` as time advances through the gap, creating a left-to-right wave that indicates how far through the pause the playback is.

**Trigger:** A pause line in the lyrics data; `isPause` is `true` in `SyncedLyricsPage`.

**Duration:** `--indicator-delay` (derived from timing data) | **Easing:** `linear`

---

### 34 — Loading Spinner (Ripple SVG)

**File:** `CustomApps/lyrics-plus/Pages.js` (inline SVG with SMIL `<animate>` elements)

```javascript
react.createElement("circle", { cx: "50", cy: "50", r: "0", ... },
    react.createElement("animate", {
        attributeName: "r",
        repeatCount: "indefinite",
        dur: "1s",
        values: "0;40",
        keyTimes: "0;1",
        keySplines: "0 0.2 0.8 1",
        calcMode: "spline",
        begin: "0s",
    }),
    react.createElement("animate", {
        attributeName: "opacity",
        repeatCount: "indefinite",
        dur: "1s",
        values: "1;0",
        keyTimes: "0;1",
        keySplines: "0.2 0 0.8 1",
        calcMode: "spline",
        begin: "0s",
    })
),
// Second circle with begin: "-0.5s" (offset by half)
```

**Visually:** A classic ripple / pulsing ring loader: two concentric circles each expand from radius 0 to 40 and simultaneously fade from fully opaque to transparent. The second circle starts 0.5 s ahead, so they are always staggered — one ring is always mid-animation, giving a continuous ripple.

**Trigger:** Shown while lyrics are being fetched (loading state).

**Duration:** 1 s per cycle | **Loop:** `repeatCount="indefinite"` | **Easing:** `calcMode="spline"` with custom keysplines | **Implementation:** SMIL (SVG native animation), not CSS

---

### 35 — New Releases: Play Button Fade-In on Card Hover

**File:** `CustomApps/new-releases/style.css`

```css
.main-card-closeButton {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s, opacity 0.3s ease;
}
.main-card-card:hover .main-card-closeButton {
    visibility: visible;
    opacity: 1;
    transition: visibility 0s, opacity 0.3s ease;
}
```

**Visually:** The play / close button on each release card is invisible until the card is hovered, at which point it fades in over 0.3 s.

**Duration:** 0.3 s | **Easing:** `ease`

---

### 36 — New Releases: Close Button Scale on Hover

**File:** `CustomApps/new-releases/style.css`

```css
.main-card-closeButton:hover {
    transform: scale(1.1);
}
.main-card-closeButton:active {
    transform: scale(1) !important;
}
```

**Visually:** The close button on release cards scales up 1.1× on hover and snaps back to 1× on click. No explicit `transition` declared for the transform here (may inherit or rely on browser default).

---

### 37 — Reddit: Button Hover Scale

**File:** `CustomApps/reddit/style.css`

```css
.col.action .btn:hover {
    transform: scale(1.04);
    border-color: var(--spice-text);
}
```

Transition block:
```css
transition-duration: 33ms;
transition-property: background-color, border-color, color, box-shadow, filter, transform;
```

**Visually:** Action buttons in the Reddit app's settings/option rows scale up 1.04× and get a full-text-color border on hover.

**Duration:** 33 ms | **Easing:** Browser default (not specified)

---

## Unclear or Ambiguous Findings

### 1 — `fsd_cssmarquee` Keyframe Is Defined But Not Referenced

**File:** `Extensions/full-screen/src/styles/base.scss`

The `@keyframes fsd_cssmarquee` block is defined alongside `fsd_translate`, but a grep of all `.ts`, `.tsx`, and `.js` files in the repository found no reference to the string `fsd_cssmarquee`. The similar `fsd_translate` is actively used in `UpNext.ts`. This keyframe may be legacy code from an earlier one-direction scroll approach, or may have been intended for a Spotify-native marquee element override. **Cannot confirm it produces any visible animation in the current build.**

---

### 2 — `animatedRotatedCanvasV2` and `animatedRotatedCanvasOptimized`

**File:** `Extensions/full-screen/src/utils/animation.ts`

Two additional variants of the rotating background animation exist: `animatedRotatedCanvasV2` (frame-rate-capped at 30 fps) and `animatedRotatedCanvasOptimized` (uses an offscreen canvas). Both are exported but neither is imported in `background.ts` — only `animatedRotatedCanvas` is called there. Developer comments in the file (`// TODO: fix flickering`, `// TODO Test this`) confirm they are experimental and not production-active. **Cannot confirm they produce visible output under normal use.**

---

### 3 — `--animation-tempo` vs `animationTempo` Setting in Lyrics-Plus / FAD Integration

**File:** `Extensions/full-screen/src/styles/base.scss`

Inside `#fad-lyrics-plus-container`:
```scss
--animation-tempo: 0.2s !important;
```

This overrides the `--animation-tempo` CSS variable used by the `lyrics-plus` app (animation 26). When FAD (fullscreen display) mode is active, the tempo is hard-coded to `0.2s` regardless of the Lyrics Plus setting. The FAD default value for `animationTempo` is also `0.2` in `defaults.ts`. It is unclear whether the `!important` override is ever meaningfully different from the user's Lyrics Plus setting, since both default to the same value. This could suppress user customization from within Lyrics Plus when FAD is active, but this cannot be fully confirmed from static analysis alone.

---

### 4 — New Releases `main-card-closeButton` Scale Has No Explicit `transition` for `transform`

**File:** `CustomApps/new-releases/style.css`

The `transition` property on `.main-card-closeButton` covers `visibility` and `opacity` but not `transform`. The hover `scale(1.1)` may be instantaneous or may rely on a browser default. The `:active` reset to `scale(1)` has `!important`, suggesting a potential specificity conflict was anticipated. **Cannot confirm this transition is smooth without runtime testing.**

---

## Files Reviewed

### `daksh2k/Spicetify-stuff`

| File | Relevant Content |
|---|---|
| `Extensions/full-screen/src/styles/base.scss` | All major keyframes, transitions, transforms for the fullscreen overlay |
| `Extensions/full-screen/src/styles/defaultMode.scss` | Responsive layout transitions for Default mode |
| `Extensions/full-screen/src/styles/tvMode.scss` | TV mode layout (no additional animations beyond base) |
| `Extensions/full-screen/src/styles/settings.scss` | Toggle slider and button micro-interactions |
| `Extensions/full-screen/src/styles/alternate-tv/alternate.scss` | Alternate TV layout CSS (references `fs-button` transitions) |
| `Extensions/full-screen/src/ui/components/OverviewPopup/styles.scss` | Overview card show/hide and button hover |
| `Extensions/full-screen/src/ui/components/ProgressBar/styles.scss` | Progress bar thumb scale |
| `Extensions/full-screen/src/ui/components/VolumeBar/styles.scss` | Volume bar fill, slide-in/out, thumb scale |
| `Extensions/full-screen/src/utils/animation.ts` | `animateCanvas`, `animateColor`, `animatedRotatedCanvas` (and two unused variants) |
| `Extensions/full-screen/src/utils/background.ts` | Background type selector; calls animation functions |
| `Extensions/full-screen/src/utils/utils.ts` | `fadeAnimation()` helper |
| `Extensions/full-screen/src/ui/components/UpNext/UpNext.ts` | Up Next slide in/out; scrolling marquee setup |
| `Extensions/full-screen/src/app.tsx` | Calls `fadeAnimation()` for player controls |
| `Extensions/full-screen/src/constants/defaults.ts` | Default values for animation timing settings |
| `Extensions/auto-skip/src/app.js` | No animation code |
| `Extensions/volumePercentage.js` | No animation code |
| `Extensions/playNext.js` | No animation code |
| `Extensions/savePlaylists.js` | No animation code |
| `Themes/Better/user.css` | No keyframe or transition animations |
| `Themes/drib-custom.css` | No keyframe or transition animations |

### `spicetify/cli` — `CustomApps/`

| File | Relevant Content |
|---|---|
| `CustomApps/lyrics-plus/style.css` | Synced line scroll/scale, blur, unsynced color, Karaoke fill, background color, config fade, idling indicator, `@keyframes spin` (unused?) |
| `CustomApps/lyrics-plus/Pages.js` | Karaoke word timing, `--animation-index` / `--blur-index` / `--position-index` injection, idling indicator progress, SVG ripple spinner |
| `CustomApps/lyrics-plus/index.js` | No additional animation code |
| `CustomApps/lyrics-plus/OptionsMenu.js` | No animation code |
| `CustomApps/lyrics-plus/Settings.js` | No animation code |
| `CustomApps/lyrics-plus/TabBar.js` | No animation code |
| `CustomApps/lyrics-plus/Utils.js` | No animation code |
| `CustomApps/lyrics-plus/Providers.js` | No animation code |
| `CustomApps/new-releases/style.css` | Play/close button fade-in and scale hover |
| `CustomApps/new-releases/Card.js` | No additional animation code |
| `CustomApps/reddit/style.css` | Button hover scale micro-interaction |
| `CustomApps/reddit/Card.js` | No additional animation code |

---

*Document generated by static source inspection. All code references are from the `master`/`main` branch at time of cloning (May 2026). Runtime behavior, especially timing of JS-driven animations, may vary with browser performance and user configuration.*
