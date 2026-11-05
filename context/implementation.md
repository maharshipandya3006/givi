# Givi — Implementation Plan (Module-by-Module)

This plan integrates all hackathon sponsors as native product assets. Each module is self-contained and independently verifiable.

---

## Module 1: Project Initialization & Core Infrastructure

### Scope & Objective
Scaffold the Next.js 15 application, configure TypeScript and Tailwind CSS with shadcn/ui, configure Clerk Auth, Supabase clients, PayPal Sandbox, Google Gemini SDK, AG Grid styles, and Render deployment config.

### Files to Create / Modify
- `package.json` — Dependencies: Next.js 15, React 19, Tailwind CSS, Lucide React, `@clerk/nextjs`, `@supabase/supabase-js`, `@google/genai`, `react-tinder-card`, `framer-motion`, `ag-grid-react`, `ag-grid-community`, `canvas-confetti`.
- `tsconfig.json` — Strict TypeScript configuration with `@/*` path aliases.
- `tailwind.config.ts` — Brand tokens, statement card styles, and animation definitions.
- `render.yaml` — Infrastructure-as-code configuration for Render web service deployment.
- `.env.local.example` — Template for Clerk, Supabase, PayPal Sandbox, Gemini, and Channel3 API keys.
- `src/lib/types.ts` — Shared TypeScript data models (`Cause`, `Donation`, `Profile`, `TrustScore`, `AidProduct`, `AgentPolicy`).
- `src/lib/supabase.ts` — Supabase database and storage clients.
- `src/lib/paypal.ts` — PayPal REST client (OAuth2, Orders v2, Payouts v1).
- `src/lib/gemini.ts` — Google Gemini SDK client instance.
- `src/app/layout.tsx` — Root layout with ClerkProvider, font providers, and Toaster.
- `src/middleware.ts` — Clerk auth middleware.

### Verification Check
- `npm run build` passes with 0 errors.
- `npm run dev` boots cleanly.

---

## Module 2: Database Schema & Seed Data Engine

### Scope & Objective
Create the PostgreSQL database schema in Supabase with RLS policies and storage buckets. Populate with realistic seed data:
1. Overdue bills (DTE Energy, ConEd, Rite Aid prescription, school supplies).
2. Channel3 physical aid items (space heaters, infant formula, emergency winter boots).
3. Community relief causes with milestones.

### Files to Create / Modify
- `supabase/schema.sql` — Tables (`profiles`, `causes`, `donations`, `agent_policies`).
- `supabase/storage.sql` — RLS policies for `receipts-and-proofs` bucket.
- `src/lib/seed-data.ts` — Realistic seed causes across all 6 categories with statement headers and pre-calculated Trust Scores.
- `src/app/api/causes/route.ts` — `GET /api/causes` returning active causes filtered by category.

### Verification Check
- `curl http://localhost:3000/api/causes` returns JSON array of active causes.

---

## Module 3: PayPal Payment Engine (Orders Capture + Instant Payouts)

### Scope & Objective
Implement the zero-fee hub-and-spoke payment rail using PayPal Sandbox: capture donor micro-payments or giving allowance debits via the Orders API v2, and immediately trigger the Payouts API v1 to disburse 100% of the funds to the beneficiary's sandbox PayPal account with idempotency protection.

### Files to Create / Modify
- `src/lib/paypal.ts` — OAuth2 token cache, `createOrder`, `captureOrder`, and `disbursePayout`.
- `src/app/api/paypal/create-order/route.ts` — Order creation endpoint.
- `src/app/api/paypal/capture-and-payout/route.ts` — Atomic payment execution:
  1. Captures order (or debits authorized test wallet).
  2. Dispatches instant Payouts API transfer to beneficiary.
  3. Inserts donation row in Supabase and increments cause `raised_amount`.
  4. Returns payment receipts and triggers AI impact toast generation.
- `src/lib/demo-wallet.ts` — Pre-authorized sandbox test wallet helper for instant 1-click judging evaluation.

### Verification Check
- Test payment transaction captures order and executes Payouts API call successfully in sandbox.

---

## Module 4: Google Gemini Multimodal AI Engine

### Scope & Objective
Build the AI intelligence layer using Gemini 2.5 Flash:
1. **Document Analysis & Trust Scoring:** OCR of uploaded bills, date/amount validation, and Trust Score calculation.
2. **AI Privacy Redaction Shield:** Identifies and masks private account numbers and street addresses.
3. **Celebratory Impact Toasts:** Dynamic 1-sentence gratitude toasts (*"You just kept the heat on for Sarah & her kids in Detroit! ⚡"*).

### Files to Create / Modify
- `src/lib/gemini.ts` — Helper methods (`analyzeProofDocument`, `redactSensitiveData`, `generateImpactToast`).
- `src/app/api/ai/analyze-document/route.ts` — Document analysis and privacy redaction route.
- `src/app/api/ai/generate-impact-toast/route.ts` — Contextual gratitude toast synthesis route.

### Verification Check
- Uploading a bill returns extracted structured data and redacts private fields.

---

## Module 5: Donor Swipe Deck & Gesture Experience

