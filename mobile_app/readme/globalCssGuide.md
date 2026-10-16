# 🌿 Jade Forest Design System

> A complete mobile UI design guide using the **Jade Forest** color palette with **Poppins** typography.

---

## Table of Contents

- [Color Tokens](#color-tokens)
- [Typography](#typography)
- [Spacing Scale](#spacing-scale)
- [Border Radius](#border-radius)
- [Button System](#button-system)
- [Input Fields](#input-fields)
- [Cards](#cards)
- [Icons](#icons)
- [Do's and Don'ts](#dos-and-donts)

---

## Color Tokens

### Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#059669` | Buttons, links, active states, icons |
| `primary-hover` | `#047857` | Button hover / pressed state |
| `secondary` | `#34D399` | Hover accent, highlights, progress |
| `tint` | `#A7F3D0` | Chips, tags, tinted backgrounds |
| `dark` | `#1C2D24` | Navigation, headlines, dark surfaces |
| `surface` | `#F0FFF4` | App background |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#1C2D24` | Headings, titles, important labels |
| `text-secondary` | `#4B5563` | Body text, descriptions, subtitles |
| `text-muted` | `#9CA3AF` | Captions, placeholders, hints |
| `text-disabled` | `#D1D5DB` | Disabled state labels |
| `text-on-primary` | `#FFFFFF` | Text sitting on primary green button |

### Surface & Border Colors

| Token | Hex | Usage |
|---|---|---|
| `surface-app` | `#F0FFF4` | Main screen background |
| `surface-card` | `#FFFFFF` | Card, sheet, modal background |
| `surface-tint` | `#D1FAE5` | Tinted section background |
| `border-default` | `#D1FAE5` | Card borders, input borders |
| `border-focus` | `#059669` | Input focus ring |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `success` | `#059669` | Same as primary |
| `error` | `#EF4444` | Error states, destructive actions |
| `warning` | `#F59E0B` | Warning banners, alerts |
| `info` | `#3B82F6` | Informational messages |

---

## Typography

**Font family:** [Poppins](https://fonts.google.com/specimen/Poppins) — Google Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Poppins', sans-serif;
}
```

### Type Scale

| Name | Size | Weight | Letter Spacing | Line Height | Usage |
|---|---|---|---|---|---|
| Display | `32px` | `700` | `-0.5px` | `1.2` | Hero sections, splash screens |
| H1 · Screen title | `26px` | `700` | `-0.3px` | `1.25` | Page/screen main title |
| H2 · Section title | `22px` | `600` | `-0.2px` | `1.3` | Section headings |
| H3 · Card title | `18px` | `600` | `0px` | `1.35` | Card headings, modal titles |
| H4 · Label title | `16px` | `600` | `0px` | `1.4` | List item titles, form labels |
| Body large | `16px` | `400` | `0px` | `1.6` | Primary body copy |
| Body regular | `14px` | `400` | `0px` | `1.6` | Standard descriptions, paragraphs |
| Body small | `13px` | `400` | `0px` | `1.55` | Secondary descriptions |
| Caption | `12px` | `400` | `0px` | `1.5` | Timestamps, metadata, footnotes |
| Label / Overline | `11px` | `600` | `0.08em` | `1.4` | Category tags, overlines (UPPERCASE) |
| Button large | `15px` | `500` | `0.01em` | — | Primary and secondary buttons |
| Button small | `13px` | `500` | `0.01em` | — | Compact buttons, inline actions |

### Quick Rules

- **Minimum font size on mobile:** `12px` — never go smaller
- **Headings:** always negative letter-spacing for a premium, tight feel
- **Body text:** always `line-height: 1.6` for comfortable reading
- **Overlines / labels:** always `UPPERCASE` + `letter-spacing: 0.08em`
- **Weights in use:** `400` regular · `500` medium · `600` semibold · `700` bold
- **Do not mix** weights 300 or 800+ — breaks visual consistency

### CSS Snippet

```css
/* Display */
.text-display {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.2;
  color: #1C2D24;
}

/* H1 */
.text-h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1.25;
  color: #1C2D24;
}

/* H2 */
.text-h2 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.3;
  color: #1C2D24;
}

/* H3 */
.text-h3 {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  color: #1C2D24;
}

/* Body regular */
.text-body {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: #4B5563;
}

/* Caption */
.text-caption {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  color: #9CA3AF;
}

/* Overline */
.text-overline {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #059669;
}
```

---

## Spacing Scale

Based on a **4px base unit**. All spacing is a multiple of 4.

| Token | Value | Usage |
|---|---|---|
| `space-xs` | `4px` | Icon gap, badge inner padding |
| `space-sm` | `8px` | Label gap, chip padding, tight rows |
| `space-md` | `12px` | Row gap, tag spacing, list item gap |
| `space-lg` | `16px` | Card inner padding, section gap |
| `space-xl` | `20px` | **Screen horizontal padding** (golden rule) |
| `space-2xl` | `24px` | Section gap, header padding |
| `space-3xl` | `32px` | Hero spacing, bottom nav height |
| `space-4xl` | `48px` | Page top margin, modal padding |

### Key Mobile Padding Rules

```
Screen left/right padding:  20px  ← never change this
Between sections:           24px
Between list items:         12px
Card inner padding:         16–20px
Button padding:             14px top/bottom, 28px left/right
Input padding:              14px top/bottom, 16px left/right
Bottom navigation height:   64px + safe area inset
Status bar clearance:       48px
```

### CSS Variables

```css
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  12px;
  --space-lg:  16px;
  --space-xl:  20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  --space-4xl: 48px;
}
```

---

## Border Radius

| Value | Usage |
|---|---|
| `4px` | Tooltips, small tags, badges |
| `8px` | Input fields, small chips, checkboxes |
| `12px` | Buttons, standard cards |
| `16px` | Large cards, bottom sheets, modals |
| `9999px` | Pill buttons, avatar circles, FAB |

```css
:root {
  --radius-xs:  4px;
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-full: 9999px;
}
```

---

## Button System

### Sizes

| Variant | Height | Font size | Padding |
|---|---|---|---|
| Large | `52px` | `15px` | `14px 28px` |
| Medium | `44px` | `14px` | `12px 24px` |
| Small | `36px` | `13px` | `10px 20px` |

> **Minimum tap target:** 44×44px — never make buttons smaller than this on mobile.

### Variants

```css
/* Primary */
.btn-primary {
  background: #059669;
  color: #FFFFFF;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  padding: 14px 28px;
  border: none;
}

/* Secondary */
.btn-secondary {
  background: #D1FAE5;
  color: #059669;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  padding: 14px 28px;
  border: none;
}

/* Outline */
.btn-outline {
  background: transparent;
  color: #059669;
  border: 1.5px solid #059669;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  padding: 13px 28px;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: #059669;
  border: none;
  font-size: 15px;
  font-weight: 500;
  padding: 14px 20px;
  text-decoration: underline;
}

/* Disabled (any variant) */
.btn-disabled {
  background: #D1FAE5;
  color: #6B9080;
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Input Fields

```css
/* Label */
.input-label {
  font-size: 12px;
  font-weight: 500;
  color: #1C2D24;
  margin-bottom: 6px;
  display: block;
}

/* Field */
.input-field {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid #A7F3D0;
  background: #F0FFF4;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #1C2D24;
  outline: none;
}

/* Focus state */
.input-field:focus {
  border-color: #059669;
  background: #FFFFFF;
}

/* Error state */
.input-field.error {
  border-color: #EF4444;
  background: #FEF2F2;
}

/* Hint text */
.input-hint {
  font-size: 11px;
  color: #6B9080;
  margin-top: 5px;
}

/* Error text */
.input-error-text {
  font-size: 11px;
  color: #EF4444;
  margin-top: 5px;
}
```

---

## Cards

```css
/* Standard card */
.card {
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid #D1FAE5;
  padding: 20px;
}

/* Tinted card */
.card-tinted {
  background: #F0FFF4;
  border-radius: 16px;
  border: 1px solid #A7F3D0;
  padding: 20px;
}

/* Dark card (for featured/hero) */
.card-dark {
  background: #1C2D24;
  border-radius: 16px;
  padding: 20px;
}
```

### Card Anatomy

```
┌────────────────────────────────┐
│  [Tag/Badge]          16–20px  │  ← inner padding
│                                │
│  Card Title  (18px / 600)      │
│  Subtitle    (13px / 400)      │
│                                │
│  Body description text here.   │  ← 14px / 400 / #4B5563
│  Two lines max for list cards. │
│                                │
│  [Primary Button]              │
└────────────────────────────────┘
  ↑ border-radius: 16px
  ↑ border: 1px solid #D1FAE5
```

---

## Icons

- **Recommended library:** [Phosphor Icons](https://phosphoricons.com) or [Lucide](https://lucide.dev)
- **Style:** Outline (stroke) — matches Poppins' clean, modern feel
- **Sizes:**

| Context | Size |
|---|---|
| Inline with text | `16px` |
| Button icon | `20px` |
| Tab bar / nav | `24px` |
| Hero / feature icon | `32px` |
| Empty state illustration | `48–64px` |

- **Color:** Always use `#059669` (primary) for active icons, `#9CA3AF` for inactive
- **Stroke width:** `1.5px` for sizes under 24px, `1.25px` for 24px and above

---

## Do's and Don'ts

### Colors

| Do | Don't |
|---|---|
| Use `#059669` for one primary CTA per screen | Use two primary green buttons on the same screen |
| Use `#F0FFF4` as the main background | Use pure white `#FFFFFF` as the app background |
| Use `#4B5563` for body descriptions | Use `#1C2D24` for body text — too heavy |
| Use `#9CA3AF` for captions and hints | Use black for placeholder text |

### Typography

| Do | Don't |
|---|---|
| Use Poppins 700 for screen titles | Use weight 800+ — Poppins doesn't need it |
| Keep body text at 14–16px | Go below 12px on any text |
| Use negative letter-spacing on headings | Apply letter-spacing to body text |
| Use `line-height: 1.6` on paragraphs | Use `line-height: 1` — text becomes unreadable |

### Spacing

| Do | Don't |
|---|---|
| Use 20px screen edge padding consistently | Use different side paddings on different screens |
| Space sections 24px apart | Use random spacing — always use the scale |
| Keep tap targets at minimum 44×44px | Make buttons shorter than 44px height |

### General

| Do | Don't |
|---|---|
| Use one accent color (green) as the hero | Add red, blue, orange as UI colors — off-brand |
| Keep cards white on a tinted background | Use white background + white cards (no contrast) |
| Use border-radius 12px for buttons consistently | Mix 8px and 20px radius randomly |

---

## Quick Reference Card

```
COLORS
  Primary       #059669    Buttons, CTAs, icons
  Secondary     #34D399    Hover, progress, accents
  Tint          #A7F3D0    Tags, chips, tinted BG
  Dark          #1C2D24    Headlines, nav
  App BG        #F0FFF4    Screen background
  Card BG       #FFFFFF    Cards, modals

TYPOGRAPHY (Poppins)
  Display       32px  700  -0.5px
  H1            26px  700  -0.3px
  H2            22px  600  -0.2px
  H3            18px  600   0px
  Body large    16px  400   0px   lh 1.6
  Body regular  14px  400   0px   lh 1.6
  Caption       12px  400   0px
  Overline      11px  600   0.08em  UPPERCASE

SPACING
  4 · 8 · 12 · 16 · 20 · 24 · 32 · 48px
  Screen padding: 20px
  Section gap:    24px
  Card padding:   16–20px

RADIUS
  4 · 8 · 12 · 16 · 9999px
  Buttons: 12px
  Cards:   16px
  Pills:   9999px
```

---

*Jade Forest Design System · Built for mobile-first UI · Poppins + Green*