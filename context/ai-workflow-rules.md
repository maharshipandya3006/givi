# AI Workflow Rules — Givi Development

## Spec-Driven Development
Build Givi incrementally following the 8-module roadmap in `context/implementation.md`. Context files define the exact specifications, UI tokens, and architectural boundaries. Always implement against these specifications—never invent unauthorized features or speculative abstractions.

---

## Scoping & Unit Boundaries
- Work on **one implementation module at a time** (Module 1 through Module 8).
- Complete each module end-to-end (code, types, styling, error handling) before proceeding to the next.
- Split an implementation step if it combines unrelated concerns (e.g., do not build the payment engine and the swipe card gesture animation in the same step).

---

## Protected Files & Conventions
- Do not modify or hand-edit `floorplan/` files directly during feature coding; update them via `/floorplan` refresh.
- Do not edit third-party component internals inside `src/components/ui/` unless configuring custom variant styles.
- Never commit hardcoded API secrets, Clerk tokens, Supabase service keys, or PayPal client secrets.

---

## Verification Before Moving to Next Unit
Before marking a module complete in `context/progress-tracker.md`:
1. The unit works end-to-end within its defined scope.
2. No invariant in `context/architecture.md` was violated.
3. `npm run build` passes with zero type errors.
4. The unit's test checklist in `context/implementation.md` is verified.
5. `context/conversation.md` and `context/progress-tracker.md` are updated.
