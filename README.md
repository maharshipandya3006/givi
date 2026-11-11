# Givi — Swipe-to-Donate Micro-Relief Platform

> **Built for the PayPal AI Hackathon (Social Impact & Agentic Commerce Tracks)**  

---

## 🌟 Overview & Core Problem

Traditional charity platforms are plagued by three massive points of friction:
1. **Abstract Pleas:** Donors don't connect with vague multimillion-dollar organizational appeals.
2. **Hidden Platform Fees & Delayed Escrow:** Up to 15% in platform fees, with funds locked for weeks before reaching the field.
3. **Lack of Verifiable Proof:** Donors are never sure whether their money solved a real problem.

**Givi solves all three:**
- **Hyper-Tangible Units of Need:** Donors swipe real, overdue utility bills (heat, water, electric), medical copays (insulin, prescriptions), and essential physical supplies.
- **Friction-Free Swiping:**
  - **👉 Swipe Right:** Chip in $5 towards an overdue bill (auto-capped if remaining goal < $5).
  - **👈 Swipe Left:** Skip cause.
  - **👆 Swipe Up:** Clear the entire remaining ask (protected by 1-tap confirmation drawer).
  - **👆 Tap Card:** Inspect full backstory, redacted bill image, and Gemini AI Trust Score breakdown.
- **100% Direct Payouts (0% Platform Fee):** Powered by PayPal Orders capture + instant Payouts API disbursement directly to the recipient's PayPal account.
- **Emotional AI Gratitude:** Gemini 2.5 Flash crafts context-aware floating impact toasts upon donation (*"You just kept the heat on for Sarah and her kids in Detroit! ⚡"*).

---

## 🏆 Hackathon Sponsor Integrations

Every sponsor technology is integrated as a **native architectural necessity**, not a tacked-on widget:

| Sponsor | Integration in Givi | Prize Track Targeted |
| :--- | :--- | :--- |
| **PayPal** | Orders API v2 capture + Payouts API v1 instant direct transfers with idempotency headers (`PayPal-Request-Id`). | Grand Podium, Most Impactful, Best Use of PayPal + AI |
| **Google Gemini AI** | Multimodal Vision OCR on bills, automatic privacy redaction of account numbers, fraud trust scoring (0-100%), and celebratory impact toasts. | Best Use of PayPal + AI ($5,000) |
| **Agentic Commerce** | **Autonomous Giving Agent (`/agent`):** Donors delegate a monthly budget with custom rules (*"Auto-fund medical bills under $15 with >85% trust"*); the agent dispatches PayPal Payouts autonomously. | Best Use of Agentic Commerce ($5,000) |
| **AG Grid** | **Live Transparency & Audit Ledger (`/transparency`):** High-performance enterprise data grid showing real-time PayPal settlement hashes, category filters, and 1-click CSV export for donor tax deductions. | Best Use of AG Grid ($10,000 pool) |
| **Channel3** | **Direct Aid Supply Registry:** Product search API connecting physical emergency needs (heaters, infant formula, textbooks) to verified retail goods from 25,000+ merchants. | Best Use of Channel3 ($1,500) |
| **APIMatic** | **Developer Portal & OpenAPI Specs (`/developers`):** Complete OpenAPI 3.0 contract and SDK docs allowing utility providers and mutual aid groups to connect programmatically. | Best Use of APIMatic ($1,000) |
| **Render** | Production cloud hosting and background worker orchestration via declarative `render.yaml`. | Best Use of Render ($2,250 pool) |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS, shadcn/ui design tokens, Lucide Icons
- **Gestures & Physics:** `react-tinder-card`, `@react-spring/web`, `framer-motion`, `canvas-confetti`
- **Data Grid:** AG Grid React (`ag-grid-react`, `ag-grid-community` v33)
- **Auth:** Clerk Auth (Google OAuth, Donor & Receiver roles)
- **Database & Storage:** Supabase (PostgreSQL, Row-Level Security, Storage Buckets)
- **Payments:** PayPal Orders API v2 & Payouts API v1
- **AI Engine:** Google Gemini 1.5/2.5 Flash Vision (`@google/generative-ai`)
- **Cloud Deployment:** Render (`render.yaml`)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
\`\`\`bash
git clone https://github.com/maharshipandya/givi.git
cd givi
npm install
\`\`\`

### 2. Environment Variables
Copy `.env.local.example` to `.env.local`:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

*(Note: Givi includes built-in pre-authorized sandbox test balances and high-fidelity fallback modes, allowing full end-to-end testing immediately even before pasting API keys).*

### 3. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
Visit [http://localhost:3000](http://localhost:3000) to start swiping!

---

## 🎬 3-Minute Video Demo Script (For Judging)

1. **[0:00 - 0:30] The Brandon Powers Hook:** Show the viral video premise. Everyday people facing $40-$140 utility shutoff notices or prescription copays. Introduce Givi.
2. **[0:30 - 1:15] The Core Swipe Loop:** Walk through the card deck. Swipe Right on Sarah's DTE Energy heating bill ($5 micro-donation). Show the celebratory impact toast and live PayPal Payout confirmation.
3. **[1:15 - 1:45] AI Trust & Cause Creation:** Show uploading a medical bill. Gemini Vision automatically parses the amount, redacts private account numbers, and assigns a Trust Score. Then demonstrate Channel3 product search linking a space heater.
4. **[1:45 - 2:15] AG Grid Public Audit Ledger:** Navigate to `/transparency`. Filter by category, inspect the real-time PayPal settlement batch ID, and export a CSV tax receipt in 1 click.
5. **[2:15 - 2:45] Agentic Commerce Runner:** Open `/agent`. Configure an autonomous giving rule (max $15 per cause, >85% trust score) and trigger an autonomous run. Watch the agent evaluate causes and execute PayPal Payouts without human friction.
6. **[2:45 - 3:00] Wrap-up & Mission:** 100% direct relief, 0% platform fee, driving real good in the world.

