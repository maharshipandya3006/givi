# Code Standards — Givi

## General Principles
1. **Single-Purpose Modules:** Keep server actions, components, and API routes focused on a single responsibility.
2. **Fail Gracefully at Boundaries:** Validate all incoming requests and third-party API payloads with explicit type narrowing before processing.
3. **Zero Dead Code:** Do not commit unused wrappers, speculative helper abstractions, or placeholder mock functions.

---

## TypeScript
- Strict mode is enabled and enforced.
- **Never use `any`**: use narrow types, explicit interfaces, or `unknown` with runtime type narrowing.
- All domain models must be defined in `src/lib/types.ts` and shared across frontend components and backend routes.

---

## Next.js 15 & React 19
- Default to **Server Components** (`page.tsx`, layouts).
- Use `'use client'` only on interactive UI boundaries:
  - Gesture-handling cards (`swipe-deck.tsx`)
  - Modals and drawers (`cause-details-modal.tsx`, `swipe-up-confirmation.tsx`)
  - Dropzones and file uploaders (`proof-uploader.tsx`)
- Keep route handlers (`app/api/**/route.ts`) thin: delegate business logic to `src/lib/`.

---

## PayPal API Invariants
- **Idempotency:** Every `/v1/payments/payouts` call must include a unique `PayPal-Request-Id` derived from the donation ID to prevent duplicate disbursements on network retries.
- **Amounts as Formatted Strings:** PayPal amounts must strictly be strings formatted to two decimal places (e.g., `"5.00"`, `"142.50"`), never raw numbers.
- **Zero Platform Fee:** Ensure `amount.value` sent in Payouts equals 100% of the captured donation.
- **Sandbox Pre-Funding:** Always verify sandbox business accounts hold test balances before triggering Payouts transfers.

---

## Google Gemini API Guidelines
- Use the official `@google/genai` SDK.
- Use `gemini-2.5-flash` for high-speed document OCR and toast synthesis.
- Structure document analysis prompts to return strict JSON using structured output schemas (`responseMimeType: "application/json"`).
- Always include fallback impact messages if AI latency exceeds 2.5 seconds to prevent blocking UI swiping animations.

---

## Supabase & Database Integrity
- Use parameterized queries via `@supabase/supabase-js`; never concatenate strings into SQL.
- Always enforce Row Level Security (RLS) on user mutations.
- Increment cause `raised_amount` and insert `donations` records within an atomic database function or transaction to prevent race conditions during simultaneous swipes.

---

## File Structure & Organization
- `src/app/(auth)/` — Clerk authentication routes (sign-in, sign-up).
- `src/app/(donor)/` — Donor experience (feed, gesture cards, history, profile settings).
- `src/app/(receiver)/` — Receiver campaign wizard and cause dashboard.
- `src/app/leaderboard/` — Public leaderboard and donor impact profiles.
- `src/app/api/` — API route handlers (PayPal, Gemini, Causes, Profile).
- `src/lib/` — Singleton clients (`paypal.ts`, `gemini.ts`, `supabase.ts`) and type definitions (`types.ts`).
- `src/components/ui/` — Accessible shadcn/ui components.
