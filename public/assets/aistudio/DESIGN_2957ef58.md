---
name: Civic Trust Mobile
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444653'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#002e81'
  on-tertiary: '#ffffff'
  tertiary-container: '#0042b2'
  on-tertiary-container: '#a4b9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1rem
  margin-sm: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is tailored for community governance, property resolution surveys, and municipal-grade owner voting workflows on mobile devices. The visual atmosphere conveys civic authority, absolute impartiality, and dependable clarity. 

The aesthetic marries **Corporate / Modern** precision with modern mobile civic tech:
- **Clean Structure:** Generous breathing room, well-defined content grouping, and high-readability form controls to prevent voting fatigue.
- **Trustworthy & Institutional:** Structured card hierarchies and unambiguous verification badges reassure homeowners of data integrity and legal rigor.
- **Accessible & Touch-First:** Oversized selection states, generous 48px minimum touch targets, and unmistakable visual feedback ensure high adoption across diverse age demographics.

## Colors

The color architecture enforces clarity, institutional trust, and analytical transparency.

### Core Roles
- **Primary (`#1E40AF`):** Deep civic blue. Applied to top navigation app bars, authoritative headers, affirmative submit states, and primary decision CTAs.
- **Secondary (`#059669`):** Civic emerald green. Designates verified voter status, completion progress indicators, consensus highlights, and positive poll thresholds.
- **Tertiary (`#2563EB`):** Interactive bright blue. Used for active selection borders, interactive links, radio/checkbox checked accents, and real-time step trackers.
- **Neutral (`#64748B`):** Structural slate. Powers meta-labels, secondary voting notes, supporting instructions, and subtle divider contexts.

### Surfaces & Backgrounds
- **Canvas Base:** `#F8FAFC` (Off-slate canvas that softens glare during prolonged survey completion).
- **Surface Elevation:** `#FFFFFF` (Pure white containers for voting ballot modules and analytic card sections).
- **Dividers & Borders:** `#E2E8F0` for structural separators; `#CBD5E1` for unselected form control boundaries.
- **Text Tiers:** `#0F172A` for primary titles and legal terms; `#1E293B` for questionnaire body text; `#64748B` for helper annotations and timestamps.

### Statistical & Chart Accents
For data visualization modules (turnout rate, voting distribution, quorum progress):
- **Option A / Affirmative:** `#2563EB`
- **Option B / Conditional:** `#059669`
- **Option C / Objection:** `#E11D48`
- **Option D / Abstention:** `#94A3B8`
- **Quorum Met Fill:** `#10B981`

## Typography

The typographic hierarchy uses `Plus Jakarta Sans` across all roles, balancing corporate clarity with approachable geometric legibility. Chinese strings systematically fall back to standard system fonts (`PingFang SC`, `Hiragino Sans GB`, `Microsoft YaHei`).

### Hierarchy Guidelines
- **Ballot & Metric Headlines (`headline-lg-mobile`, `headline-md`):** Reserve `headline-lg-mobile` for page-level survey titles and total turnout KPIs. Use `headline-md` for distinct questionnaire section titles and modal headers.
- **Question Stems (`headline-sm`, `body-lg`):** Survey question prompts utilize `headline-sm` with `600` weight to distinguish instructions from choices.
- **Answer Labels & Content (`body-md`, `label-lg`):** Choice options rely on `body-md` for description text and `label-lg` for the primary title of each vote option.
- **Metadata & Data Labels (`label-sm`, `body-sm`):** All household unit tags, timestamp stamps, audit hashes, and chart legends use uppercase or high-contrast subtle rendering.

## Layout & Spacing

The layout model is optimized strictly for mobile portrait viewports with a 4-column responsive grid on phones, shifting to an 8-column layout on compact tablets.

### Layout Principles
- **Outer Canvas Padding:** Screen-edge margin is anchored at `margin` (16px / `1rem`), reducing to `margin-sm` (12px) on narrow screens (<360px width) to maximize question reading area.
- **Card Gutter Rhythm:** Form cards and statistical modules use `space-lg` (16px) vertical stack spacing. Sub-questions within a card use `space-md` (12px) separations.
- **Touch-Boundary Protection:** All clickable voting cards and button controls maintain an internal padding of at least `space-lg` (16px) along horizontal axes and `space-md` (12px) along vertical axes to guarantee a touch target of ≥ 48px.
- **Sticky Footer Action Bar:** Single-action or split-action submission bars sit fixed at the bottom with safe-area padding (`env(safe-area-inset-bottom)`) and `space-lg` lateral gutters.

## Elevation & Depth

