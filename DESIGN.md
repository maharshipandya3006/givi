---
name: Givi Design System
description: High-Velocity Micro-Relief Consumer Platform
colors:
  background: "#09090b"
  surface: "#121216"
  surface-elevated: "#18181f"
  surface-highlight: "#22222b"
  border-subtle: "#1e1e24"
  border-default: "#272732"
  primary: "#10b981"
  primary-hover: "#059669"
  primary-muted: "rgba(16, 185, 129, 0.15)"
  text-primary: "#fafafa"
  text-muted: "#a1a1aa"
  state-warning: "#f59e0b"
  state-danger: "#ef4444"
  glass-light-bg: "#e9e9eb"
  glass-light-ink: "#0e1428"
  glass-dark-plate: "#05070b"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  mono:
    fontFamily: "'SF Mono', Monaco, 'Cascadia Code', Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  micro:
    fontFamily: "'SF Mono', Monaco, monospace"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "16px 32px"
  card-statement:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.3xl}"
    padding: "24px"
---

## Overview

Givi is a high-velocity, consumer-grade micro-relief application built for mobile and desktop web. It replaces traditional, slow, guilt-driven charity appeals with an energetic, dignified, and tactile micro-donation experience. Donors swipe real overdue household utility notices, pharmacy copays, and vital emergency supplies with instant 100% direct PayPal Payouts and zero platform take rates.

## Colors

The palette is anchored in an obsidian void, illuminated by high-voltage emerald energy and urgent amber notices:

- **Deep Obsidian (`#09090b`):** The primary background canvas, providing maximum depth and contrast.
- **Card Surface (`#121216`):** The foundation for tactile cards, modals, and container surfaces.
- **Elevated Surface (`#18181f`):** Used for elevated cards, headers, and secondary interactive pills.
- **Electric Emerald (`#10b981`):** The primary action and celebration hue, signifying direct relief, completed goals, and verified status.
- **Deep Emerald (`#059669`):** Hover and active states for primary actions.
- **Emerald Glow (`rgba(16, 185, 129, 0.15)`): Subtle backdrops for verification badges and impact highlights.
- **Warning Amber (`#f59e0b`):** Urgent shutoff notices and disconnection deadlines.
- **Structural Borders (`#272732`):** Crisp 1px structural dividers framing cards and controls.

## Typography

- **Display & Headlines:** Clean, modern geometric sans-serif (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`) rendered in extra-bold and black weights with tight tracking (`-0.02em` to `-0.03em`).
- **Body:** Neutral, high-legibility sans-serif with comfortable measure (65–75ch) and generous line-height (`1.6`).
- **Data & Numerals:** Monospace (`SF Mono`, `Monaco`, `Menlo`, `Cascadia Code`) paired with `tabular-nums` for all financial figures, countdowns, timestamps, and settlement hashes.

## Layout

- **Unified Navigation Shell:** Fixed top header with pill navigation on desktop and fluid touch targets on mobile.
- **Mobile-First Gestures:** Centered 420px max-width card arena with 600px vertical height, optimized for one-thumb swiping physics.
- **Desktop 12-Column Grids:** Generous whitespace, asymmetric 7/5 splits on hero showcases, and clean 3-column bento grids for system architecture.

## Elevation & Depth

- **Tactile Stacking:** Card stacks utilize scale and opacity transformations (`scale(0.96) translate-y(3)` for card 2, `scale(0.92) translate-y(6)` for card 3) to create authentic physical depth.
- **Soft Shadows:** `box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7)` on cards and `0 8px 24px -4px rgba(16, 185, 129, 0.3)` on primary action buttons. Zero harsh neobrutalist block offsets.

## Shapes

- **Smooth Rounded Corners:** `rounded-3xl` (24px–32px) on outer containers and statement cards; `rounded-2xl` on inner form inputs and control buttons; `rounded-full` on badges and pill filters.

## Components

- **Statement Card (`CauseCard`):** Displays beneficiary name, city/state, category badge, Gemini Trust percentage, zoomable statement document, remaining amount in bold monospace, and high-contrast progress bar.
- **Swipe Deck (`SwipeDeck`):** Orchestrates touch gestures via `react-tinder-card`, desktop action buttons, keyboard arrow shortcuts, empty deck state, and celebratory confetti.
- **Impact Toast (`ImpactToast`):** Floating pill animating in upon completed swipe, showing contextual AI gratitude text crafted by Gemini.
- **Audit Ledger (`TransparencyGrid`):** AG Grid React table with instant filtering, PayPal transaction hash inspection, and CSV export.

## Do's and Don'ts

- **DO** use tabular numerals (`tabular-nums font-mono`) for all financial amounts and calculations.
- **DO** provide keyboard navigation (Arrow Left, Arrow Right, Arrow Up, Space) alongside touch gestures.
- **DO** verify real bill documents with automatic PII masking before displaying to donors.
- **DON'T** use kickers or eyebrows above headings.
- **DON'T** use gradient text; let headings carry authority through size, weight, and contrast.
- **DON'T** use decorative gimmicks (such as fake tape or repeating tickers) that degrade product credibility.
- **DON'T** display private bank accounts, full street addresses, or sensitive personal data.

