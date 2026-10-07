---
name: Hunger Truck
description: A private hunger and fasting journal that feels native on an iPhone.
colors:
  canvas: "#f5f5f7"
  surface: "#ffffff"
  elevated: "#ffffff"
  fill: "#e9e9ec"
  fill-2: "#f1f1f3"
  ink: "#1c1c1e"
  ink-2: "#66666d"
  ink-3: "#a1a1a8"
  separator: "rgb(60 60 67 / 0.12)"
  fasting-green: "#2fb27a"
  fasting-green-ink: "#1c7f54"
  fasting-green-soft: "rgb(47 178 122 / 0.12)"
  hunger-amber: "#f4a12a"
  hunger-amber-ink: "#a65a0a"
  hunger-amber-soft: "rgb(244 161 42 / 0.14)"
  water-blue: "#3b8bf6"
  water-blue-ink: "#1f66d1"
  water-blue-soft: "rgb(59 139 246 / 0.12)"
  sleep-indigo: "#6f68f0"
  sleep-indigo-ink: "#4c44d6"
  sleep-indigo-soft: "rgb(111 104 240 / 0.12)"
  weight-teal: "#22a58b"
  weight-teal-ink: "#137a66"
  weight-teal-soft: "rgb(34 165 139 / 0.12)"
  danger: "#d6453a"
  scrim: "rgb(0 0 0 / 0.28)"
  material: "rgb(255 255 255 / 0.72)"
  toast-ink: "#2c2c2e"
  dark-canvas: "#111113"
  dark-surface: "#1c1c1f"
  dark-elevated: "#232327"
  dark-fill: "#39393e"
  dark-fill-2: "#2a2a2e"
  dark-ink: "#f3f3f5"
  dark-ink-2: "#a3a3ab"
  dark-ink-3: "#6e6e76"
  dark-fasting-green: "#3fcf8f"
  dark-fasting-green-ink: "#4fd99c"
  dark-hunger-amber: "#ffb547"
  dark-hunger-amber-ink: "#ffbe5c"
  dark-water-blue: "#5aa2ff"
  dark-sleep-indigo: "#8f89ff"
  dark-weight-teal: "#3cc9ab"
  dark-danger: "#ff6b5e"
  dark-on-accent: "#08130e"
typography:
  display:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "4.25rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.05em"
    fontFeature: "'tnum' 1"
  figure:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.035em"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: "1.4rem"
  body:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.4rem"
    letterSpacing: "-0.005em"
  footnote:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.15rem"
  caption:
    fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.05rem"
rounded:
  xs: "10px"
  sm: "14px"
  md: "18px"
  lg: "22px"
  xl: "28px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
components:
  hero:
    backgroundColor: "{colors.elevated}"
    rounded: "{rounded.xl}"
    padding: "16px 20px 20px"
  group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  group-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0 16px"
    height: "52px"
  button-primary:
    backgroundColor: "{colors.fasting-green-ink}"
    textColor: "{colors.surface}"
    rounded: "16px"
    padding: "0 20px"
    height: "52px"
  button-tinted-hunger:
    backgroundColor: "{colors.hunger-amber-soft}"
    textColor: "{colors.hunger-amber-ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "48px"
  button-quiet:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "48px"
  button-text:
    textColor: "{colors.fasting-green-ink}"
    height: "44px"
    padding: "0 4px"
  field:
    backgroundColor: "{colors.fill-2}"
    textColor: "{colors.ink}"
    rounded: "12px"
    padding: "0 14px"
    height: "48px"
  switch-on:
    backgroundColor: "{colors.fasting-green}"
    rounded: "{rounded.full}"
    width: "51px"
    height: "31px"
  switch-off:
    backgroundColor: "{colors.fill}"
    rounded: "{rounded.full}"
    width: "51px"
    height: "31px"
  segmented:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink-2}"
    rounded: "12px"
    padding: "3px"
  segmented-thumb:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    height: "36px"
  metric-badge:
    backgroundColor: "{colors.hunger-amber-soft}"
    textColor: "{colors.hunger-amber-ink}"
    rounded: "{rounded.xs}"
    size: "30px"
  widget:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
    width: "148px"
    height: "148px"
  tab-bar:
    backgroundColor: "{colors.material}"
    rounded: "26px"
    padding: "6px"
  tab-active:
    backgroundColor: "{colors.fasting-green-soft}"
    textColor: "{colors.fasting-green-ink}"
    rounded: "20px"
    height: "54px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "24px 24px 0 0"
    padding: "0 20px"
  toast:
    backgroundColor: "{colors.toast-ink}"
    textColor: "{colors.surface}"
    typography: "{typography.footnote}"
    rounded: "{rounded.full}"
  chart-tooltip:
    backgroundColor: "{colors.elevated}"
    rounded: "12px"
    padding: "6px 12px"
