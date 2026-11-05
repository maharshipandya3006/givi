# UI Context — Givi Design System

## Theme & Visual Language
Givi adopts a **dignified, modern, high-contrast fintech aesthetic**. It rejects the pitiful, low-budget look of traditional charity sites in favor of crisp, statement-style typography, rich tactile surfaces, smooth physical gesture physics, and celebratory micro-interactions.

Both **Dark** and **Light** modes are fully supported with semantic CSS tokens. Dark mode defaults to an ink-black canvas (`#09090b`) with layered zinc cards (`#18181b`), emerald success accents, and warm amber warnings.

---

## Colors

| Role | CSS Variable | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| Page Background | `--bg-base` | `#f8fafc` | `#09090b` | Main viewport canvas |
| Surface / Card | `--bg-surface` | `#ffffff` | `#18181b` | Swipeable cause cards & dialogs |
| Elevated Surface | `--bg-elevated` | `#f1f5f9` | `#27272a` | Hover states, pill badges, inputs |
| Primary Text | `--text-primary` | `#0f172a` | `#fafafa` | Headlines, bill amounts, titles |
| Muted Text | `--text-muted` | `#64748b` | `#a1a1aa` | Labels, timestamps, secondary notes |
| Brand Primary (Heart) | `--accent-primary`| `#0070ba` | `#0070ba` | PayPal blue, brand highlights, CTAs |
| Success / Paid | `--state-success` | `#10b981` | `#10b981` | Fully funded badges, right-swipe glow |
| Warning / Urgency | `--state-warning` | `#f59e0b` | `#f59e0b` | Approaching deadline, partial trust |
| Danger / Redacted | `--state-danger` | `#ef4444` | `#ef4444` | Skip gesture indicator, low trust |
| Border Default | `--border-default`| `#e2e8f0` | `#27272a` | Card borders, dividers, outlines |

---

## Category Color Accents

- **⚡ Utilities & Power:** Amber/Orange (`#f59e0b` / `bg-amber-500/10 text-amber-500`)
- **💊 Medical & Healthcare:** Emerald/Cyan (`#10b981` / `bg-emerald-500/10 text-emerald-500`)
- **🎒 Education & Youth:** Indigo/Blue (`#6366f1` / `bg-indigo-500/10 text-indigo-500`)
- **🍞 Food & Groceries:** Rose/Red (`#f43f5e` / `bg-rose-500/10 text-rose-500`)
- **🌱 Climate & Environment:** Teal/Green (`#14b8a6` / `bg-teal-500/10 text-teal-500`)
- **🤝 Community & Rights:** Purple/Violet (`#8b5cf6` / `bg-purple-500/10 text-purple-500`)

---

## Typography

| Role | Font Family | CSS Variable | Weight / Style |
| :--- | :--- | :--- | :--- |
| Headings & UI | Inter / Geist Sans | `--font-sans` | 500 (Medium), 600 (Semibold), 700 (Bold) |
| Bill Amounts & Codes | Geist Mono / JetBrains Mono | `--font-mono` | 600 (Semibold) tabular numbers |

---

## Border Radius Scale

| Context | Class | Pixel Radius |
| :--- | :--- | :--- |
| Interactive Buttons / Inputs | `rounded-lg` | `8px` |
| Floating Toasts / Badges / Pills | `rounded-full` | `9999px` |
| Main Swipeable Cause Cards | `rounded-2xl` | `16px` |
| Confirmation Drawers / Modals | `rounded-3xl` | `24px` |

---

## Card Anatomy & Visual Patterns

### 1. Dignified Statement Card (`CauseCard`)
- **Header:** Category pill with icon (e.g., `⚡ DTE Energy • Overdue Heat`) + AI Trust Score Badge (`🟢 Verified`).
- **Media / Backstory:** High-resolution photo of beneficiary relief or redacted bill crop (aspect ratio 4:3).
- **Amount & Goal:** Hero bold typography: `$142.50 Overdue` with a dual-tone progress bar (`$95.00 of $142.50 covered • 67%`).
- **Human Backstory:** Max 2 lines of clean text: *"Hours cut after car repair; keeping the heater running for two toddlers."*
- **Action Clues:** Subtle gesture hints on card edges: green shimmer on right, gold shimmer on top, subtle neutral fade on left.

### 2. Floating Celebratory Impact Toast (`ImpactToast`)
- Centered floating pill with glassmorphism backdrop (`backdrop-blur-md bg-zinc-900/90 border border-zinc-700`).
- Animates upwards from bottom of viewport using `framer-motion` with spring physics.
- Accompanied by subtle particle confetti for full goal completions.

### 3. Full-Screen Evidence Modal (`CauseDetailsModal`)
- Smooth drawer containing full uncropped, redacted receipt image with zoom capabilities.
- Gemini Vision breakdown: issuing vendor name, invoice date, overdue balance, and authenticity validation log.

---

## Component Guidelines
- Use **shadcn/ui** primitives (Dialog, Drawer, Button, Progress, Avatar, Badge, Tabs, DropdownMenu).
- Use **Lucide React** icons (`Heart`, `Zap`, `Pill`, `BookOpen`, `ShieldCheck`, `Sparkles`, `Trophy`, `CheckCircle2`).
- Stroke-based icons only, consistent `h-4 w-4` for inline labels and `h-5 w-5` for action buttons.
