# Givi — Product Requirements & Architectural Specification

## 1. Overview
**Givi** is an accessible "Tinder-for-good" web application built for the **PayPal AI Hackathon (Social Impact & Agentic Commerce Tracks)**. It connects individuals and grassroots causes in urgent need with everyday donors. Requesters upload proof of need (overdue utility/medical bills or verified physical aid items), and donors micro-fund them through a friction-free card swipe interface powered by PayPal Orders & Payouts APIs, Google Gemini AI, and sponsor technologies.

## 2. Core Value Proposition & Mechanics
- **Micro-Giving Gestures:**
  - **Swipe Right (👉):** Donates preset micro-amount ($5) instantly.
  - **Swipe Left (👈):** Skips to the next cause.
  - **Swipe Up (👆):** Donates the entire remaining goal ask, protected by a 1-tap confirmation drawer.
  - **Tap Card:** Expands the complete story, beneficiary background, zoomable receipt/bill evidence photos, and Gemini AI Trust Score breakdown.
- **Goal Auto-Capping:** If remaining goal < preset swipe amount, charges only the exact remaining amount to complete the goal at 100%.
- **Zero-Friction Giving Allowance:** Pre-authorized session allowance or 1-click test wallet eliminates repetitive PayPal login popups.
- **Immediate Direct Payouts:** 100% of donations are transferred to the beneficiary's PayPal account immediately via the PayPal Payouts API.
- **AI-Powered Trust & Floating Gratitude:**
  - Gemini Vision analyzes uploaded bills/receipts, auto-redacts private account numbers, and computes an AI Trust Score (🟢/🟡/🔴).
  - Floating celebratory impact toasts (*"You kept the heat on for Sarah & her kids in Detroit! ⚡"*) animate up across the screen.
- **Agentic Commerce (Autonomous Giving Agent):** Donors can delegate a giving budget to an AI agent that monitors urgent, high-trust causes and executes PayPal micro-payouts autonomously based on user impact policies.
- **Radical Transparency (AG Grid):** An interactive audit ledger displaying real-time PayPal transaction IDs, category filters, and 1-click CSV/tax receipt export.
- **Verified Physical Aid Items (Channel3):** Requesters can link real-world essential goods (space heaters, infant formula, textbooks) across 25,000+ merchants.
- **Community Relief Timelines (Bryntum):** Interactive milestone schedules for community campaigns.
- **Social Impact Leaderboard:** Ranks givers primarily by total amount donated (This Week / All-Time), celebrating category diversity and badges.

## 3. Technology Stack
- **Frontend / Framework:** Next.js 15 (App Router, TypeScript, React 19)
- **Styling & UI:** Tailwind CSS, shadcn/ui, Lucide React, Framer Motion
- **Gesture Physics:** `react-tinder-card`
- **Data Grid & Audit:** AG Grid React (`ag-grid-community`)
- **Authentication:** Clerk (Google OAuth, Email/Password, Donor & Receiver roles)
- **Database & Storage:** PostgreSQL via Supabase + Supabase Storage (receipts, bills, cause images)
- **AI Engine:** Google Gemini API (google-genai SDK, Gemini 2.5/Flash Vision)
- **Payment Infrastructure:** PayPal Orders API v2 (Capture) + PayPal Payouts API v1 (Immediate Transfer)
- **Aid Catalog Integration:** Channel3 Product Search API
- **Timelines:** Bryntum Scheduler / Timeline
- **API Contracts:** APIMatic OpenAPI Documentation
- **Hosting:** Render Cloud Platform (`render.yaml`)
