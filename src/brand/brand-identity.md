# Creative Digital Company — Brand Identity

- **Document type:** Brand identity (M3-1a, [CRE-52](/CRE/issues/CRE-52))
- **Author:** UXDesigner
- **Version:** 1.0
- **Status:** Approved for tokens consumption
- **Date:** 2026-08-02
- **Owners:** Design = UXDesigner · Engineering = [FrontendLead](/CRE/agents/frontendlead) ([CRE-53](/CRE/issues/CRE-53)) · Milestone = [M3](/CRE/issues/CRE-32)

This document defines the brand and is the source of truth for the design-tokens
module ([M3-1b](/CRE/issues/CRE-53)). Every color/type/spacing value is also
available as a named CSS custom property in
[`src/brand/brand.css`](/CRE/issues/CRE-52) so the tokens module can consume it
directly.

---

## 1. Name & tagline

| Element                    | Value                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Company name               | **Creative Digital Company** (unchanged — brand-safe, keep)                          |
| Short form / wordmark      | **CDC.**                                                                             |
| Tagline (hero/positioning) | **"We build brands and digital products people remember."** (existing M1 line, kept) |
| Descriptor                 | Design & development studio                                                          |

**Change discipline (Tesler's Law / Occam's Razor):** the name was deliberately
kept — a rename carries recognition and SEO cost with no product upside at this
stage. The tagline stays identical to the shipped M1 hero so there is zero
copy-debt. No rebrand of the legal name.

---

## 2. Color palette

Every value is a custom property in `brand.css`. Contrast ratios are WCAG 2.1
computed values; all _text_ pairings below are **AA (≥ 4.5:1)** or better.

### 2.1 Ink (neutrals) — `--ink-*`

| Token       | Value     | Usage                           |
| ----------- | --------- | ------------------------------- |
| `--ink-950` | `#0c0c10` | App background (dark)           |
| `--ink-900` | `#14141b` | Surface (dark), text (light)    |
| `--ink-850` | `#1b1b24` | Raised surface (dark)           |
| `--ink-800` | `#26262f` | Elevated surface / hover (dark) |
| `--ink-700` | `#3a3a44` | Muted text (light)              |
| `--ink-600` | `#55555f` | Disabled text (light)           |
| `--ink-500` | `#6f6f7a` | Subtle text (light)             |
| `--ink-400` | `#84848e` | Subtle text (dark)              |
| `--ink-300` | `#a2a2ad` | Muted text (dark)               |
| `--ink-200` | `#c8c8d0` | Border (dark, strong)           |
| `--ink-100` | `#e4e4e9` | Border (dark)                   |
| `--ink-50`  | `#f4f4f6` | Primary text (dark)             |
| `--ink-0`   | `#ffffff` | Surface (light)                 |

### 2.2 Accent (vermilion/coral) — `--accent-*`

| Token          | Value     | Usage                                          |
| -------------- | --------- | ---------------------------------------------- |
| `--accent-500` | `#ff5c38` | **Primary accent** (buttons, links, brand dot) |
| `--accent-600` | `#f04a24` | Accent hover (light)                           |
| `--accent-400` | `#ff845f` | Accent hover / focus (dark)                    |
| `--accent-700` | `#d23b16` | Accent text on light (links)                   |
| `--accent-300` | `#ffa388` | Accent text on dark (hover)                    |
| `--accent-100` | `#ffe3d8` | Accent soft chip (light)                       |
| `--accent-50`  | `#fff1ed` | Accent tint / chip bg (light)                  |

**Contrast (text usage, verified):**

| Pair                                                        | Ratio       | Verdict                                       |
| ----------------------------------------------------------- | ----------- | --------------------------------------------- |
| `--ink-50` text on `--ink-950` bg                           | **17.77:1** | AAA                                           |
| `--ink-300` muted text on `--ink-950` bg                    | **7.72:1**  | AAA                                           |
| `--ink-300` muted text on `--ink-900` surface               | **7.25:1**  | AAA                                           |
| `--accent-500` on `--ink-950` bg (large/icon text)          | **6.36:1**  | AA+                                           |
| `--accent-500` on `--ink-900` surface                       | **5.97:1**  | AA+                                           |
| `--accent-400` on `--ink-950` bg                            | **8.10:1**  | AAA                                           |
| `--ink-950` on `--accent-500` (on-accent text)              | **6.36:1**  | AA+                                           |
| `--ink-900` text on `--ink-0` bg (light theme)              | **18.33:1** | AAA                                           |
| `--ink-700` muted text on `--ink-0` bg                      | **11.24:1** | AAA                                           |
| `--accent-700` link text on `--ink-0` bg                    | **4.80:1**  | AA                                            |
| `--accent-500` on `--ink-0` (light accent fill, decorative) | **3.07:1**  | large-text-only — use `--accent-700` for text |

