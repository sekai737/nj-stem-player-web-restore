# Stem Player Fullscreen Mode — Design & Interaction Specification

## 1. Purpose

The fullscreen stem player is a fixed, immersive music-player view based on the Figma design.

It combines four ideas into one interface:

- A fullscreen “now playing” screen
- A synchronized lyric display
- A chat-style member lyric feed
- A simplified stem-control/player experience

The page should feel like a stylized app screen, not a standard web music player. The Figma mockup is the visual source of truth.

---

## 2. Screen Structure

The layout is divided into three main zones:

1. **Top Header Bar**
2. **Main Content Area**
3. **Bottom Track Navigation Bar**

The entire interface should fill the full viewport with no page scrolling.

---

## 3. Top Header Bar

The top header is a bright yellow horizontal strip running across the full width of the screen.

### Contents

| Element | Position | Purpose |
|---|---:|---|
| Back button | Far left | Exit fullscreen mode or return to the previous view |
| Title | Center | Identifies the current screen |
| Menu button | Far right | Opens additional fullscreen/player options |

### Title Text

```txt
Stem Player Fullscreen Mode
```

### Back Button

The back button is a white circular button with a black outline and a left-facing chevron icon.

### Menu Button

The menu button is a white circular button with a black outline and a vertical three-dot icon.

Possible menu functions:

- Exit fullscreen
- Open lyric display settings
- Open stem controls
- Open playback options
- Show track information

---

## 4. Main Content Area

The main content area sits between the top header and the bottom navigation bar.

It uses a pale yellow background and is split into two primary visual regions:

| Region | Function |
|---|---|
| Left side | Chat-style synchronized lyric feed |
| Right side | Player card, stem controls, and volume |

The left side carries the narrative rhythm of the song. The right side anchors the playback controls and track identity.

---

## 5. Lyrics Feed

The lyric feed behaves like a synchronized chat thread.

Each lyric entry is attached to a specific member and appears as a message bubble.

### Each lyric item includes:

- Member avatar
- Member name
- Member emoji
- Lyric bubble
- Timestamp

### Example visual structure

```txt
[Avatar]  Haerin 🐱
          ┌──────────────────────────────┐
          │ 너와 나 다시 한 번 만나게      │
          │ neowa na dashi hanbeon...    │
          │ So you and I can meet again  │
          └──────────────────────────────┘
                                      00:37.42
```

---

## 6. Lyric Bubble Behavior

Lyric bubbles should support both compact and expanded states depending on the lyric content.

### Single-line lyric

A short lyric line should use a compact bubble.

Example:

```txt
One more chance
```

### Multi-line lyric

A full lyric translation block should use a taller bubble.

Example:

```txt
너와 나 다시 한 번 만나게
neowa na dashi hanbeon mannage
So you and I can meet again
```

### Visual Style

The lyric bubbles use:

- Rounded rectangle shape
- Black border
- Soft green gradient fill
- Comfortable internal padding
- Dynamic width based on content
- Dynamic height based on lyric mode

The active lyric should feel visually stronger than inactive lyrics. The screenshot shows the bubbles as the main expressive element, so the active state should be clear but not disruptive.

---

## 7. Lyric Language Modes

The lyrics should support four display modes:

| Mode | Display |
|---|---|
| Original | Original lyric text only |
| Romanized | Romanized lyric text only |
| English | English translation only |
| All | Original + romanized + English translation |

The screenshot shows the **All** mode.

This matters because NewJeans lyrics may mix Korean, Japanese, and English in the same song. The “Original” mode should preserve the lyrics exactly as written, even when multiple languages appear in the same line or section.

Recommended labels:

| Label | Meaning |
|---|---|
| ORIG | Original lyrics |
| ROM | Romanized lyrics |
| EN | English translation |
| ALL | Combined lyric view |

---

## 8. Lyric Sync Behavior

The lyric feed should respond to the current playback time.

When the song reaches a lyric timestamp:

- That lyric becomes active
- Its bubble is highlighted
- The feed smoothly keeps the active lyric visible
- The interface should avoid abrupt jumps

The active lyric should generally sit around the vertical center of the visible lyric area, so the user can see the current line while also seeing nearby previous and upcoming lines.

---

## 9. Member Attribution

Each lyric line should clearly show who is singing.

### Member label format

```txt
Danielle 🐶
Haerin 🐱
```

The avatar and label work together:

- Avatar gives instant visual recognition
- Name gives explicit attribution
- Emoji adds personality and matches the playful Figma direction

Member labels should remain visually lighter than the lyric text itself. The lyric bubble is the focal point.

---

## 10. Stem Control Stack

Between the lyrics and the player card is a vertical stack of compact stem-control buttons.

The screenshot shows four small rounded buttons.

These represent the controllable audio layers of the song.

### Suggested stem categories

| Stem | Purpose |
|---|---|
| Vocals | Main vocal layer |
| Instrumental | Main backing track |
| Guitar / Instrument | Specific instrumental layer |
| Drums | Percussion layer |

### Button Style

The stem buttons use:

