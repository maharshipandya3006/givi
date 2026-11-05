import { Cause } from "./types";
import { SEED_CAUSES } from "./seed-data";

// Shared in-memory store for active session causes
export const activeCauses: Cause[] = [...SEED_CAUSES];

export function getActiveCauses(): Cause[] {
  return activeCauses;
}

export function findCauseById(id: string): Cause | undefined {
  return activeCauses.find((c) => c.id === id);
}

export function addActiveCause(cause: Cause): void {
  activeCauses.unshift(cause);
}

export function updateCauseFunding(id: string, additionalAmount: number): { cause: Cause; isFunded: boolean } | null {
  const cause = findCauseById(id);
  if (!cause) return null;

  const newRaised = Math.round((cause.raisedAmount + additionalAmount) * 100) / 100;
  cause.raisedAmount = newRaised;
  if (newRaised >= cause.goalAmount) {
    cause.status = "funded";
  }
  cause.updatedAt = new Date().toISOString();

  return { cause, isFunded: cause.status === "funded" };
}