### Scope & Objective
Build the flagship interactive card deck featuring Tinder/Bumble gesture physics via `react-tinder-card`. Implement:
- **Swipe Right:** Pay preset micro-amount ($5) with goal auto-capping.
- **Swipe Left:** Skip to next cause.
- **Swipe Up:** 1-tap confirmation drawer to pay the remaining goal in full.
- **Tap Card:** Full-screen modal with backstory, redacted bill crop, and Gemini Trust Score breakdown.
- **Floating Impact Toast:** Framer Motion animated pill with celebratory confetti.

### Files to Create / Modify
- `src/app/(donor)/feed/page.tsx` — Main donor feed with active category filters and wallet pill.
- `src/app/(donor)/feed/components/swipe-deck.tsx` — Gesture orchestration using `react-tinder-card`.
- `src/app/(donor)/feed/components/cause-card.tsx` — Statement-style card displaying category icon, provider badge, overdue amount, and progress bar.
- `src/app/(donor)/feed/components/cause-details-modal.tsx` — Full evidence inspection modal.
- `src/app/(donor)/feed/components/swipe-up-confirmation.tsx` — 1-tap confirmation drawer.
- `src/app/(donor)/feed/components/impact-toast.tsx` — Animated celebratory impact toast.

### Verification Check
- Swiping right captures micro-donation and triggers impact toast; swiping up opens confirmation drawer.

---

## Module 6: Receiver Portal & Channel3 Aid Supply Registry

### Scope & Objective
Create the cause enrollment wizard supporting two distinct need types:
1. **Overdue Bill Statement:** Upload photo with Gemini Vision OCR and privacy redaction.
2. **Verified Physical Aid Item (Channel3):** Search 100M+ real retail products (e.g., heaters, medical supplies) and attach verified merchant buy links.

### Files to Create / Modify
- `src/app/(receiver)/create-cause/page.tsx` — Multi-step wizard with need-type selector.
- `src/app/(receiver)/create-cause/components/proof-uploader.tsx` — Bill upload dropzone with live Gemini extraction preview.
- `src/app/(receiver)/create-cause/components/channel3-search.tsx` — Product search bar querying Channel3 API (`PAYPAL-HACKATHON-2026`).
- `src/app/api/channel3/search/route.ts` — Server proxy to Channel3 API.
- `src/app/(receiver)/my-causes/page.tsx` — Receiver dashboard tracking campaign progress and received payouts.

### Verification Check
- Searching "space heater" via Channel3 returns verified products; selecting an item attaches it to the cause.

---

## Module 7: AG Grid Transparency Ledger & Bryntum Milestone Schedules

### Scope & Objective
Implement institutional-grade accountability and community project tracking:
1. **AG Grid Transparency Ledger (`/transparency`):** High-performance audit table showing real-time PayPal transactions, verified cause statuses, AI Trust Score badges, and 1-click CSV export for tax receipts.
2. **Bryntum Milestone Schedule (`/causes/[id]/timeline`):** Interactive project timeline showing community relief phases, volunteer distribution dates, and milestone fund releases.
3. **Leaderboard (`/leaderboard`):** Ranks givers by total amount with weekly/all-time tabs and category diversity badges.

### Files to Create / Modify
- `src/app/transparency/page.tsx` — AG Grid audit ledger with custom cell renderers (Trust Badge, PayPal TXID, Category Pill).
- `src/app/transparency/components/transparency-grid.tsx` — Configured AG Grid component with sorting, filtering, and CSV export.
- `src/app/(donor)/causes/[id]/components/milestone-timeline.tsx` — Bryntum-powered timeline for community campaigns.
- `src/app/leaderboard/page.tsx` — Top givers leaderboard with podium cards and profile modals.
- `src/app/api/transparency/route.ts` — Real-time transaction query endpoint.

### Verification Check
- `/transparency` loads interactive AG Grid with sorting, category filters, and functioning CSV export.

---

## Module 8: Agentic Commerce (Autonomous Giving Agent) & APIMatic Docs

### Scope & Objective
Target the **Best Use of Agentic Commerce ($5,000)** and **Best Use of APIMatic ($1,000)** awards:
1. **Givi Autonomous Giving Agent (`/agent`):** Donors set budget and impact policies (e.g., *"Auto-fund urgent medical bills under $15 with >80% trust score"*). The agent evaluates causes and triggers PayPal micro-payouts autonomously.
2. **APIMatic Developer Portal (`/developers`):** OpenAPI 3.0 specification and integration contracts for charity partners and utility companies.

### Files to Create / Modify
- `src/app/(donor)/agent/page.tsx` — Agentic Commerce control panel (set monthly budget, threshold rules, trigger autonomous evaluation run).
- `src/app/api/agent/run/route.ts` — Autonomous agent runner evaluating causes against donor policies and executing PayPal Payouts.
- `src/app/developers/page.tsx` — APIMatic OpenAPI contract documentation and SDK links.
- `public/openapi.json` — Complete OpenAPI 3.0 specification for Givi APIs.

### Verification Check
- Running the Autonomous Giving Agent executes automated micro-payouts for causes matching policy rules.

---

## Module 9: Verification, Render Cloud Deployment & Demo Package

### Scope & Objective
Final end-to-end integration testing, Render deployment verification, and preparation of the 3-minute video demo script and Devpost submission package.

### Deliverables & Checks
- Deploy live application to Render via `render.yaml`.
- Verify mobile browser responsiveness and touch gesture physics.
- Test all PayPal Sandbox payment and payout flows.
- Create `README.md` with demo credentials and hackathon sponsor writeup.
- Script the 3-minute YouTube demonstration video.
