import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getActiveCauses, reserveCauseFunding, releaseCauseFunding } from "@/lib/causes-store";
import { disbursePayPalPayout } from "@/lib/paypal";
import { generateImpactToast } from "@/lib/gemini";
import { recordRuntimeDonation } from "@/lib/ledger";
import { debitDemoWallet, getDemoWalletBalance, topUpDemoWallet, setDemoWalletBalance, isDemoUserKey, withUserLock } from "@/lib/demo-wallet";
import { Donation, Cause, createDefaultDonorProfile } from "@/lib/types";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export interface AgentRunLog {
  causeId: string;
  causeTitle: string;
  amount: number;
  receiverEmail: string;
  receiverName?: string;
  category?: string;
  isFunded?: boolean;
  payoutBatchId: string;
  trustScore: number;
  impactMessage: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      maxAmountPerCause = 15.0,
      maxPerCause,
      minTrustScore = 85,
      categories = ["utilities", "medical", "food"],
      maxTotalBudget = 50.0,
      monthlyBudget,
      donorId = "guest-session",
      donorName: requestedDonorName,
    } = body;

    // Enforce authenticated session if Clerk is configured
    let authUserId: string | null = null;
    let authUserName: string | null = null;
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (clerkSecret && !clerkSecret.includes("REPLACE")) {
      try {
        const clerkAuth = await auth();
        authUserId = clerkAuth?.userId || null;
        if (authUserId) {
          const clerkUser = await currentUser();
          if (clerkUser) {
            authUserName =
              `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
              clerkUser.username ||
              clerkUser.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
              null;
          }
        }
      } catch {}
    }
    // Security (Issue 9): Reject unauthenticated claims on real user accounts
    if (donorId && donorId.startsWith("user_") && donorId !== "user_anon" && authUserId !== donorId) {
      return NextResponse.json(
        { error: "Authentication required to run giving agent for this donor account" },
        { status: 401 }
      );
    }
    const isExplicitDemo = Boolean(donorId && (isDemoUserKey(donorId) || donorId.startsWith("judge-")));
    const effectiveDonorId = isExplicitDemo ? donorId : (authUserId || donorId || "guest-session");

    // Resolve user's human name for transaction attribution
    let effectiveDonorName =
      authUserName ||
      (requestedDonorName && requestedDonorName !== "Kind Supporter" ? requestedDonorName : "") ||
      "";

    if (!effectiveDonorName) {
      if (isSupabaseConfigured && !isDemoUserKey(effectiveDonorId)) {
        try {
          const { data: dbProf } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("display_name, email")
            .eq("id", effectiveDonorId)
            .maybeSingle();
          if (dbProf?.display_name && dbProf.display_name !== "Kind Supporter") {
            effectiveDonorName = dbProf.display_name;
          } else if (dbProf?.email && dbProf.email.includes("@")) {
            effectiveDonorName = dbProf.email.split("@")[0];
          }
        } catch {}
      }
      if (!effectiveDonorName) {
        const fallbackStore: Map<string, any> =
          (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
        const fbProf = fallbackStore?.get(effectiveDonorId);
        if (fbProf?.display_name && fbProf.display_name !== "Kind Supporter") {
          effectiveDonorName = fbProf.display_name;
        } else if (fbProf?.email && fbProf.email.includes("@")) {
          effectiveDonorName = fbProf.email.split("@")[0];
        }
      }
    }

    if (!effectiveDonorName) {
      effectiveDonorName = requestedDonorName || "Kind Supporter";
    }

    const requestedBudget = Math.min(monthlyBudget || maxTotalBudget, 100.0);
    const perCauseLimit = Math.min(maxPerCause || maxAmountPerCause, requestedBudget);

    // Security: verify donor has active Giving Allowance balance before autonomous run
    let availableBalance = getDemoWalletBalance(effectiveDonorId);
    if (availableBalance < 1.0) {
      if (isSupabaseConfigured && !isDemoUserKey(effectiveDonorId)) {
        try {
          const { data: dbProf } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("wallet_balance")
            .eq("id", effectiveDonorId)
            .maybeSingle();
          if (dbProf && typeof dbProf.wallet_balance !== "undefined") {
            const dbBal = Number(dbProf.wallet_balance);
            setDemoWalletBalance(effectiveDonorId, dbBal);
            availableBalance = dbBal;
          }
        } catch (dbErr) {
          console.warn("Could not sync agent wallet balance from Supabase:", dbErr);
        }
      }
      if (availableBalance < 1.0) {
        const fallbackStore: Map<string, any> =
          (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
        const profileBal = Number(fallbackStore?.get(effectiveDonorId)?.wallet_balance || 0);

        if (profileBal >= 1.0) {
          setDemoWalletBalance(effectiveDonorId, profileBal);
          availableBalance = profileBal;
        }
      }
    }

    if (availableBalance < 1.0) {
      return NextResponse.json(
        { error: `Insufficient donor Giving Allowance balance ($${availableBalance.toFixed(2)}). Please top up your wallet first.` },
        { status: 400 }
      );
    }

    let remainingBudget = Math.min(requestedBudget, availableBalance);
    const executionLogs: AgentRunLog[] = [];

    // Filter causes matching donor agent policies (merging runtime memory and Supabase)
    let candidateCauses: Cause[] = getActiveCauses();
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabaseAdmin
          .from("causes")
          .select("*")
          .eq("status", "active");
        if (data && data.length > 0) {
          const supabaseMapped: Cause[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            needType: item.need_type,
            goalAmount: parseFloat(item.goal_amount),
            raisedAmount: parseFloat(item.raised_amount),
            receiverEmail: item.receiver_email,
            receiverName: item.receiver_name,
            receiverLocation: item.receiver_location,
            receiverId: item.receiver_id,
            status: item.status,
            evidenceUrls: item.evidence_urls || [],
            redactedProofUrl: item.redacted_proof_url,
            trustScore: item.trust_score,
            channel3Product: item.channel3_product,
            milestones: item.milestones,
            deadline: item.deadline,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          const existingIds = new Set(candidateCauses.map((c) => c.id));
          candidateCauses = [...candidateCauses, ...supabaseMapped.filter((c) => !existingIds.has(c.id))];
        }
      } catch (err) {
        console.warn("Could not query Supabase causes for agent:", err);
      }
    }

    const eligibleCauses = candidateCauses.filter((c) => {
      const remainingAsk = c.goalAmount - c.raisedAmount;
      return (
        remainingAsk > 0 &&
        c.trustScore.overall >= minTrustScore &&
        categories.includes(c.category)
      );
    });

    const causesToProcess = eligibleCauses.slice(0, 10);

    for (const cause of causesToProcess) {
      if (remainingBudget <= 0) break;

      const remainingAsk = cause.goalAmount - cause.raisedAmount;
      const targetDonationAmt = Math.min(perCauseLimit, remainingAsk, remainingBudget);

      if (targetDonationAmt < 1.0) continue;

      // Atomically reserve funding to protect against concurrent races
      const reservation = reserveCauseFunding(cause.id, targetDonationAmt, cause);
      if (!reservation.success) continue;
      const donationAmt = reservation.actualAmount;
      if (reservation.cause) {
        cause.raisedAmount = reservation.cause.raisedAmount;
        cause.status = reservation.cause.status;
      }

      // Debit donor wallet allowance under user lock (Issue 1)
      const walletDebit = await withUserLock(effectiveDonorId, async () => {
        if (isSupabaseConfigured && !isDemoUserKey(effectiveDonorId)) {
          const { data: dbProf } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("wallet_balance")
            .eq("id", effectiveDonorId)
            .maybeSingle();
          const currentBal = Number(dbProf?.wallet_balance || 0);
          if (currentBal < donationAmt) {
            return { success: false, newBalance: currentBal, error: "Insufficient balance" };
          }
          const nextBal = Math.round((currentBal - donationAmt) * 100) / 100;
          const { data: updatedRows } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .update({ wallet_balance: nextBal, updated_at: new Date().toISOString() })
            .eq("id", effectiveDonorId)
            .gte("wallet_balance", donationAmt)
            .select();
          if (!updatedRows || updatedRows.length === 0) {
            return { success: false, newBalance: currentBal, error: "Concurrent debit conflict" };
          }
          setDemoWalletBalance(effectiveDonorId, nextBal);
          return { success: true, newBalance: nextBal };
        }
        return debitDemoWallet(donationAmt, effectiveDonorId);
      });
      if (!walletDebit.success) {
        releaseCauseFunding(cause.id, donationAmt);
        continue;
      }

      // Check cause status in database before initiating payout (Issue 2)
      if (isSupabaseConfigured) {
        try {
          const { data: dbCause } = await (supabaseAdmin as any)
            .from("causes")
            .select("raised_amount, goal_amount, status")
            .eq("id", cause.id)
            .maybeSingle();
          if (dbCause) {
            const dbRemaining = Math.max(0, Number(dbCause.goal_amount || 0) - Number(dbCause.raised_amount || 0));
            if (dbRemaining < donationAmt || dbCause.status === "funded") {
              releaseCauseFunding(cause.id, donationAmt);
              topUpDemoWallet(donationAmt, effectiveDonorId);
              if (isSupabaseConfigured && !isDemoUserKey(effectiveDonorId)) {
                try {
                  const { data: dbProf } = await (supabaseAdmin as any)
                    .from("donor_profiles")
                    .select("wallet_balance")
                    .eq("id", effectiveDonorId)
                    .maybeSingle();
                  const curr = Number(dbProf?.wallet_balance || 0);
                  const refunded = Math.round((curr + donationAmt) * 100) / 100;
                  await (supabaseAdmin as any)
                    .from("donor_profiles")
                    .update({ wallet_balance: refunded, updated_at: new Date().toISOString() })
                    .eq("id", effectiveDonorId);
                  setDemoWalletBalance(effectiveDonorId, refunded);
                } catch (refundErr) {
                  console.error("Failed to refund Supabase wallet on concurrent funded cause:", refundErr);
                }
              }
              const fallbackStore: Map<string, any> = (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__;
              if (fallbackStore?.has(effectiveDonorId)) {
                const prev = Number(fallbackStore.get(effectiveDonorId).wallet_balance || 0);
                fallbackStore.get(effectiveDonorId).wallet_balance = Math.round((prev + donationAmt) * 100) / 100;
              }
              continue;
            }
          }
        } catch {}
      }

      try {
        const donationId = `don-agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Execute autonomous PayPal Payout
        const payoutResult = await disbursePayPalPayout({
          recipientEmail: cause.receiverEmail,
          amount: donationAmt,
          note: `Autonomous Giving Agent: direct relief for "${cause.title.slice(0, 50)}"`,
          senderItemId: donationId,
        });

        // Fast impact note for autonomous batch disbursements (avoids serial LLM latency)
        const toast = `Autonomous agent disbursed $${donationAmt.toFixed(2)} direct relief for ${cause.receiverName} (${cause.category}).`;

        const donationRecord: Donation = {
          id: donationId,
          causeId: cause.id,
          donorId: effectiveDonorId,
          donorName: effectiveDonorName,
          amount: donationAmt,
          paypalOrderId: "AGENTIC_AUTONOMOUS_EXECUTION",
          paypalPayoutBatchId: payoutResult.payoutBatchId,
          paypalPayoutItemId: payoutResult.payoutItemId,
          isAgentic: true,
          impactMessage: toast,
          createdAt: new Date().toISOString(),
        };

        recordRuntimeDonation(donationRecord);
        remainingBudget = Math.round((remainingBudget - donationAmt) * 100) / 100;

        // Persist autonomous donation to Supabase concurrently (Issue 14 & Issue 5)
        if (isSupabaseConfigured) {
          try {
            const [{ error: donErr }] = await Promise.all([
              supabaseAdmin.from("donations").insert([
                {
                  id: donationRecord.id,
                  cause_id: donationRecord.causeId,
                  donor_id: donationRecord.donorId,
                  donor_name: donationRecord.donorName,
                  amount: donationRecord.amount,
                  paypal_order_id: donationRecord.paypalOrderId,
                  paypal_payout_batch_id: donationRecord.paypalPayoutBatchId,
                  paypal_payout_item_id: donationRecord.paypalPayoutItemId,
                  is_agentic: true,
                  impact_message: donationRecord.impactMessage,
                },
              ]),
              supabaseAdmin
                .from("causes")
                .update({
                  raised_amount: cause.raisedAmount,
                  status: cause.status,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", cause.id)
                .lte("raised_amount", Math.max(0, cause.goalAmount - donationAmt)),
            ]);
            if (donErr) {
              console.warn("Supabase agent donation insert warning:", donErr.message);
            }
          } catch (donSyncErr) {
            console.warn("Could not persist agent donation row:", donSyncErr);
          }

          try {
            if (effectiveDonorId && effectiveDonorId !== "user_anon") {
              const { data: donorProf } = await (supabaseAdmin as any)
                .from("donor_profiles")
                .select("total_donated, bills_cleared, wallet_balance")
                .eq("id", effectiveDonorId)
                .maybeSingle();

              if (donorProf) {
                await (supabaseAdmin as any)
                  .from("donor_profiles")
                  .update({
                    total_donated: Math.round((Number(donorProf.total_donated || 0) + donationAmt) * 100) / 100,
                    bills_cleared: cause.status === "funded"
                      ? Number(donorProf.bills_cleared || 0) + 1
                      : Number(donorProf.bills_cleared || 0),
                    wallet_balance: getDemoWalletBalance(effectiveDonorId),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", effectiveDonorId);
              } else {
                const fresh = createDefaultDonorProfile(
                  effectiveDonorId,
                  `${effectiveDonorId}@donor.givi.app`,
                  effectiveDonorName
                );
                fresh.total_donated = donationAmt;
                fresh.bills_cleared = cause.status === "funded" ? 1 : 0;
                fresh.wallet_balance = getDemoWalletBalance(effectiveDonorId);
                const { role: _r, ...dbFresh } = fresh;
                await (supabaseAdmin as any)
                  .from("donor_profiles")
                  .insert([dbFresh]);
              }
            }
          } catch (dbErr) {
            console.warn("Could not sync agent donation to Supabase:", dbErr);
          }
        }

        // Always sync in-memory fallback profile statistics
        const fallbackStore: Map<string, any> =
          (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ || new Map<string, any>();
        (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ = fallbackStore;
        if (effectiveDonorId && effectiveDonorId !== "user_anon") {
          if (!fallbackStore.has(effectiveDonorId)) {
            fallbackStore.set(
              effectiveDonorId,
              createDefaultDonorProfile(effectiveDonorId, `${effectiveDonorId}@donor.givi.app`, effectiveDonorName)
            );
          }
          const memProf = fallbackStore.get(effectiveDonorId);
          if (effectiveDonorName && (!memProf.display_name || memProf.display_name === "Kind Supporter" || memProf.display_name === "Autonomous Donor")) {
            memProf.display_name = effectiveDonorName;
          }
          memProf.total_donated = Math.round((Number(memProf.total_donated || 0) + donationAmt) * 100) / 100;
          if (cause.status === "funded") {
            memProf.bills_cleared = Number(memProf.bills_cleared || 0) + 1;
          }
          memProf.wallet_balance = getDemoWalletBalance(effectiveDonorId);
          memProf.streak_days = Math.max(1, Number(memProf.streak_days || 0));
          memProf.updated_at = new Date().toISOString();
        }

        executionLogs.push({
          causeId: cause.id,
          causeTitle: cause.title,
          amount: donationAmt,
          receiverEmail: cause.receiverEmail,
          receiverName: cause.receiverName,
          category: cause.category,
          isFunded: cause.status === "funded",
          payoutBatchId: payoutResult.payoutBatchId,
          trustScore: cause.trustScore.overall,
          impactMessage: toast,
          timestamp: new Date().toISOString(),
        });
      } catch (causeErr) {
        // Rollback reserved funding and refund donor wallet allowance on failure (Issue 2)
        releaseCauseFunding(cause.id, donationAmt);
        topUpDemoWallet(donationAmt, effectiveDonorId);
        if (isSupabaseConfigured && !isDemoUserKey(effectiveDonorId)) {
          try {
            const { data: dbProf } = await (supabaseAdmin as any)
              .from("donor_profiles")
              .select("wallet_balance")
              .eq("id", effectiveDonorId)
              .maybeSingle();
            const curr = Number(dbProf?.wallet_balance || 0);
            const refunded = Math.round((curr + donationAmt) * 100) / 100;
            await (supabaseAdmin as any)
              .from("donor_profiles")
              .update({ wallet_balance: refunded, updated_at: new Date().toISOString() })
              .eq("id", effectiveDonorId);
            setDemoWalletBalance(effectiveDonorId, refunded);
          } catch (refundErr) {
            console.error("Failed to refund Supabase wallet on agent payout error:", refundErr);
          }
        }
        console.warn(`Autonomous payout failed for cause ${cause.id}:`, causeErr);
      }
    }

    return NextResponse.json({
      success: true,
      executedDisbursements: executionLogs.length,
      totalDisbursed: Math.round((Math.min(requestedBudget, availableBalance) - remainingBudget) * 100) / 100,
      remainingBudget,
      payoutsExecuted: executionLogs,
      logs: executionLogs,
      walletBalance: getDemoWalletBalance(effectiveDonorId),
    });
  } catch (err: unknown) {
    console.error("Agent runner error:", err);
    return NextResponse.json({ error: "Agent execution failed" }, { status: 500 });
  }
}
