import { NextRequest, NextResponse } from "next/server";
import { getActiveCauses } from "@/lib/causes-store";
import { disbursePayPalPayout } from "@/lib/paypal";
import { generateImpactToast } from "@/lib/gemini";
import { runtimeDonations } from "@/lib/ledger";
import { Donation } from "@/lib/types";

export interface AgentRunLog {
  causeId: string;
  causeTitle: string;
  amount: number;
  receiverEmail: string;
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
      minTrustScore = 85,
      categories = ["utilities", "medical", "food"],
      maxTotalBudget = 50.0,
    } = body;

    let remainingBudget = maxTotalBudget;
    const executionLogs: AgentRunLog[] = [];

    // Filter causes matching donor agent policies
    const eligibleCauses = getActiveCauses().filter((c) => {
      const remainingAsk = c.goalAmount - c.raisedAmount;
      return (
        remainingAsk > 0 &&
        c.trustScore.overall >= minTrustScore &&
        categories.includes(c.category)
      );
    });

    for (const cause of eligibleCauses) {
      if (remainingBudget <= 0) break;

      const remainingAsk = cause.goalAmount - cause.raisedAmount;
      const donationAmt = Math.min(maxAmountPerCause, remainingAsk, remainingBudget);

      if (donationAmt < 1.0) continue;

      const donationId = `don-agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Execute autonomous PayPal Payout
      const payoutResult = await disbursePayPalPayout({
        recipientEmail: cause.receiverEmail,
        amount: donationAmt,
        note: `Autonomous Giving Agent: direct relief for "${cause.title.slice(0, 50)}"`,
        senderItemId: donationId,
      });

      // Synthesize impact toast
      const toast = await generateImpactToast({
        causeTitle: cause.title,
        donorName: "Autonomous Giving Agent",
        amount: donationAmt,
        category: cause.category,
        recipientName: cause.receiverName,
        location: cause.receiverLocation,
      });

      // Update state
      cause.raisedAmount = Math.round((cause.raisedAmount + donationAmt) * 100) / 100;
      if (cause.raisedAmount >= cause.goalAmount) {
        cause.status = "funded";
      }

      const donationRecord: Donation = {
        id: donationId,
        causeId: cause.id,
        donorId: "agent_runner_autonomous",
        donorName: "Autonomous Giving Agent",
        amount: donationAmt,
        paypalOrderId: "AGENTIC_AUTONOMOUS_EXECUTION",
        paypalPayoutBatchId: payoutResult.payoutBatchId,
        paypalPayoutItemId: payoutResult.payoutItemId,
        isAgentic: true,
        impactMessage: toast,
        createdAt: new Date().toISOString(),
      };

      runtimeDonations.unshift(donationRecord);
      remainingBudget = Math.round((remainingBudget - donationAmt) * 100) / 100;

      executionLogs.push({
        causeId: cause.id,
        causeTitle: cause.title,
        amount: donationAmt,
        receiverEmail: cause.receiverEmail,
        payoutBatchId: payoutResult.payoutBatchId,
        trustScore: cause.trustScore.overall,
        impactMessage: toast,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      executedDisbursements: executionLogs.length,
      totalDisbursed: maxTotalBudget - remainingBudget,
      remainingBudget,
      logs: executionLogs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Agent execution failed";
    console.error("Agent runner error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

