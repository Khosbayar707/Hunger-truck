# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, static export) + TypeScript + Tailwind CSS, local-first storage, PWA (manifest + service worker). Chosen by the user over the incumbent vanilla HTML/JS build. Keep dependencies minimal.

## Users

One person: the owner. Mongolian speaker, uses the app on their phone (iPhone or Android) several times a day, often one-handed, in short moments: right when hunger hits, when starting or breaking a fast, after weighing in in the morning.

## Product Purpose

A private health journal combined with a fasting timer. It answers five questions at a glance: How am I doing today? How long have I been fasting? When do I usually feel the most hungry? What patterns appear over time? What is my current body trend? Loop: Track → Understand → Improve. Success is consistent small entries, not volume of statistics.

## Positioning

The hunger-by-time-of-day record is the core: a 1–10 hunger log taken in under five seconds, tied to the fasting state at that moment, so the owner can see when in the day (and when in a fast) hunger peaks. Generic fasting timers and calorie apps do not answer that question.

## Operating Context

- Mobile-first, installed to the home screen. Desktop supported but secondary.
- Short sessions; bottom sheets for small entries, no keyboard-heavy forms.
- Four tabs: Өнөөдөр, Мацаг, Түүх, Тохиргоо.
- All UI copy in Mongolian (Cyrillic).

## Capabilities and Constraints

- Fasting sessions: start/stop, goals 12:12, 14:10, 16:8, 18:6, 20:4, custom; eating window shown; history with completed/incomplete; editable start time.
- Hunger entries: intensity 1–10, timestamp, fasting flag/hours into fast, optional reason, mood, note.
- Weight, sleep (sleep start/wake, duration), water (amount, daily goal).
- Optional metrics, hidden by default: blood glucose, ketones, blood pressure, heart rate, steps.
- Height in settings for BMI.
- Hourly hunger prompt (opt-in, quiet hours). No push server, so reminders are only reliable while the app is open.
- Data stays on device. Export JSON/CSV, import JSON, delete all. No accounts, no backend.
- Legacy vanilla data in localStorage key `hungertruck.v1` (hunger on a 1–5 scale) should migrate.

## Brand Commitments

- Name: Hunger Truck.
- Voice: neutral, quiet, private ("Таны мэдээлэл", "Таны хэв маяг"). No praise for weight loss, no gamification, badges, streak pressure, social, or sharing. The owner asked (2026-10-07) for an Урам зориг card: steady, plain encouragement about getting through hunger and returning to the habit, never about weight or looks, never pushing past body signals, with any fact drawn from their own records.
- Health safety: tracking tool, not diagnosis. Never encourage extreme fasting or restriction. One secondary, non-alarming safety note about dizziness/fainting.
- User-pinned look (v3, 2026-10-07, replaces the earlier tide-table look): premium iOS-inspired personal health app, not an Apple Health clone. Montserrat typeface (user choice over system font). Soft off-white canvas (~#F5F5F7), white grouped surfaces with soft depth, three depth levels (background, grouped surfaces, hero). Meaningful per-metric color identity: fasting/primary green-mint, hunger warm amber, water blue, sleep indigo, weight green; color for progress, status, chart series, icons, key numbers — never full backgrounds, never rainbow. Red only for real warnings. Large light-to-medium numerals as anchors. iOS-style grouped settings, green switches, segmented controls, floating translucent tab bar, bottom sheets for entry. Premium dark mode (deep charcoal, not pure black). No glass everywhere, no heavy gradients or shadows.

## Evidence on Hand

No real user data yet. Never show fake statistics: insights and charts appear only from recorded entries, with honest empty states otherwise.

## Product Principles

1. Right now first: fasting status and timer dominate.
2. Logging must be nearly free: hunger in under five seconds, water in one tap.
3. Observations first, then gentle advice: insights describe the owner's own data only; the Зөвлөгөө section offers fixed, general, safety-minded tips picked to fit the current state (fast phase, hunger peak, sleep, water), never invented numbers.
4. Quiet over clever: nothing pulses, celebrates, or nags.
5. Private by construction: local data, visible export and delete.

## Accessibility & Inclusion

Large touch targets, one-handed reach for primary actions, readable contrast in both themes, tabular numerals, respects reduced motion.