---

# Design System: Hunger Truck

## Overview

**Creative North Star: "The Pocket Health Space"**

Hunger Truck v3 is a private health space that should feel like it shipped with the phone. One living fasting hero sits at the top of the Today screen, a tactile amber hunger action sits directly under it, today's body signals ride a horizontal strip of small widgets, and the hunger-by-hour curve is the signature every other screen points back to. The world is borrowed from iOS conventions (grouped lists, green switches, sliding segmented thumbs, a floating material tab bar, bottom sheets) but voiced in Montserrat with large light numerals, so it reads as a premium personal app rather than an Apple Health clone.

Density is calm: one hero, then grouped white surfaces on a soft off-white canvas, generous 16–32px gaps between groups, nothing pulsing. Color is semantic, not decorative: each metric owns exactly one hue and that hue appears only on progress, series, icons, key numbers and small tinted wells. The build refuses the flat settings-form look of v2 and the generic analytics dashboard; charts appear only from recorded entries and stay single-series.

**Key Characteristics:**
- Three depth levels: canvas (L1), grouped surface (L2), lifted hero and floating chrome (L3).
- One hue per metric: fasting green, hunger amber, water blue, sleep indigo, weight teal.
- Light (300) Montserrat numerals with tabular figures as the visual anchors.
- iOS-grade controls with real physics: ease-ios curve, 180–440ms.
- Charted data is scrubbable by finger, with an elevated tooltip.
- Premium charcoal dark mode, never pure black.

## Colors

A quiet neutral system (warm-grey canvas, white surfaces, three ink steps) carrying five metric hues, each in three strengths: fill, ink (text-safe), and soft (12–14% tint).

### Primary
- **Fasting Green** (fasting-green): the fasting metric and the app's primary progress color. Fasting progress bar and 24h dial arc, active switch track, focus-adjacent selection tint, fasting widgets.
- **Deep Fasting Green** (fasting-green-ink): text-safe green. The primary action button fill in light mode, text buttons, the active tab label, "goal reached" text. In dark mode the primary button flips to the bright fill with dark on-accent text.

### Secondary
- **Hunger Amber** (hunger-amber / hunger-amber-ink / hunger-amber-soft): the hunger metric and the product's core signal. Hunger slider fill, the hunger-by-hour area chart and its peak band, the hunger log button (soft well + ink text), today's average and peak-window numerals.

### Tertiary
- **Water Blue** (water-blue family): water widget, the daily water bar, drop-glass day columns, quick +250/+500 wells.
- **Sleep Indigo** (sleep-indigo family): sleep widget and sleep day bars; also reused for glucose and blood pressure vitals.
- **Weight Teal** (weight-teal family): weight and BMI widgets, the weight trend area, neutral trend triangles.

### Neutral
- **Soft Canvas** (canvas): the L1 page ground and theme-color meta.
- **White Surface / Elevated** (surface, elevated): L2 groups and L3 hero, sheets, tooltips. Identical in light; split in dark.
- **Fill / Fill 2** (fill, fill-2): control tracks, inactive switch, segmented track, empty bar stubs (fill); pressed rows, input wells, inset fact strips inside cards (fill-2).
- **Ink / Ink 2 / Ink 3** (ink, ink-2, ink-3): primary text; secondary labels, units and axis ticks; placeholder numerals, detents, "now" markers.
- **Separator** (separator): inset half-pixel row rules and chart gridlines.
- **Danger** (danger): destructive rows and error toasts only.

### Named Rules
**The One Hue Per Metric Rule.** Fasting is green, hunger is amber, water is blue, sleep is indigo, weight is teal. A metric's hue never appears on another metric's chart or number, and no screen shows a rainbow of hues outside the widget strip.

**The No Color Grounds Rule.** Color never fills a canvas, group or hero background. Hues appear as fills on progress, series, icons and key numerals; as soft 12–16% tints only on small wells (badges, chips, the active tab pill, tinted buttons, the hourly nudge). One soft radial green-soft glow in the active fasting hero's corner is the only hue on a large surface.

