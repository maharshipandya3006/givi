import type { Cause } from "./types.ts";
import { SEED_CAUSES } from "./seed-data.ts";

// In-memory store for session demo with eager seed synchronization
const globalCauses: Cause[] =
  (globalThis as any).__GIVI_ACTIVE_CAUSES__ || [];

// Ensure all seed causes are populated if empty or outdated
if (globalCauses.length < SEED_CAUSES.length) {
  for (const seed of SEED_CAUSES) {
    if (!globalCauses.some((c) => c.id === seed.id)) {
      globalCauses.push({ ...seed });
    }
  }
}

(globalThis as any).__GIVI_ACTIVE_CAUSES__ = globalCauses;
export const activeCauses: Cause[] = globalCauses;

export function getActiveCauses(): Cause[] {
  replenishCausesIfAllFunded();
  return activeCauses;
}

export function replenishCausesIfAllFunded(): void {
  const hasActive = activeCauses.some(
    (c) => c.status !== "funded" && (c.goalAmount - c.raisedAmount) > 0.01
  );
  if (!hasActive && SEED_CAUSES.length > 0) {
    for (const seed of SEED_CAUSES) {
      const existing = findCauseById(seed.id);
      if (existing) {
        existing.raisedAmount = 0.0;
        existing.status = "active";
        existing.updatedAt = new Date().toISOString();
      } else {
        activeCauses.push({ ...seed, raisedAmount: 0.0, status: "active" });
      }
    }
  }
}

export function findCauseById(id: string): Cause | undefined {
  return activeCauses.find((c) => c.id === id);
}

export const MAX_ACTIVE_CAUSES = 250;

export function addActiveCause(cause: Cause): void {
  activeCauses.unshift(cause);
  if (activeCauses.length > MAX_ACTIVE_CAUSES) {
    activeCauses.pop();
  }
}

/**
 * Atomically reserves funding up to the remaining goal, preventing over-funding races.
 */
export function reserveCauseFunding(
  id: string,
  requestedAmount: number,
  fallbackCause?: Cause
): {
  success: boolean;
  actualAmount: number;
  cause?: Cause;
  error?: string;
} {
  let cause = findCauseById(id);
  if (!cause && fallbackCause) {
    activeCauses.unshift(fallbackCause);
    cause = fallbackCause;
  } else if (cause && fallbackCause) {
    // Synchronize fresh database totals into runtime store
    cause.raisedAmount = Math.max(cause.raisedAmount, fallbackCause.raisedAmount);
    if (cause.raisedAmount >= cause.goalAmount) {
      cause.status = "funded";
    }
  }
  if (!cause) return { success: false, actualAmount: 0, error: "Cause not found" };

  if (requestedAmount <= 0 || isNaN(requestedAmount)) {
    return { success: false, actualAmount: 0, error: "Invalid donation amount" };
  }

  const remaining = Math.max(0, cause.goalAmount - cause.raisedAmount);
  if (remaining <= 0) {
    return { success: false, actualAmount: 0, error: "This cause has already reached its full funding goal." };
  }

  const actualAmount = Math.min(requestedAmount, Math.round(remaining * 100) / 100);
  cause.raisedAmount = Math.round((cause.raisedAmount + actualAmount) * 100) / 100;
  if (cause.raisedAmount >= cause.goalAmount) {
    cause.status = "funded";
  }
  cause.updatedAt = new Date().toISOString();
  return { success: true, actualAmount, cause };
}

/**
 * Rolls back reserved funding if downstream payment capture or payout fails.
 */
export function releaseCauseFunding(id: string, amount: number): void {
  if (amount <= 0 || isNaN(amount)) return;
  const cause = findCauseById(id);
  if (!cause) return;
  cause.raisedAmount = Math.max(0, Math.round((cause.raisedAmount - amount) * 100) / 100);
  if (cause.raisedAmount < cause.goalAmount) {
    cause.status = "active";
  }
  cause.updatedAt = new Date().toISOString();
}