**Rule:** accent at `--accent-500` is a _fill_ color (buttons, chips, brand dot).
For **text** on light surfaces use `--accent-700` (`#d23b16`); on dark surfaces
use `--accent-400`/`--accent-300`. Never set body text in `--accent-500` on
white (3.07:1 fails AA).

### 2.3 Semantic / state colors

| Token       | Light (text on white)                | Dark (text on ink-950)               | Chip bg (light / dark)                                         |
| ----------- | ------------------------------------ | ------------------------------------ | -------------------------------------------------------------- |
| **Success** | `--success-700` `#1e7d3c` — 5.18:1 ✓ | `--success-500` `#46c968` — 9.12:1 ✓ | `--success-bg-light` `#e7f6ec` / `--success-bg-dark` `#12321c` |
| **Warning** | `--warning-700` `#9a6700` — 4.87:1 ✓ | `--warning-500` `#f5a623` — 9.63:1 ✓ | `--warning-bg-light` `#fff4e0` / `--warning-bg-dark` `#3a2a08` |
| **Danger**  | `--danger-700` `#b91c1c` — 6.47:1 ✓  | `--danger-500` `#ff6b6b` — 7.03:1 ✓  | `--danger-bg-light` `#fde8e8` / `--danger-bg-dark` `#3a1212`   |

**Rules:**

- On light theme, semantic text uses the `-700` variant; on dark, the `-500` variant.
- Chip backgrounds are never the carrier of meaning alone (color-independence,
  WCAG 1.4.1) — pair every state with an icon, label, or glyph.
- Focus ring = `--color-focus` `--accent-400` `#ff845f` (visible on both themes).

### 2.4 Borders & shadows

- `--color-border`: `rgba(20,20,27,.12)` light / `rgba(244,244,246,.12)` dark
- `--color-border-strong`: `.28` light / `.28` dark
- `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-accent` per theme in `brand.css`.

---

## 3. Typography

Typeface stack evolves from the current Inter stack. **Inter is the brand
face** — single family, no webfont dependency (keeps M1 static-site performance
budgets; avoids FOIT). A display face is deliberately **not** introduced at this
stage (system-level proposal below if we ever want one).

### 3.1 Typeface stacks

| Token                            | Stack                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| `--font-sans` / `--font-display` | `'Inter', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif` |
| `--font-mono`                    | `ui-monospace, 'SF Mono', 'Cascadia Code', 'Consolas', monospace`                    |

### 3.2 Type scale

| Token            | Size                         | Usage                        |
| ---------------- | ---------------------------- | ---------------------------- |
| `--text-xs`      | 0.75rem (12px)               | Captions, legal, table cells |
| `--text-sm`      | 0.875rem (14px)              | Helper text, metadata, nav   |
| `--text-base`    | 1rem (16px)                  | **Body**                     |
| `--text-lg`      | 1.125rem (18px)              | Lead paragraphs              |
| `--text-xl`      | 1.375rem (22px)              | Card titles, h4              |
| `--text-2xl`     | 1.75rem (28px)               | h3 / section sub-headers     |
| `--text-3xl`     | 2.25rem (36px)               | h2 / section headers         |
| `--text-4xl`     | 3rem (48px)                  | h1 / page heroes             |
| `--text-display` | `clamp(2.5rem, 6vw, 4.5rem)` | Hero display                 |

### 3.3 Weights, line-heights, tracking

