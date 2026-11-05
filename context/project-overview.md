# Givi — Project Overview

## Overview
**Givi** is an accessible "Tinder-for-good" web application built for the **PayPal AI Hackathon (Social Impact & Agentic Commerce Tracks)**. It empowers people and grassroots organizations in urgent need to request relief by uploading proof of need (overdue utility/medical bills or verified physical aid items), while donors effortlessly browse and micro-fund causes using an intuitive card-swiping interface powered by real-time PayPal payments, Google Gemini AI, and sponsor technologies.

## Goals
1. **Frictionless Micro-Giving:** Enable donors to micro-fund verified causes in seconds using card swipe gestures backed by pre-authorized PayPal giving sessions.
2. **Instant Direct Payouts:** Route 100% of donations directly to the beneficiary's PayPal account immediately upon swiping via the PayPal Payouts API (zero platform fees).
3. **AI-Powered Trust & Feedback:** Use Google Gemini to extract data from uploaded receipts, auto-redact private sensitive info, assign transparent AI Trust Scores, and deliver contextual floating impact toasts (*"You helped Meghana with her medicines! 💊"*).
4. **Agentic Commerce (Autonomous Giving Agent):** Let donors delegate giving budgets to an AI agent that monitors urgent, high-trust causes and executes PayPal micro-payouts autonomously based on user-defined impact policies.
5. **Radical Financial Transparency (AG Grid):** Deliver an institutional-grade, real-time audit ledger with category filters, live transaction IDs, and 1-click tax receipt exports.
6. **Verified Physical Aid Items (Channel3):** Allow requesters to link real-world essential goods (space heaters, medical supplies, textbooks) across 25,000+ merchants via Channel3.
7. **Milestone Project Schedules (Bryntum):** Provide interactive milestone timelines and relief delivery tracking for community and disaster campaigns.

## Core User Flow
1. **Authentication:** User signs in via Clerk (Google OAuth or Email) and selects a role: **Donor** or **Receiver**.
2. **Donor Onboarding:** Donor sets their default swipe amount ($1, $5, $10, or $25) and selects preferred cause categories (Healthcare, Food Security, Education, Environment, Human Rights, Poverty Alleviation).
3. **Pre-Authorized Giving Session:** Donor pre-funds or connects their PayPal sandbox account / 1-click Test Wallet for rapid swiping.
4. **Card Swiping Deck:**
   - **Swipe Right:** Instantly donates the dedicated amount (auto-capped to the remaining goal).
   - **Swipe Left:** Skips the card.
   - **Swipe Up:** Donates the entire remaining ask via a quick 1-tap confirmation drawer.
   - **Tap Card:** Opens full cause details, verified evidence photos, and Gemini AI Trust Score breakdown.
5. **Instant Feedback:** A celebratory impact pill animates up across the screen (*"You kept the heat on for Sarah and her kids in Detroit! ⚡"*).
6. **Receiver Flow:**
   - Creator enters cause title, funding goal, and beneficiary PayPal email.
   - Selects cause format: **Overdue Bill Statement** (upload photo) or **Verified Aid Supply** (search Channel3 product catalog).
   - Gemini Vision analyzes documents, auto-redacts private account numbers, and computes the AI Trust Score.
   - Cause goes live on the swipe feed immediately.
7. **Transparency & Leaderboard:** Donors inspect the AG Grid live audit ledger, filter by category/region, export donation receipts, and view top givers.

## Scope & Sponsor Capabilities

### In Scope
- Mobile-first responsive web application built with Next.js 15, Tailwind CSS, and shadcn/ui.
- Touch gesture card stack using `react-tinder-card`.
- Clerk authentication (Donor & Receiver roles, Google OAuth).
- Supabase PostgreSQL database for causes, transactions, and user profiles.
- Supabase Storage for receipt, bill, and proof image uploads.
- PayPal Orders API v2 (charge capture) and PayPal Payouts API v1 (immediate payout to recipient).
- Google Gemini API integration (document OCR/analysis, privacy redaction, AI Trust Score calculation, floating impact message generation).
- **AG Grid Transparency Ledger:** High-performance data grid for real-time audit logs, donor leaderboard, and CSV/PDF receipt export.
- **Channel3 Aid Registry:** Product search API connecting physical emergency needs to real merchant products.
- **Bryntum Milestone Timeline:** Interactive Gantt/scheduler view for community relief campaigns.
- **Agentic Commerce Runner:** Autonomous rule-based giving agent deploying PayPal micro-payouts.
- **APIMatic OpenAPI Documentation:** Developer contracts and SDK docs for charity integrations.
- **Render Deployment:** Cloud hosting configuration (`render.yaml`).

### Out of Scope (Ponytail Pruned)
- Real-time 1-on-1 chat / messaging (replaced by floating AI impact toasts).
- Complex multi-month escrow holding periods (replaced by immediate Payouts API transfers).
- Multi-language localization (planned for post-hackathon roadmap).
- Native mobile iOS/Android binaries (web app handles mobile browsers natively).

## Success Criteria
1. A donor can swipe right on a cause and trigger a real PayPal Sandbox transaction captured and paid out to the receiver within 3 seconds.
2. An uploaded bill receives automated Gemini Vision privacy redaction, metadata extraction, and Trust Score badge.
3. The AG Grid audit ledger displays real-time transactions with sorting, filtering, and CSV export.
4. The Channel3 registry pulls verified merchant items into cause creation.
5. The Autonomous Giving Agent triggers an automated payout when a cause matches donor rules.
