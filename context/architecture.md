# Architecture Context — Givi

## Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router, TypeScript) | Full-stack application, server actions, and API routes |
| **UI** | Tailwind CSS + shadcn/ui + Lucide Icons | Premium responsive design system with dark/light themes |
| **Gestures** | `react-tinder-card` + Framer Motion | Smooth swipe physics (left/right/up) and floating impact toasts |
| **Auth** | Clerk | Turnkey authentication, Google OAuth, role management |
| **Database** | Supabase (PostgreSQL) | Relational schema for causes, transactions, and user stats |
| **File Storage**| Supabase Storage | Encrypted storage for proof receipts, bills, and cause photos |
| **AI** | Google Gemini API (google-genai SDK) | Document analysis, privacy redaction, trust scoring, impact toasts |
| **Payments** | PayPal Orders API v2 + Payouts API v1 | Hub-and-spoke donor charge capture & instant recipient payout |
| **Data Grid & Audit** | AG Grid React (`ag-grid-community`) | High-performance audit ledger, live filtering, CSV/tax receipt export |
| **Aid Catalog** | Channel3 API (`api.channel3.com`) | 100M+ real product search for direct physical aid items |
| **Timelines** | Bryntum Scheduler / Timeline | Community campaign milestone tracking and fund release schedules |
| **API Docs & SDKs** | APIMatic | OpenAPI contract generation and developer portal |
| **Deployment**| Render | Cloud hosting for Next.js app and background payout workers via `render.yaml` |

## System Boundaries

- `src/app/(donor)/feed/` — Donor swipe deck, onboarding, giving session wallet, and personal donation history.
- `src/app/(donor)/agent/` — Autonomous Giving Agent configuration (policy rules, budget, automated execution logs).
- `src/app/(receiver)/create-cause/` — Cause creation wizard (Overdue Bill Statement or Channel3 Verified Aid Supply).
- `src/app/(receiver)/my-causes/` — Receiver campaign tracking with Bryntum milestone schedule view.
- `src/app/transparency/` — AG Grid audit ledger with real-time PayPal transaction verification, sorting, and CSV receipt export.
- `src/app/leaderboard/` — Real-time donor rankings, badges, and public impact profiles.
- `src/app/developers/` — APIMatic OpenAPI specification and integration documentation.
- `src/app/api/paypal/` — Route handlers for PayPal OAuth2 token generation, order capture, and payouts dispatch.
- `src/app/api/ai/` — Gemini Vision document OCR, trust score computation, and impact toast generation.
- `src/app/api/channel3/` — Channel3 product search proxy for physical aid items.
- `src/lib/` — Supabase client, PayPal client, Gemini client, demo wallet, and shared TypeScript types.
- `src/components/ui/` — shadcn/ui accessible components and card deck wrappers.

## Storage Model

- **PostgreSQL Database (`causes`)**: id, title, description, category, need_type ('bill' | 'aid_supply' | 'community'), goal_amount, raised_amount, receiver_email, receiver_id, trust_score, status, evidence_urls, channel3_product_id, milestones, deadline, created_at.
- **PostgreSQL Database (`donations`)**: id, cause_id, donor_id, amount, paypal_order_id, paypal_payout_id, is_agentic, impact_message, created_at.
- **PostgreSQL Database (`profiles`)**: id, clerk_user_id, role, display_name, avatar_url, default_swipe_amount, is_anonymous, total_donated, cause_count, agent_budget, agent_rules, created_at.
- **Supabase Storage (`receipts-and-proofs`)**: Public/authenticated bucket for uploaded medical bills, utility bills, school fees, and milestone photos.

## Invariants

1. **Zero Platform Fee:** 100% of the donor's swipe amount is paid out to the receiver.
2. **Auto-Capping:** A donation must never exceed the remaining goal amount of a cause.
3. **Idempotency:** Every PayPal Payouts call must include a unique `PayPal-Request-Id` derived from the donation ID to prevent double disbursements.
4. **Swipe-Up Safety:** Full-amount swipe-up donations must always route through the 1-tap confirmation drawer.
5. **Privacy Redaction:** Sensitive account numbers and street addresses on uploaded bills must be masked before public display.
6. **No Broken Swiping:** If a PayPal network timeout occurs, the card deck must not freeze; it shows a graceful retry toast and maintains local state.
