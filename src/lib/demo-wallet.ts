// ==============================================================================
// Givi — Pre-Authorized Demo Giving Allowance / Test Wallet Helper
// Prevents repetitive PayPal login popups during continuous swipe testing
// ==============================================================================

export const MAX_WALLETS = 1000;
const globalWallets: Map<string, number> =
  (globalThis as any).__GIVI_USER_WALLETS__ || new Map<string, number>();
(globalThis as any).__GIVI_USER_WALLETS__ = globalWallets;

export function isDemoUserKey(userId: string): boolean {
  return (
    userId === "default" ||
    userId === "guest-session" ||
    userId === "user_anon" ||
    userId.startsWith("guest-") ||
    userId.startsWith("demo-") ||
    userId.startsWith("judge-") ||
    userId.includes("gividonor")
  );
}

export function canonicalWalletUserId(userId: string): string {
  if (
    userId === "judge-donor-session" ||
    userId.startsWith("judge-donor") ||
    userId === "gividonor@personal.example.com" ||
    userId.includes("gividonor")
  ) {
    return "judge-donor-session";
  }
  return userId;
}

function setWallet(userId: string, balance: number): void {
  const targetId = canonicalWalletUserId(userId);
  if (globalWallets.size >= MAX_WALLETS && !globalWallets.has(targetId)) {
    const oldestKey = globalWallets.keys().next().value;
    if (oldestKey) globalWallets.delete(oldestKey);
  }
  globalWallets.set(targetId, Math.max(0, Math.round(balance * 100) / 100));
}

export function getDemoWalletBalance(userId: string = "default"): number {
  const targetId = canonicalWalletUserId(userId);
  if (!globalWallets.has(targetId)) {
    // Judge donor demo session starts with $50.00 sandbox giving balance
    if (targetId === "judge-donor-session") {
      setWallet(targetId, 50.0);
    } else {
      setWallet(targetId, 0.0);
    }
  }
  return globalWallets.get(targetId)!;
}

export function setDemoWalletBalance(userId: string, balance: number): void {
  setWallet(userId, balance);
}

export function debitDemoWallet(
  amount: number,
  userId: string = "default",
  fallbackBalance?: number
): { success: boolean; newBalance: number; error?: string } {
  if (amount <= 0 || isNaN(amount)) {
    return {
      success: false,
      newBalance: getDemoWalletBalance(userId),
      error: "Invalid donation amount",
    };
  }

  let current = getDemoWalletBalance(userId);

  // If in-memory balance was cleared by a server reload/HMR, honor verified client balance up to $500
  // strictly for demo/guest sessions to prevent balance spoofing on authenticated accounts
  if (
    current < amount &&
    typeof fallbackBalance === "number" &&
    fallbackBalance >= amount &&
    fallbackBalance <= 500 &&
    isDemoUserKey(userId)
  ) {
    setWallet(userId, fallbackBalance);
    current = fallbackBalance;
  }

  if (current < amount) {
    return {
      success: false,
      newBalance: current,
      error: `Insufficient Giving Allowance. Current balance is $${current.toFixed(
        2
      )}. Please top up.`,
    };
  }

  const newBalance = Math.round((current - amount) * 100) / 100;
  setWallet(userId, newBalance);
  return { success: true, newBalance };
}

export function topUpDemoWallet(
  amount: number,
  userId: string = "default"
): number {
  if (amount <= 0 || isNaN(amount)) {
    return getDemoWalletBalance(userId);
  }
  const current = getDemoWalletBalance(userId);
  const newBalance = Math.round((current + amount) * 100) / 100;
  setWallet(userId, newBalance);
  return newBalance;
}

export function resetDemoWallet(userId: string = "default"): number {
  setWallet(userId, 50.0);
  return 50.0;
}
