import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { createDefaultDonorProfile, createDefaultBeneficiaryProfile } from "@/lib/types";
import { topUpDemoWallet, getDemoWalletBalance, setDemoWalletBalance, isDemoUserKey } from "@/lib/demo-wallet";
import { runtimeDonations } from "@/lib/ledger";

// In-memory fallback stores for dual mode (separate donor and beneficiary data)
const MAX_FALLBACK_PROFILES = 500;
const fallbackDonorStore: Map<string, any> =
  (globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ || new Map<string, any>();
(globalThis as any).__GIVI_FALLBACK_DONOR_STORE__ = fallbackDonorStore;

const fallbackBeneficiaryStore: Map<string, any> =
  (globalThis as any).__GIVI_FALLBACK_BENEFICIARY_STORE__ || new Map<string, any>();
(globalThis as any).__GIVI_FALLBACK_BENEFICIARY_STORE__ = fallbackBeneficiaryStore;

function setFallbackProfile(store: Map<string, any>, userId: string, profile: any): void {
  if (store.size >= MAX_FALLBACK_PROFILES && !store.has(userId)) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(userId, profile);
}

const getDefaultDonorProfile = createDefaultDonorProfile;
const getDefaultBeneficiaryProfile = createDefaultBeneficiaryProfile;

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    let userEmail: string = "supporter@givi.app";
    let userName: string = "Kind Supporter";

    const clientRequestedUserId = req.nextUrl.searchParams.get("userId");
    const isExplicitDemoRequest = clientRequestedUserId && (clientRequestedUserId.startsWith("judge-") || clientRequestedUserId.startsWith("demo-"));

    // 1. Try Clerk server auth if configured and not an explicit judge/demo request
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!isExplicitDemoRequest && clerkSecret && !clerkSecret.includes("REPLACE")) {
      try {
        const clerkAuth = await auth();
        if (clerkAuth && clerkAuth.userId) {
          userId = clerkAuth.userId;
          const clerkUser = await currentUser();
          if (clerkUser) {
            userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || userEmail;
            userName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || userName;
          }
        }
      } catch (err) {
        // Clerk unauthenticated or key mismatch
      }
    }

    // Unify all judge demo variants under the canonical judge identity
    const isJudgeDonorRequest =
      (clientRequestedUserId && (clientRequestedUserId === "judge-donor-session" || clientRequestedUserId.startsWith("judge-donor"))) ||
      userEmail.toLowerCase().includes("gividonor");

    if (isJudgeDonorRequest) {
      userId = "judge-donor-session";
      userEmail = "gividonor@personal.example.com";
      userName = "Judge Donor";
    }

    const isJudgeBeneficiaryRequest =
      (clientRequestedUserId && (clientRequestedUserId === "judge-beneficiary-session" || clientRequestedUserId.startsWith("judge-beneficiary"))) ||
      userEmail.toLowerCase().includes("givibeneficiary") ||
      userEmail.toLowerCase().includes("relief.beneficiary");

    if (isJudgeBeneficiaryRequest) {
      userId = "judge-beneficiary-session";
      userEmail = "givibeneficiary@business.example.com";
      userName = "Judge Beneficiary (Demo)";
    }

    // Fallback to client query param if not in Clerk session or explicit demo persona
    if (!userId) {
      userId = clientRequestedUserId || "guest-session";
    }

    const requestedRole = req.nextUrl.searchParams.get("role") || "donor";
    const isBeneficiary = requestedRole === "beneficiary";
    const tableName = isBeneficiary ? "beneficiary_profiles" : "donor_profiles";
    const fallbackStore = isBeneficiary ? fallbackBeneficiaryStore : fallbackDonorStore;
    const getDefault = isBeneficiary ? getDefaultBeneficiaryProfile : getDefaultDonorProfile;

    // 2. Query Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabaseAdmin as any)
          .from(tableName)
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (!error && data) {
          const isDemo = isDemoUserKey(userId);
          const dbBalance = Number(data.wallet_balance ?? 0);
          // For authenticated users, database wallet_balance is the single source of truth.
          // For demo keys, use the higher of in-memory or database balance during HMR reload.
          const syncedBalance = !isBeneficiary
            ? (isDemo ? Math.max(dbBalance, getDemoWalletBalance(userId)) : dbBalance)
            : 0;

          if (!isBeneficiary) {
            setDemoWalletBalance(userId, syncedBalance);
          }

          return NextResponse.json({
            profile: { ...data, role: requestedRole, ...(!isBeneficiary ? { wallet_balance: syncedBalance } : {}) },
            source: "supabase",
          });
        }

        // Provision a fresh role-specific record in Supabase
        const freshProfile = getDefault(userId, userEmail, userName);
        const { role: _role, ...dbProfile } = freshProfile;
        const { data: inserted, error: insertError } = await (supabaseAdmin as any)
          .from(tableName)
          .upsert(dbProfile)
          .select()
          .single();

        if (!insertError && inserted) {
          return NextResponse.json({ profile: { ...inserted, role: requestedRole }, source: "supabase_created" });
        }
      } catch (err) {
        console.warn(`Supabase ${tableName} lookup warning, falling back to in-memory:`, err);
      }
    }

    // 3. Fallback memory store
    if (!fallbackStore.has(userId)) {
      setFallbackProfile(fallbackStore, userId, getDefault(userId, userEmail, userName));
    }

    const memProfile = fallbackStore.get(userId);
    if (!isBeneficiary) {
      let currentBal = getDemoWalletBalance(userId);

      // Check if guest session has funds to migrate on sign-in
      if (currentBal === 0 && userId !== "guest-session") {
        const guestBal = getDemoWalletBalance("guest-session");
        if (guestBal > 0) {
          topUpDemoWallet(guestBal, userId);
          setDemoWalletBalance("guest-session", 0);
          currentBal = guestBal;
        }
      }

      // Reconcile: If in-memory wallet reset to 0 on server reload but profile recorded balance, restore it
      if (currentBal === 0 && Number(memProfile.wallet_balance || 0) > 0) {
        topUpDemoWallet(Number(memProfile.wallet_balance), userId);
        currentBal = Number(memProfile.wallet_balance);
      }
      memProfile.wallet_balance = currentBal;
      // Reconcile total_donated from runtime donations
      const matchingDonations = runtimeDonations.filter(
        (d) =>
          d.donorId === userId ||
          (userId.startsWith("user_") && d.donorId === userId) ||
          (userId === "guest-session" && (d.donorId.startsWith("demo-") || d.donorId.startsWith("guest-")))
      );
      if (matchingDonations.length > 0) {
        const sum = matchingDonations.reduce((acc, d) => acc + (d.amount || 0), 0);
        memProfile.total_donated = Math.max(Number(memProfile.total_donated || 0), Math.round(sum * 100) / 100);
        memProfile.streak_days = Math.max(1, Number(memProfile.streak_days || 0));
      }

      // Reconcile unified Judge Donor baseline + agentic disbursements
      if (userId === "judge-donor-session") {
        const judgeBase = 456.93;
        const judgeAgentSpent = currentBal < 33 ? (33 - currentBal) : 0;
        memProfile.total_donated = Math.max(
          Number(memProfile.total_donated || 0),
          Math.round((judgeBase + judgeAgentSpent) * 100) / 100
        );
        memProfile.bills_cleared = Math.max(Number(memProfile.bills_cleared || 0), 9);
      }

      // Reconcile client fallback stats if server in-memory store was restarted
      const fallbackBills = parseInt(req.nextUrl.searchParams.get("fallbackBillsCleared") || "0", 10);
      const fallbackTotal = parseFloat(req.nextUrl.searchParams.get("fallbackTotalDonated") || "0");
      if (!isNaN(fallbackBills) && fallbackBills > 0) {
        memProfile.bills_cleared = Math.max(Number(memProfile.bills_cleared || 0), fallbackBills);
      }
      if (!isNaN(fallbackTotal) && fallbackTotal > 0) {
        memProfile.total_donated = Math.max(Number(memProfile.total_donated || 0), Math.round(fallbackTotal * 100) / 100);
      }
    }

    return NextResponse.json({
      profile: memProfile,
      source: "memory_fallback",
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, role = "donor", ...updates } = body;

    // Resolve userId via Clerk or body
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (clerkSecret && !clerkSecret.includes("REPLACE")) {
      try {
        const clerkAuth = await auth();
        if (clerkAuth && clerkAuth.userId) {
          userId = clerkAuth.userId;
        } else if (
          body.id !== "guest-session" &&
          body.userId !== "guest-session" &&
          (!body.userId || !body.userId.startsWith("guest-"))
        ) {
          // Issue 7: Block unauthenticated requests attempting to overwrite judge or real accounts
          return NextResponse.json(
            { error: "Unauthorized: authentication required to update this profile" },
            { status: 401 }
          );
        }
      } catch (err) {
        if (
          body.id !== "guest-session" &&
          body.userId !== "guest-session" &&
          (!body.userId || !body.userId.startsWith("guest-"))
        ) {
          return NextResponse.json(
            { error: "Unauthorized: session verification failed" },
            { status: 401 }
          );
        }
      }
    }

    if (!userId) {
      userId = body.userId || body.id || "guest-session";
    }

    // Issue 7: Exact and prefix matching to prevent accidental substring capture on real emails
    if (
      userId === "judge-donor-session" ||
      userId.startsWith("judge-donor") ||
      userId === "gividonor@personal.example.com" ||
      userId === "gividonor" ||
      userId.startsWith("gividonor-")
    ) {
      userId = "judge-donor-session";
    } else if (
      userId === "judge-beneficiary-session" ||
      userId.startsWith("judge-beneficiary") ||
      userId === "givibeneficiary@business.example.com" ||
      userId === "givibeneficiary" ||
      userId.startsWith("givibeneficiary-")
    ) {
      userId = "judge-beneficiary-session";
    }

    const isBeneficiary = role === "beneficiary";
    const tableName = isBeneficiary ? "beneficiary_profiles" : "donor_profiles";
    const fallbackStore = isBeneficiary ? fallbackBeneficiaryStore : fallbackDonorStore;
    const getDefault = isBeneficiary ? getDefaultBeneficiaryProfile : getDefaultDonorProfile;

    // Security: Whitelist client-editable profile attributes (block balance & donation total tampering)
    const ALLOWED_FIELDS = new Set([
      "display_name",
      "location",
      "phone_number",
      "paypal_email",
      "payout_paypal_email",
      "is_anonymous",
      "interests",
      "bookmarked_cause_ids",
      "payment_preference",
      "onboarded",
      "monthly_budget",
      "default_swipe_amount",
      "impact_radius",
    ]);

    const sanitizedUpdates: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (ALLOWED_FIELDS.has(key)) {
        // Prevent generic fallback names from overwriting custom user names
        if (key === "display_name" && (val === "Kind Supporter" || val === "Applicant")) {
          continue;
        }
        sanitizedUpdates[key] = val;
      }
    }

    sanitizedUpdates.updated_at = new Date().toISOString();

    // 1. Supabase persistence
    if (isSupabaseConfigured) {
      try {
        // Try updating existing row first (avoids NOT NULL constraint issues on email during upsert)
        const { data: updatedRow, error: updateError } = await (supabaseAdmin as any)
          .from(tableName)
          .update(sanitizedUpdates)
          .eq("id", userId)
          .select()
          .maybeSingle();

        if (!updateError && updatedRow) {
          return NextResponse.json({ profile: { ...updatedRow, role }, source: "supabase" });
        }

        // Row doesn't exist yet: provision with complete defaults including required email
        const freshProfile = {
          ...getDefault(userId, `${userId}@${isBeneficiary ? "beneficiary" : "donor"}.givi.app`, sanitizedUpdates.display_name || (isBeneficiary ? "Applicant" : "Supporter")),
          ...sanitizedUpdates,
          id: userId,
        };
        const { role: _role, ...dbProfile } = freshProfile;

        const { data: insertedRow, error: insertError } = await (supabaseAdmin as any)
          .from(tableName)
          .upsert(dbProfile)
          .select()
          .single();

        if (!insertError && insertedRow) {
          return NextResponse.json({ profile: { ...insertedRow, role }, source: "supabase" });
        }
        console.warn(`Supabase ${tableName} update warning:`, updateError || insertError);
      } catch (err) {
        console.warn(`Supabase ${tableName} error:`, err);
      }
    }

    // 2. Memory store persistence
    const existing = fallbackStore.get(userId) || getDefault(userId);
    const updated = { ...existing, ...sanitizedUpdates, role };
    setFallbackProfile(fallbackStore, userId, updated);

    return NextResponse.json({ profile: updated, source: "memory_fallback" });
  } catch (error: any) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

