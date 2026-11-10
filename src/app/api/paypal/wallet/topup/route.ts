import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { topUpDemoWallet, getDemoWalletBalance, setDemoWalletBalance, isDemoUserKey } from "@/lib/demo-wallet";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { createDefaultDonorProfile } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, amount, isDemo = false, userId: requestUserId } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1.0) {
      return NextResponse.json(
        { error: "Invalid top-up amount. Minimum is $1.00." },
        { status: 400 }
      );
    }

    // Resolve caller identity
    let effectiveUserId = requestUserId || "guest-session";
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (clerkSecret && !clerkSecret.includes("REPLACE")) {
      try {
        const clerkAuth = await auth();
        if (clerkAuth?.userId) {
          effectiveUserId = clerkAuth.userId;
        }
      } catch {}
    }

    let captureId = "DEMO-TOPUP";
    const isDemoAllowed = isDemo && isDemoUserKey(effectiveUserId);

    // Require verified PayPal orderId for live/production topups
    if (!isDemoAllowed && !orderId) {
      return NextResponse.json(
        { error: "Payment authorization required: missing PayPal orderId" },
        { status: 400 }
      );
    }

    // If orderId is provided (real/sandbox PayPal capture)
    if (orderId && !isDemoAllowed) {
      try {
        const captureResult = await capturePayPalOrder(orderId, parsedAmount);
        captureId = captureResult.captureId;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "PayPal capture failed";
        console.error("PayPal Wallet Topup Capture Error:", err);
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // Credit in-memory wallet
    const newBalance = topUpDemoWallet(parsedAmount, effectiveUserId);

    // Sync to fallback profile store so profile immediately shows new balance
    const fallbackStore: Map<string, any> =
      (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
    if (fallbackStore?.has(effectiveUserId)) {
      fallbackStore.get(effectiveUserId).wallet_balance = newBalance;
    }

    // Persist to Supabase if configured
    if (isSupabaseConfigured && effectiveUserId) {
      try {
        const { data: currentProfile } = await (supabaseAdmin as any)
          .from("donor_profiles")
          .select("wallet_balance")
          .eq("id", effectiveUserId)
          .maybeSingle();

        if (currentProfile) {
          const currentDbBalance = Number(currentProfile.wallet_balance || 0);
          const updatedDbBalance = Math.round((currentDbBalance + parsedAmount) * 100) / 100;

          await (supabaseAdmin as any)
            .from("donor_profiles")
            .update({
              wallet_balance: updatedDbBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("id", effectiveUserId);
          setDemoWalletBalance(effectiveUserId, updatedDbBalance);
        } else {
          const fresh = createDefaultDonorProfile(
            effectiveUserId,
            `${effectiveUserId}@donor.givi.app`,
            "Kind Supporter"
          );
          fresh.wallet_balance = parsedAmount;
          const { role: _r, ...dbFresh } = fresh;
          await (supabaseAdmin as any).from("donor_profiles").insert([dbFresh]);
          setDemoWalletBalance(effectiveUserId, parsedAmount);
        }
      } catch (dbErr) {
        console.warn("Could not sync wallet top-up to Supabase:", dbErr);
      }
    }

    const finalBalance = getDemoWalletBalance(effectiveUserId);

    return NextResponse.json({
      success: true,
      amount: parsedAmount,
      newBalance: finalBalance,
      captureId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Top-up failed";
    console.error("Top-up route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

