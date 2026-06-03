# Figma Design Token Audit — NewJeans Stem Player (Mock-up 2)

**Source file:** [NewJeans Stem Player (Mock-up 2)](https://www.figma.com/design/gTWpAWp0lSWVlTCNIoqfP3/NewJeans-Stem-Player--Mock-up-2-?node-id=1-58&t=phPdKRRF4s0L7c3r-1)  
**Primary frame audited:** `Stem Player` (`node-id=1:58`, 1920×1080)  
**Audit date:** 2026-05-18 (updated with Variables panel + gradient/stroke/shadow confirmations)  
**Methods:** Figma Desktop MCP + **Variables panel screenshots** (Primitives & Tokens collections). No application code was changed as part of this audit.

---

## Stakeholder confirmations

| Question | Answer | Status |
|----------|--------|--------|
| Does Mock-up 2 replace the older README Figma link? | **Yes** | **Confirmed** |
| Gradient direction | **Vertical** for all gradient fills | **Confirmed** |
| Gradient stop convention | **0% → 100%** (top → bottom) | **Confirmed** |
| `Gray Light` opacity | **On the variable** (not layer override) | **Confirmed** |
| Pop shadow color | **`stroke-primary`** token | **Confirmed** |
| `Blue Grandient` style name | Renamed **`Blue Gradient`** | **Confirmed** |
| `stem-solo-primary` / `stem-mute-primary` in dev | **Yes** — replace current green/red | **Confirmed** |
| Pop shadow offset (4×) | **`sp-4`** for X and Y offset | **Confirmed** |
| Pop shadow offset (2×) | **`sp-2`** for X and Y offset | **Confirmed** |
| Pop shadow **2×** usage | **Meters label** only | **Confirmed** |
| Pop shadow **4×** usage | **All other** shadowed UI | **Confirmed** |
| `Blue Gradient` style count | **One** style in the file | **Confirmed** |
| Typography in variables | **Unsure** — approach TBD | **Open** |
| Font licensing | **All fonts licensed** | **Confirmed** |
| Variable modes (Light/Dark, etc.) | Single value column only in panel | **Confirmed: no modes** |

**README note:** `README.md` still links to the legacy file (`1i4CLZvhwh8n1aZinX0hT5`). Update that link to Mock-up 2 when implementation begins.

---

## Overview

Mock-up 2 uses a **two-collection variable architecture** in Figma:

| Collection | Variable count | Groups | Role |
|------------|----------------|--------|------|
| **Primitives** | 21 | `Spacing` (8), `Stroke` (2), `Colors` (11) | Raw numbers and hex values |
| **Tokens** | 21 | `Color` (21) | Semantic aliases → `Colors/*` primitives |

**Modes:** The Variables panel shows **one value column** for both collections. **No Light/Dark, Desktop/Mobile, or other modes are defined.**

**Typography:** Not in variables today. Stakeholder is **unsure how to model type in variables** — **recommended for v1:** keep **Figma text styles** + a written type spec in code (see [Typography](#typography-system)). **All fonts are licensed** for product use.

**Gradients:** Not stored as variables. Fills use **gradient styles** — **vertical**, **0% → 100%** — binding **semantic color tokens** at each stop (see [Gradients](#gradients-fill-styles-not-variables)).

**Effects / shadows:** Two **pop shadow** effect styles — **color** = `stroke-primary`; **offset** tied to spacing primitives (**4×** → `sp-4`, **2×** → `sp-2`). Border widths use **`st-1`** / **`st-2`**.

**Codebase:** `tailwind.config.js` uses legacy `nj-*` colors; alignment to Mock-up 2 tokens is a **future implementation task**, not started here.

---

## Token Architecture Summary

### Hierarchy (confirmed)

```
Primitives (collection)
├── Spacing group
│   sp-2, sp-4 … sp-48, cr-16                       → raw numbers (px inferred)
├── Stroke group
│   st-1, st-2                                      → border width (1, 2 px inferred)
└── Colors group
    Black, White, Gray, Gray Light (with opacity), …  → raw hex / alpha on variable

Tokens (collection)
└── Color group
    stroke-primary, text-primary, bg-primary, …      → alias → Colors/{Name}
```

### How primitives map to semantic tokens

**Confirmed:** Every token in the **Tokens → Color** group displays a **link icon** and resolves to `Colors/{PrimitiveName}` in the Variables panel.

**Dev Mode / MCP naming:** Exports may prefix semantic tokens as `Color/{name}` (e.g. `Color/text-primary`). In the Variables panel UI, names appear **without** the `Color/` prefix inside the **Tokens** collection’s **Color** group.

### Scaling across components and themes

- **Components** bind to **Tokens** (semantic), not raw primitives, for colors.
- **Spacing** binds to **Primitives → Spacing** (`sp-*`, `cr-*`).
- **Border width** binds to **Primitives → Stroke** (`st-1`, `st-2`).
- **Shadow offset** binds to **Primitives → Spacing** (`sp-4` for 4× pop shadow, `sp-2` for 2×).
- **Themes:** Single default mode only. Adding dark mode would require **new mode columns** on both collections and duplicated semantic values.
- **Layout:** One desktop artboard (1920×1080); no responsive variable sets.

---

## Variable Collections

### Collection 1: Primitives (21 variables)

#### Group: Spacing (8) — **Confirmed**

| Variable name | Value | Inferred unit |
|---------------|-------|----------------|
| `sp-2` | 2 | px |
| `sp-4` | 4 | px |
| `sp-8` | 8 | px |
| `sp-16` | 16 | px |
| `sp-24` | 24 | px |
| `sp-32` | 32 | px |
| `sp-48` | 48 | px |
| `cr-16` | 16 | px (corner radius) |

**Naming:** `sp-*` = spacing; `cr-*` = corner radius.

#### Group: Stroke (2) — **Confirmed**

| Variable name | Value | Inferred usage |
|---------------|-------|----------------|
| `st-1` | 1 | 1px borders (e.g. volume box) |
| `st-2` | 2 | 2px borders (cards, stem tracks, lyrics shell) |

**Naming:** `st-*` = stroke width.

#### Group: Colors (11) — **Confirmed**

| Variable name | Hex | Notes |
|---------------|-----|--------|
| `Black` | `#000000` | |
| `White` | `#FFFFFF` | |
| `Gray` | `#999999` | |
| `Red` | `#F13600` | Stem mute accent |
| `Green` | `#58FE33` | Stem solo accent |
| `Yellow` | `#FFFF26` | Stem track fill |
| `Green Light` | `#91E53E` | Language selected gradient end |
| `Blue` | `#A1CAFE` | Member lyric pill gradient end |
| `Blue Light` | `#C2E4FD` | Page gradient start (`bg-secondary`) |
| `Blue Dark` | `#01ACFE` | Page gradient end (`bg-primary`) |
| `Gray Light` | `#B3B3B3` at **20% opacity on the variable** | `stem-waveform-container` |

**Confirmed:** Opacity is defined **on the primitive/color variable**, not as a separate layer override.

---

### Collection 2: Tokens (21 variables)

#### Group: Color (21) — **Confirmed** (all alias → `Colors/*`)

| Token name (panel) | Aliases to | Resolved hex |
|--------------------|------------|--------------|
| `stroke-primary` | `Colors/Black` | `#000000` |
| `main-container-primary` | `Colors/White` | `#FFFFFF` |
| `text-primary` | `Colors/Black` | `#000000` |
| `text-secondary` | `Colors/Gray` | `#999999` |
| `text-inverse` | `Colors/White` | `#FFFFFF` |
| `stem-container-primary` | `Colors/Yellow` | `#FFFF26` |
| `stem-container-secondary` | `Colors/White` | `#FFFFFF` |
| `stem-waveform-container` | `Colors/Gray Light` | `#B3B3B3` @ **20%** (opacity on variable) |
| `bg-primary` | `Colors/Blue Dark` | `#01ACFE` |
| `bg-secondary` | `Colors/Blue Light` | `#C2E4FD` |
| `member-lyric-box-primary` | `Colors/Blue` | `#A1CAFE` |
| `member-lyric-box-secondary` | `Colors/White` | `#FFFFFF` |
| `stem-solo-primary` | `Colors/Green` | `#58FE33` |
| `stem-mute-primary` | `Colors/Red` | `#F13600` |
| `language-box-selected-primary` | `Colors/Green Light` | `#91E53E` |
| `language-box-selected-secondary` | `Colors/White` | `#FFFFFF` |
| `language-box-default-primary` | `Colors/White` | `#FFFFFF` |
| `slider-primary` | `Colors/Black` | `#000000` |
| `slider-secondary` | `Colors/Gray` | `#999999` |
| `slider-circle-primary` | `Colors/White` | `#FFFFFF` |
| `play-pause-icon-primary` | `Colors/White` | `#FFFFFF` |

**MCP vs panel drift:** Earlier MCP passes referenced `stem-waveform-container-primary` and did not list `bg-primary`, `bg-secondary`, `stem-solo-primary`, `stem-mute-primary`, or `language-box-default-primary`. **Trust the Variables panel** as source of truth.

---

## Modes and Theming Structure

| Check | Result |
|-------|--------|
| Modes on **Primitives** collection | **None** — single “Value” column |
| Modes on **Tokens** collection | **None** — single “Value” column |
| Theming strategy today | **Single static theme** |
| Implication for code | One CSS theme; no `prefers-color-scheme` swap without new Figma modes |

---

## Naming Convention Analysis

### Confirmed patterns

| Layer | Pattern | Example |
|-------|---------|---------|
| Primitive color | Pascal Case, simple name | `Blue Light`, `Gray Light` |
| Primitive spacing | `{prefix}-{number}` | `sp-24`, `cr-16` |
| Primitive stroke width | `st-{n}` | `st-2` |
| Semantic color | `{context}-{role}-{priority}` kebab-case | `language-box-selected-primary` |
| Primitive reference in aliases | `Colors/{Name}` | `Colors/Black` |

### Remaining inconsistencies

| Issue | Detail |
|-------|--------|
| **Collection vs group vs export path** | Panel: `Tokens` / `Color` / `text-primary`. Export: `Color/text-primary`. |
| **Component variants** | `Property 1=Default` — not aligned with token naming. |
| **Shadow vs spacing naming** | `sp-*` used for shadow offset and layout — rely on effect style name (4× vs 2×) to distinguish. |

---

## Token Hierarchy Mapping

```
PRIMITIVES — Colors
──────────────────
Black ─────────────┬──► stroke-primary
                   ├──► text-primary
                   ├──► slider-primary
                   └──► Pop shadow color (effect styles → stroke-primary)

White ─────────────┬──► main-container-primary
                   ├──► text-inverse
                   ├──► stem-container-secondary
                   ├──► slider-circle-primary
                   ├──► play-pause-icon-primary
                   ├──► member-lyric-box-secondary
                   ├──► language-box-selected-secondary
                   └──► language-box-default-primary

Gray ──────────────┬──► text-secondary
                   └──► slider-secondary

Gray Light ────────► stem-waveform-container (20% opacity on variable)

Yellow ────────────► stem-container-primary

Red ───────────────► stem-mute-primary

Green ─────────────► stem-solo-primary

Green Light ─────────► language-box-selected-primary

Blue ────────────────► member-lyric-box-primary

stem-container-secondary ─┐
stem-container-primary ───┴──► Stem track gradient (vertical, style: Yellow Gradient)

member-lyric-box-secondary ─┐
member-lyric-box-primary ───┴──► Member pill gradient (vertical, style: Blue Gradient)

language-box-selected-secondary ─┐
language-box-selected-primary ───┴──► Language selected gradient (vertical)

bg-secondary ──────┐
bg-primary ────────┴──► Page background (vertical; style: Blue Gradient)

PRIMITIVES — Spacing / Stroke
─────────────────────────────
sp-* / cr-* ───────► padding, gap, radius
st-1 / st-2 ───────► border width (1px / 2px)

NOT IN VARIABLES
────────────────
Typography ────────► Text styles (COOL_FONT, Swiss 721, Swis721_BT, Jersey 10, Noto Sans KR)
Pop shadow 4× ───────► offset sp-4 × sp-4, color stroke-primary
Pop shadow 2× ───────► offset sp-2 × sp-2, color stroke-primary
```

---

## Typography System

**Status: Text styles only (not variables).** Stakeholder is **unsure how to model typography in Figma variables** — a common limitation, since Figma variables handle color/number/string but not full composite text styles in one token.

**Font licensing:** **Confirmed — all fonts are licensed** for this product. No legal blocker for web embedding.

| Font (from frame export) | Usage | Sizes (hardcoded) |
|--------------------------|-------|-------------------|
| `COOL_FONT` (many substyles) | Title, solo/mute glyphs, BG decor | 96, 64, 700 |
| `Swiss 721` Medium / Regular | Labels, times, language | 16, 24 |
| `Swis721_BT` Roman / Bold | Header, metadata | 16, 24 |
| `Jersey 10` Regular | Stem row labels | 48 |
| `Noto Sans KR` Regular | Korean lyrics | 16 |

### Recommended approach (until variables are defined)

| Approach | Pros | Cons |
|----------|------|------|
| **A. Figma text styles → CSS classes** | Matches design tool; easy for designers | Manual sync if styles change |
| **B. CSS custom properties per role** | e.g. `--type-title-size: 96px` | Duplicates Figma unless documented |
| **C. Figma variables (partial)** | Numbers for size/line-height only | Font family strings; no composite styles |

**Practical v1 recommendation:** Use **(A)** — export a **type scale table** from Figma Text styles, map to Tailwind `fontSize` / `fontFamily` extensions, and revisit variables if design adopts a numeric type scale in Primitives later.

---

## Color System

### Gradients (fill styles, not variables)

**All gradients are vertical** (`linear-gradient` top → bottom, **0% at top, 100% at bottom**).

| Style name (Figma) | 0% (top) token | 100% (bottom) token | UI usage |
|--------------------|----------------|---------------------|----------|
| **Blue Gradient** *(single style)* | See below | See below | Page **and** member pill share one style |
| **Green Gradient** | `language-box-selected-secondary` | `language-box-selected-primary` | Selected language (ORG) |
| **Yellow Gradient** | `stem-container-secondary` | `stem-container-primary` | Stem track row fill |

**`Blue Gradient` (one style definition):** Confirmed **only one** `Blue Gradient` in the Styles panel (name fixed from ~~`Blue Grandient`~~). Different surfaces bind different semantic stops on the same style:

| Surface | 0% | 100% |
|---------|-----|------|
| Page background | `bg-secondary` | `bg-primary` |
| Member lyric pill | `member-lyric-box-secondary` | `member-lyric-box-primary` |

**CSS reference (implementation):**

```css
/* Page */
background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);

/* Stem track (Yellow Gradient) */
background: linear-gradient(180deg, var(--stem-container-secondary) 0%, var(--stem-container-primary) 100%);

/* Member pill (Blue Gradient) */
background: linear-gradient(180deg, var(--member-lyric-box-secondary) 0%, var(--member-lyric-box-primary) 100%);

/* Language selected (Green Gradient) */
background: linear-gradient(180deg, var(--language-box-selected-secondary) 0%, var(--language-box-selected-primary) 100%);
```

### Surfaces & chrome

- Cards: `main-container-primary` + `stroke-primary` border (`st-2`) + **4× pop shadow** (`sp-4` offset, `stroke-primary` color).
- Stem rows: **Yellow Gradient** fill (white → yellow) + `stroke-primary` border (`st-2`).
- Waveform wells: `stem-waveform-container` → `Gray Light` with **variable-level 20% opacity**.
- Solo / mute (dev): use **`stem-solo-primary`** (`#58FE33`) and **`stem-mute-primary`** (`#F13600`) — **confirmed** to replace ad-hoc green/red in code.

---

## Spacing and Sizing Scales

**Tokenized:** `2, 4, 8, 16, 24, 32, 48` px spacing; `16` px standard corner (`cr-16`). `sp-2` / `sp-4` also drive **pop shadow** offsets.

**Not tokenized (still hardcoded on frame):**

| Value | Usage |
|-------|--------|
| 60px | Frame horizontal inset |
| 128px | Stem row height |
| 80px | Waveform height |
| 44px | Icon hit targets |
| 95, 50, 60, 36, 25, 24px | Pill / bar corner radii |
| 787px | Header gap (layout artifact — review auto-layout) |

---

## Effects, Opacity, and Radii

| Effect | Definition | In Variables? |
|--------|------------|---------------|
| **Pop shadow 4×** | Offset **`sp-4`** × **`sp-4`**, 0 blur; **color = `stroke-primary`** | **Yes** |
| **Pop shadow 2×** | Offset **`sp-2`** × **`sp-2`**, 0 blur; **color = `stroke-primary`** | **Yes** |
| Border (heavy) | `st-2` + `stroke-primary` | **Yes** |
| Border (light) | `st-1` + `stroke-primary` | **Yes** |
| BG punctuation | 50% opacity on `Colors/Gray` | **No** (decorative layer) |
| Waveform well | `stem-waveform-container` → Gray Light **@ 20% on variable** | **Yes** |

### Pop shadow assignment — **Confirmed**

| Shadow | Offset | Components / elements |
|--------|--------|------------------------|
| **2×** | `sp-2` × `sp-2` | **Meters label** only |
| **4×** | `sp-4` × `sp-4` | **Everything else** with pop shadow: main cards (lyrics, meters box container, progress bar), stem tracks, title block, header chrome, etc. |

**Implementation:** Default to `shadow-pop-4`; apply `shadow-pop-2` only on the meters label element inside `Meters Box`.

---

## Component-Level Token Usage

| Component | Expected tokens (from panel + frame) |
|-----------|--------------------------------------|
| `Stem Player` root | `bg-secondary` → `bg-primary` gradient; decor uses `Gray` |
| `Stem Track` | `stem-container-primary`, `stem-waveform-container`, `sp-*`, `cr-16`, `text-inverse`, **4×** shadow |
| `Lyrics container` | `main-container-primary`, `stroke-primary`, member + language tokens, **4×** shadow |
| `Title` | `text-inverse`, `text-primary`, **4×** shadow on title |
| `Volume Box` | `stem-container-secondary`, slider tokens, `sp-16` (no pop shadow) |
| `Progress bar` | `main-container-primary`, `text-secondary`, `sp-24/8`, **4×** shadow |
| `Meters Box` | `main-container-primary`, `stroke-primary`, `cr-16`, **4×** shadow on container |
| `Meters label` | **2×** shadow only (`sp-2` offset) |
| Solo / Mute (states) | `stem-solo-primary`, `stem-mute-primary` (**use in dev** — confirmed) |

---

## Identified Issues

### Resolved since initial audit

- [x] Collection names: **Primitives** + **Tokens**
- [x] Alias structure: semantic → `Colors/*`
- [x] Mode count: **zero**
- [x] Mock-up 2 is canonical file
- [x] Gradient direction: **vertical**; per-style token stops documented
- [x] `Gray Light` opacity on **variable**
- [x] Pop shadow color → **`stroke-primary`**
- [x] Stroke widths → **`st-1`**, **`st-2`** primitives
- [x] `Blue Gradient` naming fixed
- [x] Solo/mute colors → **`stem-solo-primary`**, **`stem-mute-primary`** in dev
- [x] Pop shadow offsets → **`sp-4`** (4×), **`sp-2`** (2×)
- [x] Single **`Blue Gradient`** style
- [x] Font licensing
- [x] **2×** shadow → Meters label; **4×** → all other shadowed UI

### Still open

| Issue | Severity |
|-------|----------|
| Typography variable strategy | Medium — use text styles for v1 |
| Gradients as fill styles only (not variables) | Low — stops documented |
| Legacy `nj-*` Tailwind vs Figma tokens | High at implementation time |
| Ad-hoc radii and font sizes | Medium |
| MCP export name drift | Low — use Variables panel names |

---

## Recommended Clarifications

| # | Topic | Status |
|---|--------|--------|
| 1 | Mock-up 2 as source of truth | **Done** |
| 2 | Gradient direction and per-style stops | **Done** |
| 3 | Typography: variables vs text styles | **Open** — unsure; use text styles for v1 |
| 4 | Modes | **Done** — none |
| 5 | `Gray Light` opacity | **Done** — on variable |
| 6 | `stem-solo` / `stem-mute` in dev | **Done** — yes |
| 7 | Pop shadow offsets | **Done** — `sp-4` / `sp-2` |
| 8 | One `Blue Gradient` style | **Done** |
| 9 | Font licensing | **Done** — all licensed |
| 10 | Export pipeline (Style Dictionary, Tokens Studio, manual CSS) | **Open** |
| 11 | Map 4× vs 2× shadow to components | **Done** — 2×: Meters label; 4×: rest |

---

## Implementation Considerations

*(For a future pass — not started.)*

### Canonical CSS variable sketch

```css
/* Primitives — Colors */
--color-black: #000000;
--color-white: #ffffff;
--color-gray: #999999;
--color-red: #f13600;
--color-green: #58fe33;
--color-yellow: #ffff26;
--color-green-light: #91e53e;
--color-blue: #a1cafe;
--color-blue-light: #c2e4fd;
--color-blue-dark: #01acfe;
--color-gray-light: #b3b3b3;

/* Primitives — Spacing */
--spacing-sp-2: 2px;
--spacing-sp-4: 4px;
--spacing-sp-8: 8px;
--spacing-sp-16: 16px;
--spacing-sp-24: 24px;
--spacing-sp-32: 32px;
--spacing-sp-48: 48px;
--radius-cr-16: 16px;

/* Primitives — Stroke */
--stroke-st-1: 1px;
--stroke-st-2: 2px;

/* Semantic — Tokens/Color (21 tokens — map 1:1 to panel) */
--stroke-primary: var(--color-black);
--text-primary: var(--color-black);
--bg-primary: var(--color-blue-dark);
--bg-secondary: var(--color-blue-light);
--stem-waveform-container: /* Gray Light @ 20% from Figma variable */;
--stem-solo-primary: var(--color-green);
--stem-mute-primary: var(--color-red);
/* … */

/* Effects — pop shadow */
--shadow-pop-4: var(--spacing-sp-4) var(--spacing-sp-4) 0 var(--stroke-primary);
--shadow-pop-2: var(--spacing-sp-2) var(--spacing-sp-2) 0 var(--stroke-primary);

/* Gradients — vertical, 0% → 100% */
--gradient-page: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
--gradient-stem: linear-gradient(180deg, var(--stem-container-secondary) 0%, var(--stem-container-primary) 100%);
--gradient-member: linear-gradient(180deg, var(--member-lyric-box-secondary) 0%, var(--member-lyric-box-primary) 100%);
--gradient-language-selected: linear-gradient(180deg, var(--language-box-selected-secondary) 0%, var(--language-box-selected-primary) 100%);
```

### Rules for developers

1. **Use Tokens collection** for colors; **Primitives** for spacing, stroke width, and raw palette.
2. **Do not assume modes** until Figma adds mode columns.
3. **All gradients:** `linear-gradient(180deg, …)` with documented token stops.
4. **Borders:** `st-2` + `stroke-primary` for 2px chrome; `st-1` where 1px is used.
5. **Shadow:** Default **`shadow-pop-4`**; **`shadow-pop-2`** on **Meters label** only; color **`stroke-primary`**.
6. **Solo/mute:** `stem-solo-primary` / `stem-mute-primary` — not legacy `nj-solo` / `nj-mute`.
7. **Typography:** Figma **text styles** + type scale doc for v1 (variables TBD).
8. **Fonts:** licensed — proceed with `@font-face` / hosted files per delivery.
9. **Update README** Figma URL to Mock-up 2 when starting UI work.

### Blockers

| Blocker | Severity |
|---------|----------|
| Typography variable approach undecided | Medium — mitigated by text styles |
| Export `Gray Light` 20% accurately from Figma → CSS | Medium |
| Legacy `nj-*` Tailwind vs Figma tokens | High at implementation time |

---

## Appendix A — MCP export naming reference

When using Figma MCP `get_variable_defs`, names may appear as `Color/{token}` and `Colors/{primitive}`. Map to panel names:

| MCP / Dev Mode | Variables panel |
|----------------|-----------------|
| `Color/text-primary` | Tokens → `text-primary` |
| `Colors/Blue Light` | Primitives → `Blue Light` |
| `Spacing/sp-24` | Primitives → `sp-24` |

---

## Appendix B — Document status

| Section | Status |
|---------|--------|
| Primitives — Spacing | **Confirmed** |
| Primitives — Stroke (`st-1`, `st-2`) | **Confirmed** |
| Primitives — Colors | **Confirmed** |
| Tokens — Color aliases | **Confirmed** |
| Modes | **Confirmed: none** |
| Gradients | **Confirmed** — vertical + token stops |
| Gray Light opacity | **Confirmed** — on variable |
| Pop shadow | **Confirmed** — 2×: Meters label; 4×: all else |
| `Blue Gradient` | **Confirmed** — single style |
| Typography | **Open** — text styles recommended for v1 |
| Font licensing | **Confirmed** |
| Mock-up 2 canonical | **Confirmed** |
| Solo/mute in dev | **Confirmed** — use semantic tokens |