**The Ink Step Rule.** Text on light uses the -ink variant of a hue, never the raw fill; the raw fill is for strokes, bars and dots.

**The Red Means Real Rule.** Danger appears only on delete actions and error toasts. Nothing in tracking data is ever red.

## Typography

**Display Font:** Montserrat (with system-ui, -apple-system, Segoe UI fallback), loaded with Latin and Cyrillic subsets, weights 300–700.
**Body Font:** Montserrat, same stack.

**Character:** One family carries the whole app. Numbers are set light (300) and large with tight negative tracking and tabular figures so they read as instruments; labels are set semibold and small so they read as quiet annotations. Base body tracking is -0.005em.

### Hierarchy
- **Display** (300, 4.25rem/68px, 1, -0.05em, tnum): the fasting timer in the Today hero only.
- **Figure** (300, 2.25rem/36px, 1, -0.035em, tnum): stat numerals in History summaries. Most in-card numerals are set as one-off light sizes between 28px and 46px (see Deviations).
- **Headline** (600, 30px, 1.15, -0.03em): screen large titles. Collapses to a 15px semibold compact bar title on scroll.
- **Group title** (600, 19px, -0.02em) and **sheet title** (600, 20px, -0.02em): section headings above groups and in sheets.
- **Title** (600, 1.0625rem/17px, 1.4rem): card titles, hunger word under the sheet readout.
- **Body** (400–600, 0.9375rem/15px, 1.4rem): row labels, explanatory sentences (max 30–34ch), tooltip values.
- **Footnote** (500–600, 0.8125rem/13px): units, sub-labels, pills, widget labels, toast text, segmented labels.
- **Caption** (400, 0.75rem/12px): widget feet, tooltip timestamps, scale numbers. Chart axis ticks and tab labels run at 10.5–11px.

### Named Rules
**The Light Numeral Rule.** Every key number is weight 300, tabular, tracked between -0.03em and -0.05em, and colored with its metric's ink (or plain ink for the fasting clock). Labels next to it drop to footnote 500 in ink-2.

**The No Uppercase Rule.** No tracked-out uppercase labels or eyebrows. Section names are sentence-case group titles outside the group, iOS style.

## Layout

Single column, phone-first. Content sits in a centered column capped at 34rem with a 16px side gutter; header text and group titles are inset a further 4px. The top padding respects the safe-area inset plus 14px; the bottom reserves safe-area plus 112px so the floating tab bar never covers content.

Spacing follows a 4px base: 4 / 8 / 12 / 16 / 20 / 24 / 32. Groups are separated by 32px (group title top margin) with a 10px gap to their title; card interiors pad at 16px (widgets, hunger card) or 20px (hero, pattern card); rows are 16px horizontal. The today-widget strip bleeds to the screen edge with scroll-snap and 12px gaps, the one horizontal scroller in the app.

Touch targets are at least 44px; rows at least 52px; primary actions 52px and full width at thumb height inside their card.

## Elevation & Depth