- Pale blue fill
- Black outline
- Rounded pill shape
- Small icon-based layout
- Vertical stacking
- Even spacing

### Stem States

| State | Visual Meaning |
|---|---|
| Normal | Stem is active at regular playback |
| Muted | Stem is turned off |
| Solo | Only this stem, or prioritized stem, is emphasized |
| Disabled | Stem unavailable or inactive |

The design should clearly distinguish muted and soloed stems without overpowering the main player card.

---

## 11. Player Card

The player card is the main visual anchor on the right side.

It resembles a physical music-player panel or collectible card.

### Structure

```txt
┌─────────────────────────┐
│ Album Art               │
│                         │
├─────────────────────────┤
│ Song Title              │
│ Artist                  │
│ Album · Year            │
├─────────────────────────┤
│ Previous | Play | Next  │
├─────────────────────────┤
│ Progress Bar            │
└─────────────────────────┘
```

### Visual Style

The card uses:

- White background
- Black border
- Rounded corners
- Strong outlined shape
- Centered internal layout
- Clear vertical hierarchy

The card should not feel like a floating generic widget. It should feel like a designed object within the fullscreen composition.

---

## 12. Album Art

The album art sits at the top of the player card.

### Requirements

- Square format
- Centered inside the card
- Rounded corners
- Preserved aspect ratio
- No stretching
- No cropping that damages the artwork composition

The screenshot uses the **Supernatural** cover art with a black square image area.

---

## 13. Track Metadata

Below the album art, the player card displays the track identity.

### Displayed text

```txt
Supernatural
NewJeans
Supernatural · 2024
```

### Hierarchy

| Text | Visual Priority |
|---|---|
| Song title | Highest |
| Artist | Medium |
| Album/year | Lowest |

The song title should be bold and centered. The artist should sit directly below it. The album/year metadata should be smaller and lighter.

---

## 14. Playback Controls

The playback controls sit below the metadata.

### Controls

| Control | Visual |
|---|---|
| Previous | Small circular outlined button |
| Play / Pause | Larger green circular button |
| Next | Small circular outlined button |

The play button is the strongest control in the group. It should use the same green visual language as the lyric bubbles and bottom navigation arrow.

---

## 15. Progress Bar

The progress bar sits at the bottom of the player card.

It displays:

- Current playback time
- Scrubber/progress line
- Total duration

Example:

```txt
2:56 ─────●──────── 3:11
```

The bar should feel minimal and secondary. It supports navigation but should not visually compete with the album art or play button.

---

## 16. Volume Control

The far-right side of the screen contains a vertical volume slider.

### Structure

```txt
32%
│
│
●
│
speaker icon
```

### Behavior

The volume control displays:

- Current volume percentage at the top
- Vertical slider track
- Slider thumb
- Speaker icon at the bottom

The screenshot shows the volume set to **32%**.

The volume control should remain visually separate from the player card, but aligned closely enough to feel like part of the same playback system.

---

## 17. Bottom Track Navigation Bar

The bottom bar is a large pill-shaped track navigation control.

### Displayed text

```txt
Supernatural EP · Supernatural · Track 01
```

### Visual Style

The bottom navigation bar uses:

- White fill
- Black outline
- Large rounded pill shape
- Gray metadata text
- Green arrow/send-style icon on the right

### Purpose

This bar is for **song navigation**, not settings.

It can be used to:

- Open the song list
- Navigate within the EP
- Select another track
- Confirm or trigger track navigation

The bottom bar acts like the “destination rail” of the player. It tells the user where they are in the release and gives them a clear route to move elsewhere.

---

## 18. Interaction Summary

| Area | Interaction |
|---|---|
| Back button | Exit fullscreen / return |
| Menu button | Open additional options |
| Lyric bubbles | Follow current playback position |
| Lyric mode toggle | Switch between Original, Romanized, English, and All |
| Stem buttons | Mute, solo, or control individual stems |
| Album art/player card | Shows current track identity |
| Play button | Toggle playback |
| Previous/Next | Move between tracks |
| Progress bar | Scrub through the song |
| Volume slider | Adjust playback volume |
| Bottom navigation bar | Navigate songs within the release |

---

## 19. Visual Priorities

The design should preserve this hierarchy:

1. **Player card**
2. **Active lyric bubble**
3. **Lyric feed**
4. **Playback controls**
5. **Stem controls**
6. **Volume control**
7. **Bottom track navigation**

The player card and active lyric bubble should carry the most attention.

The stem controls and volume slider are functional but secondary.

---

## 20. Design Rules

Use the Figma design as the source of truth.

Match:

- Layout proportions
- Component placement
- Spacing
- Sizing
- Border radius
- Border thickness
- Typography
- Colors
- Shadows/outline weight
- Visual hierarchy
- Icon placement
- Bubble sizing behavior
- Player-card proportions
- Bottom navigation shape

Do not reinterpret the layout into a generic music player. The strength of the design is the specific composition: chat lyrics on the left, collectible-player card on the right, and track navigation across the bottom.

---