This system utilizes **Tonal Layers** combined with **Low-Contrast Outlines** rather than heavy drop shadows, reinforcing trust, clean survey execution, and optical reliability.

### Elevation Levels
- **Base Canvas (Level 0):** Background set to `#F8FAFC`. Zero elevation.
- **Cards & Question Containers (Level 1):** Solid `#FFFFFF` fill resting on a clean `1px solid #E2E8F0` border. Ambient shadow: `0px 1px 3px rgba(15, 23, 42, 0.04)`.
- **Selected Choice / Focus State (Level 2):** Elevated interactive option card. Border changes to `1.5px solid #2563EB`, background shifts to `#EFF6FF`, with a subtle tint-infused shadow: `0px 4px 12px rgba(37, 99, 235, 0.08)`.
- **Floating Modals & Action Drawers (Level 3):** Verification sheets, legal signature pads, and rule disclosure bottom sheets use `#FFFFFF` with `0px -4px 20px rgba(15, 23, 42, 0.10)` and a translucent backdrop scrim (`rgba(15, 23, 42, 0.45)`).
- **Stat Tooltips & Floating Progress Indicator (Level 4):** Anchored top bar or floating tally badges use `0px 8px 16px rgba(15, 23, 42, 0.12)`.

## Shapes

The design system adopts a **Rounded (`2`)** shape vocabulary:
- **Default Elements:** Standard input fields, choice options, alert boxes, and action buttons feature an 8px (`0.5rem`) corner radius.
- **Container Surfaces (`rounded-lg`):** Survey question cards, data dashboard tiles, and modal bodies use a 16px (`1rem`) corner radius.
- **Interactive Pills (`rounded-xl`):** Survey category filters, verified voter badges, and step progress chips use full pill shapes or 24px (`1.5rem`) radii.
- **Strict Geometric Controls:** Radio buttons remain strictly circular (`50%`), while checkboxes employ a soft 4px (`0.25rem`) inner-radius for crisp mechanical selection.

## Components

### Buttons
- **Primary Action (Confirm/Submit Vote):** Full-width mobile CTA, 48px height, `#1E40AF` background, white label, 8px radius. Active tap state scales down to `0.98` with `#1E3A8A`. Disabled state: `#CBD5E1` with `#94A3B8` text.
- **Secondary Action (Save Draft / View Scheme PDF):** Surface `#FFFFFF`, border `1px solid #E2E8F0`, text `#1E293B`.
- **Destructive/Reset Action:** Borderless text button with `#E11D48` color.

### Form Selection Controls (Single-Choice & Multi-Choice)
- **Selectable Option Cards:** Questions must present answers as full-width tap cards rather than bare radio inputs. 
  - *Unselected:* Background `#FFFFFF`, border `1px solid #E2E8F0`, padding `14px 16px`.
  - *Selected:* Background `#EFF6FF`, border `1.5px solid #2563EB`, title text `#1E40AF`.
- **Radio Buttons:** Outer ring 20px, `#CBD5E1` unselected; when checked, `#2563EB` ring with 10px solid center dot.
- **Checkboxes:** 20px box, 4px roundedness. Checked state fills `#2563EB` with a crisp white check icon.

### Form Input Fields
- **Household ID / Owner Input:** 48px height, `#FFFFFF` background, border `1px solid #CBD5E1`. Focused border shifts to `1.5px solid #2563EB` accompanied by an accessible glow ring (`box-shadow: 0 0 0 3px rgba(37,99,235,0.15)`).
- **Validation Message:** 12px font size placed 4px below the input; errors in `#DC2626`, valid confirmation in `#059669`.

### Survey & Analytic Cards
- **Ballot Item Card:** Includes a question badge (`Question 01`), mandatory marker (`*`), stem text, option list, and optional collapsible scheme explanation drawer.
- **Statistical Progress Card:** Displays current vote distribution with a stacked horizontal bar (`height: 10px`, `border-radius: 5px`). Accompanied by percentage readouts in bold tabular numerals and owner count totals.

### Voter Status Badges & Chips
- **Real-Name Verified Badge:** `#ECFDF5` green tint background, `1px solid #A7F3D0`, `#065F46` label with a shield-check SVG icon.
- **Vote Phase Tag:** Neutral grey `#F1F5F9`, `#475569` text for "Under Voting"; `#EFF6FF` and `#1E40AF` for "Resolving".

### Statistical Chart Elements
- **Quorum Meter:** Circular progress or dual-bar tracker displaying "Total Building Area Represented" and "Total Household Count Represented" in compliance with property governance regulations. Target indicator line placed at the statutory two-thirds (66.7%) mark.