A three-level lifted system. Shadows are ambient and very soft, never structural outlines. In dark mode shadows are replaced by a 1px white hairline ring (4–6% white) plus a deep drop for floating layers, and the levels separate by lightness (#111113 → #1c1c1f → #232327).

### Shadow Vocabulary
- **L2 grouped** (`0 1px 2px rgb(16 24 20 / 0.04), 0 6px 18px rgb(16 24 20 / 0.045)`): every grouped surface, widget and card.
- **L3 hero** (`0 2px 6px rgb(16 24 20 / 0.04), 0 18px 40px rgb(16 24 20 / 0.08)`): the fasting hero on Today and Fast.
- **Float** (`0 8px 30px rgb(16 24 20 / 0.12), 0 1px 3px rgb(16 24 20 / 0.06)`): tab bar, bottom sheet, toast, chart tooltip.
- **Control thumb** (`0 3px 8px rgb(0 0 0 / 0.1), 0 1px 1px rgb(0 0 0 / 0.06)`): segmented thumb, switch knob, hunger slider thumb.

### Named Rules
**The One Hero Rule.** Each screen has at most one L3 surface. Everything else is L2 on the canvas.

**The Material Only Floats Rule.** Translucent blurred material (72% surface, saturate 180% blur 20–24px) is used only on the floating tab bar and the collapsed title bar. No glass on cards.

## Shapes

Continuous, generous rounding on a five-step scale: 10px (badges, segmented thumb, inline time inputs), 14px (tinted and quiet buttons, inset fact strips), 18px (grouped surfaces, widgets, skeletons, inset wells), 22px (the hunger sheet readout), 28px (hero). Floating chrome sits off-scale and larger: tab bar 26px, active tab 20px, sheet top 24px. Pills, switches, progress bars, slider and toasts are fully round. Row separators are inset half-pixel hairlines starting 16px from the leading edge (or after the icon badge). Chart bars have 8px rounded tops; lines use round caps and Catmull-Rom smoothing.

## Components

### Fasting Hero
The heart of Today. L3 surface, 28px radius, 16/20/20px padding. A status pill (green-soft dot pill while fasting, fill-2 when not) on the left, a goal chip (e.g. 16:8) on the right that opens the goal sheet. The 68px light timer, a footnote caption, a 12px green progress bar on a green-soft track, remaining time and start → end times, then a full-width primary button. A single green-soft radial glow sits off the top-right corner only while fasting. On the Fast tab the hero hosts a 24h dial: an 18px stroke ring on fill-2, the planned span in green-soft, elapsed in green (draws in over 900ms), hour ticks, and a ringed "now" dot.

### Buttons
- **Shape:** 16px radius for primary, 14px for tinted and quiet.
- **Primary:** deep fasting green fill, white 16px semibold label, 52px tall, full width in cards. Dark mode: bright green fill with dark on-accent text.
- **Tinted:** a metric's soft tint with its ink text (amber "log hunger", blue water amounts). 48–52px.
- **Quiet:** fill-2 neutral well with ink text, darkens to fill on press.
- **Text:** green-ink 15px semibold, no chrome, still 44px tall.
- **Press:** scale to 0.97 with a slight brightness drop over 180ms ease-out-soft. Disabled at 35–40% opacity.

### Grouped List Rows
White group, 18px radius, L2 shadow, overflow clipped. Rows are 52px minimum, 16px horizontal padding, 12px gap, with an inset half-pixel separator that skips the last row. Interactive rows press to fill-2. Sections get a sentence-case 19px group title and optional footnote outside the group.

### Switch
51×31 iOS geometry. Fasting-green track when on, fill when off; a 27px white knob with a soft two-layer shadow slides 20px over 300ms ease-ios. Always rendered inside a row whose button carries `role="switch"`.

### Segmented Control
Fill track at 70% with 3px padding and 12px radius; a white elevated thumb (10px radius, dark mode #48484e) slides between equal segments over 300ms ease-ios. Labels are 13px, semibold ink when selected, medium ink-2 otherwise; 36px tall.

### Metric Badges
A 26–36px square with 10px radius, the metric's soft tint behind its ink-colored 16–20px line icon. Badges are the identity mark at the head of every widget, card and settings row.

### Today Widgets
A horizontal snap strip. Water is a wider 236px card: badge + label, a 30px light blue numeral over the goal, an 8px blue bar, and two +250/+500 blue-soft quick buttons (40px). Other metrics are 148px square L2 buttons: badge + footnote label, a 28px light numeral in the metric ink with unit, and a caption foot (relative day, time range, or a neutral trend triangle). Empty metrics show "+ Нэмэх" in their ink instead of a fake value.

### Hunger Scale
The tactile 1–10 input. A 52px hit area holds a 10px fill track; the amber fill fades from 55% to full amber, ten 4px detents turn white once passed, and a 30px white thumb snaps to whole values with a 5ms haptic tick. Tap, drag, arrow and number keys all work. Under it, numbers 1–10 in caption with the selected one bold amber-ink. Above it, in the sheet, a 22px-radius readout well tints toward amber as intensity rises and shows the value at 72px light.

### Bottom Sheet
Surface, 24px top radius, Float shadow, max 88dvh, capped at 34rem. Slides up over a 28% black scrim (50% in dark) with a 440ms ease-ios transform, scrim fades over 400ms. A 36×5 grab handle (drag past 90px closes), 20px semibold title, a 30px round close button inside a 44px target, scrollable body, and a footer that holds the one primary action above the safe area.

### Navigation (Tab Bar)
Floating, not docked: a 26px-radius material pill 12px from the screen sides and 8px above the home indicator, Float shadow, 6px inner padding. Four equal 54px tabs with a 22px line icon over a 10.5px label. The active tab sits in a green-soft 20px pill with green-ink semibold label and a heavier 1.9 stroke; inactive tabs are ink-2 at 1.6 stroke. Press scales to 0.95. Each screen has an iOS large title that collapses into a 44px material bar with a 15px centered title on scroll.

### Toast
A dark #2c2c2e pill (danger for errors) floating 92px above the safe area, footnote white text, pops in over 200ms. An optional undo action sits in a white/15 inner pill. Auto-dismisses after 2.4s, or 4.5s when it carries an action.

### Charts
All single-series in the owning metric's hue, drawn in a 340-wide SVG viewBox, with an sr-only figcaption listing every value.
- **Hunger by hour (signature):** smooth amber line (2.5px) over an amber gradient area (32% → 2%), gridlines at 2.5/5/7.5, the peak window as a 12% amber band with a ringed peak dot and its value, a dashed ink-3 "now" line, 3-hour axis ticks.
- **Trend area:** weight and vitals, same anatomy in the metric hue, with the latest point haloed and labeled.
- **Day bars:** fasting and sleep per day; bars at 32% opacity with the latest (or scrubbed) bar at full strength, a goal line at 35%, empty days as 4px fill stubs; bars grow in staggered by 24ms.
- **Water days:** one rounded drop-glass per day filled to the share of the goal, solid blue only when met.
- **Scrub tooltips:** press or hover anywhere on a chart to scrub to the nearest point; an elevated 12px-radius tooltip with Float shadow pops above, clamped inside the chart, showing a caption timestamp and the value in the metric ink. A scrub line and filled dot mark the point; touch tooltips linger 1.4s after release.

### Motion
Two curves: **ease-ios** `cubic-bezier(0.32, 0.72, 0, 1)` for physical controls (sheet, switch, segmented thumb) and **ease-out-soft** `cubic-bezier(0.22, 1, 0.36, 1)` for presses, entrances and data. Durations: 160–200ms presses and color, 300ms controls, 340ms screen rise-in (8px), 400–440ms sheet and scrim, 520ms bar growth, 700ms progress width, 900ms line draw-in. Reduced motion collapses all animation and transition to 1ms. Nothing loops or pulses.

### Dark Mode
Deep charcoal, not black: canvas #111113, surface #1c1c1f, elevated #232327, fills #39393e / #2a2a2e. Every hue brightens one step for both fill and ink, soft tints rise to 16–17%, shadows become hairline rings, material becomes 72% #242428. Theme follows system or an explicit setting, applied before paint.

## Do's and Don'ts

### Do:
- **Do** give every metric surface its hue through a badge, a numeral, a progress fill or a series, and nothing more.
- **Do** set key numbers in Montserrat 300 with tabular figures and tight tracking; pair them with a footnote unit in ink-2.
- **Do** keep each screen to one L3 hero; put everything else in 18px-radius L2 groups on the canvas.
- **Do** put small entries in a bottom sheet with one full-width primary action in the footer.
- **Do** use ease-ios for anything that moves like a physical control and keep durations between 180 and 440ms.
- **Do** make every chart scrubbable and back it with an sr-only value list.
- **Do** show honest empty states ("+ Нэмэх", progress toward the minimum entries) instead of placeholder data.

### Don't:
- **Don't** fill a canvas, group, hero or sheet background with a metric hue; tints belong on small wells only.
- **Don't** use a metric's raw fill for text on light; use its -ink step.
- **Don't** use red for anything except deletion and errors.
- **Don't** put translucent material on cards; only the tab bar and collapsed title bar float.
- **Don't** add uppercase eyebrows, kickers, streaks, badges-as-rewards or celebratory motion.
- **Don't** draw multi-series dashboards; one metric, one hue, one chart.
- **Don't** use pure black (#000) for the dark canvas.

### Known deviations in the build
- In-card numerals use one-off sizes (28, 30, 34, 38, 44, 46, 56, 72px) instead of the display/figure tokens; the headline token (1.75rem) is unused because screen titles are hard-set at 30px, group titles at 19px and sheet titles at 20px. Fold these into the ramp before adding more.
- Several radii sit off the 10/14/18/22/28 scale (primary button 16px, field and segmented track 12px, sheet 24px, tab bar 26px, active tab 20px).
- The amber primary button (hunger sheet footer, hidden-hunger fallback) hard-codes white text on amber-ink; in dark mode amber-ink is #ffbe5c, so that label fails contrast and should use on-accent.
- The hunger sheet readout tints its 22px well up to ~22% amber, the largest hue tint in the app; it is tolerated as a sheet-local value readout, not a pattern for surfaces.