- Weights: `--weight-regular` 400 · `--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 700 · `--weight-extrabold` 800 (display/wordmark)
- Line heights: display `--leading-tight` 1.05 · headings `--leading-heading` 1.15 · body `--leading-normal` 1.6 · relaxed 1.7
- Tracking: display `--tracking-tight` -0.03em · headings `--tracking-heading` -0.02em · kicker `--tracking-kicker` 0.12em (uppercase labels)

**Scale rationale (Miller's Law / Hick's Law):** exactly 9 steps, 6 weights, 3
tracking tokens — enough for the product surfaces, small enough to learn. No
per-component sizes; size always comes from the scale.

---

## 4. Logo asset set

Files in `src/brand/`:

| File                         | Content                                | Use                                          |
| ---------------------------- | -------------------------------------- | -------------------------------------------- |
| `logo-mark.svg`              | "C." aperture mark — ink C, accent dot | Light surfaces, app header, empty states     |
| `logo-mark-inverse.svg`      | C. mark — light C, accent dot          | Dark surfaces (dark theme nav/footer)        |
| `logo-wordmark.svg`          | Mark + **CDC.** lockup (ink)           | Header/footer on light, favicon-adjacent use |
| `logo-wordmark-inverse.svg`  | Mark + **CDC.** lockup (light)         | Dark surfaces                                |
| `favicon.svg` (in `public/`) | C. mark on ink tile, accent C          | Browser tab, bookmark                        |

### 4.1 Design intent

The mark is a **C with a terminal dot** — the aperture reads as the letterform
"c" while the dot anchors it as the "." of **CDC.** (Gesalt Pragnanz: the two
elements unify into a single glyph). The C's open arc + dot evokes a signal/cursor
— "creative · digital" in one stroke (Aesthetic-Usability, Von Restorff: one
distinctive accent element for recall).

### 4.2 Usage rules

- **Clearance:** minimum space on all sides = height of the "C" stroke (~5.5 units) around the mark.
- **Minimum sizes:** mark ≥ 24px; wordmark ≥ 140px wide; never below.
- **Ink → accent order:** use `logo-mark` (ink) on light surfaces; `logo-mark-inverse` (light) on dark. Do not place ink logo on ink background or light logo on white.
- **Do not:** rotate, recolor the dot away from `--accent-500`, add effects, or set the mark in a filled box (except favicon tile).
- **Favicon:** already updated to the C. mark on the `--ink-950` tile with accent C.

---

## 5. Spacing, radii, motion

- **Spacing** `--space-1..16` (4 → 128px, 4px base grid): single source of truth — no stray rem values in components.
- **Radii** `--radius-sm 8 / md 14 / lg 20 / xl 28 / full 9999px` (current site radius 14 = `--radius-md`, kept).
- **Motion** `--duration-fast 100ms / base 200ms / slow 500ms`, easings `--ease-out` & `--ease-in-out`. Micro-interactions at fast; never > 500ms except scroll reveals. `prefers-reduced-motion: reduce` must zero out all non-essential animation (WCAG 2.3.3).

---

## 6. Accessibility notes (WCAG 2.1 AA)

- All text pairings pass AA (see §2 tables); body/muted in both themes are AAA.
- Focus visibility: `--color-focus` accent-400 with 2px outline + 3px offset (matches current `:focus-visible`).
- Color is never the only channel for state (§2.3) — always pair with glyph/label.
- Targets ≥ 44×44px (Fitts's Law) for touch; text links ≥ 24px hit area.
- The wordmark provides `aria-label`; decorative repeats use `aria-hidden`.

---

## 7. System-level change proposals

Call-outs for the design-system owner (flagged, not invented inline):

1. **No display typeface (kept Inter only).** If we later want brand character in
   heroes, propose a single display face (e.g. Space Grotesk or Sora) as a new
   `--font-display` + self-hosted woff2 — a separate decision, not a silent addition.
2. **Spacing/radii/motion tokens** are introduced here as the seed of the full token
   module (CRE-53) — the module may add but must not diverge from these names.
3. **`--shadow-accent`** (coral glow for primary CTAs) is new vs. current site — proposed
   for the primary button hover state to preserve current visual language.

---

## 8. Handoff acceptance criteria (from CRE-52)

1. Name/tagline, palette, type scale, and logo assets are decided and documented in the repo. ✓ (`brand.css`, `brand-identity.md`, `src/brand/*`, `public/favicon.svg`)
2. All palette/type values are named custom-properties, contrast-checked AA min for body text. ✓ (§2)
3. Logo assets exist as SVG files with an updated favicon. ✓
4. `npm run verify` passes. (verified in CRE-52)
5. Final comment hands deliverable to EM with summary + verification evidence. (this issue)
