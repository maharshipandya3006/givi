# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Donors:** Modern, empathetic consumers looking for direct, transparent micro-giving ($5–$25 per action) with instant proof and zero platform overhead, swiping through causes in seconds on mobile or desktop.
- **Relief Recipients:** Everyday individuals and families experiencing acute short-term financial emergencies (overdue electricity/heat shutoff warnings, prescription copays, infant formula, emergency supplies) who submit redacted bills or specific needs with dignity and privacy.
- **Hackathon Judges & Platform Evaluators:** Reviewers evaluating deep, authentic integration of PayPal (Orders v2 capture + Payouts v1 direct transfer), Google Gemini Vision OCR, AG Grid live audit ledger, Channel3 product search, and Agentic Commerce runner.

## Product Purpose

Givi eliminates the three chronic points of friction in philanthropic giving—abstract organizational pleas, delayed escrow with platform fees, and lack of verifiable proof—by transforming verified utility statements, medical copays, and physical supplies into hyper-tangible, swipeable units of micro-relief. Donors chip in $5 (swipe right), clear a bill in full (swipe up), or skip (swipe left), with 100% of funds routed instantly to the beneficiary via PayPal.

## Positioning

Unlike traditional charitable crowdfunding platforms that bundle donations into abstract multi-thousand-dollar pools with 5–15% platform fees and delayed bank deposits, Givi operates at the unit economics of an overdue utility statement: real bills, zero platform take rate, Gemini-verified proof, and instant peer-to-peer PayPal payouts.

## Operating Context

- Mobile and desktop web browsers.
- Touchscreens for fluid swiping physics, alongside full keyboard/mouse accessibility.
- Real-world utility notices (DTE Energy, Duke Energy, ConEdison), pharmacy receipts (CVS, Walgreens), and physical survival equipment (space heaters, infant care).
- Live PayPal Sandbox credentials and high-fidelity fallback modes for instant demonstration without blocking on external API downtime.

## Capabilities and Constraints

- **Confirmed Capabilities:**
  - Swipe-to-donate gesture deck (`react-tinder-card` / spring physics): Swipe Right ($5 micro-donation, auto-capped to remaining balance), Swipe Left (skip), Swipe Up (clear remaining balance with 1-tap confirmation drawer), Tap (detailed backstory, zoomable redacted bill, Gemini trust breakdown).
  - Backend payment rails: PayPal Orders API v2 capture + PayPal Payouts API v1 instant disbursement with idempotency keys (`PayPal-Request-Id`).
  - Pre-authorized donor giving allowance / 1-click Test Donor Wallet for frictionless zero-popup swiping.
  - Google Gemini Multimodal AI: Vision OCR on bills, automatic PII redaction of account numbers, fraud trust score calculation (0–100%), and celebratory impact toasts.
  - Receiver cause enrollment wizard: bill image upload, automated OCR parsing, and Channel3 e-commerce product search for emergency goods.
  - Transparency & audit ledger (`/transparency`): AG Grid React table with real-time settlement records, PayPal transaction IDs, and 1-click CSV tax export.
  - Autonomous Giving Agent (`/agent`): Rule-based automated micro-relief runner with policy controls (budget, max per cause, minimum trust score threshold).
  - Real-time donor leaderboard (`/leaderboard`): rankings, badges, streaks, and giving history.
  - Interactive APIMatic OpenAPI 3.0 developer docs (`/developers`).
- **Technical Constraints:**
  - Next.js 15 App Router, React 19, TypeScript, Tailwind CSS.
  - All existing working backend API routes (`/api/paypal/*`, `/api/ai/*`, `/api/causes`, `/api/transparency`, `/api/agent/*`, `/api/channel3/*`, `/api/leaderboard`) must remain 100% intact, connected, and fully operational.
  - Zero mock data or dead buttons in the production UI; every clickable affordance must execute its real end-to-end functionality.

## Brand Commitments

- **Tone:** High-Energy Modern Consumer Social Good. Bold, vibrant, tactile, and deeply optimistic, balancing playful micro-interactions with profound respect and dignity for relief recipients.
- **Visual Personality:** Punchy typography, crisp high-contrast surfaces, luminous emerald accent `#10B981` / `#059669` / `#118C4F` paired with rich dark substrates and clean light accents, tactile gesture indicators, and vivid celebratory feedback.
- **Privacy & Dignity:** Never display private account numbers or home addresses; present beneficiaries with respect as neighbors, not statistics.

## Evidence on Hand

- 12 comprehensive, verified seed causes across 6 categories (Electric/Heat, Water/Utilities, Medical & Copays, Groceries & Nutrition, Infant & Family Care, Emergency Supplies) located in `src/lib/seed-data.ts`.
- Working PayPal integration in `src/lib/paypal.ts` with sandbox credentials and mock ledger fallbacks.
- Working Gemini Vision OCR and impact toast generator in `src/lib/gemini.ts`.
- Working local database and store in `src/lib/causes-store.ts` and `src/lib/ledger.ts`.

## Product Principles

1. **Tangible Over Abstract:** Donors fund specific, finite needs ($42 electric bill, $28 insulin copay), never amorphous fundraising pools.
2. **Zero-Friction Momentum:** Giving must feel as fluid and natural as swiping short-form content; payments occur in the background without modal friction.
3. **Radical Transparency:** Every dollar is accounted for with live settlement hashes, AG Grid audit logging, and 0% platform fee.
4. **Dignity by Design:** Beneficiaries are protected by automated PII redaction and framed with warmth, empathy, and community empowerment.
5. **Immediate Emotional Closure:** Every donation closes with instant gratitude—an AI-crafted context-specific impact toast celebrating the human outcome.

## Accessibility & Inclusion

- Full keyboard navigation and visible focus rings for all gesture actions (Arrow Left = Skip, Arrow Right = $5, Arrow Up = Clear Bill, Enter/Space = Details).
- High-contrast text exceeding WCAG AAA standards on both dark and light surfaces.
- Reduced motion support (`prefers-reduced-motion`) with gentle transitions replacing rapid spring physics where requested.
- Screen-reader friendly aria-labels for all swipe deck actions, trust ratings, and monetary calculations.

