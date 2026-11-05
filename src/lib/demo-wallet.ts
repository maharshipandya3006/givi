// ==============================================================================
// Givi — Pre-Authorized Demo Giving Allowance / Test Wallet Helper
// Prevents repetitive PayPal login popups during continuous swipe testing
// ==============================================================================

let sessionBalance = 50.00; // Default $50 test balance for judge / donor evaluation

export function getDemoWalletBalance(): number {
  return sessionBalance;
}

export function debitDemoWallet(amount: number): { success: boolean; newBalance: number; error?: string } {
  if (amount <= 0) {
    return { success: false, newBalance: sessionBalance, error: "Invalid donation amount" };
  }

  if (sessionBalance < amount) {
    return {
      success: false,
      newBalance: sessionBalance,
      error: `Insufficient Giving Allowance. Current balance is $${sessionBalance.toFixed(2)}. Please top up.`,
    };
  }

  sessionBalance = Math.round((sessionBalance - amount) * 100) / 100;
  return { success: true, newBalance: sessionBalance };
}

export function topUpDemoWallet(amount: number): number {
  sessionBalance = Math.round((sessionBalance + amount) * 100) / 100;
  return sessionBalance;
}

export function resetDemoWallet(): number {
  sessionBalance = 50.00;
  return sessionBalance;
}

