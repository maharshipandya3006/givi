import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { createDefaultDonorProfile, createDefaultBeneficiaryProfile } from "@/lib/types";
import { topUpDemoWallet, getDemoWalletBalance, setDemoWalletBalance, isDemoUserKey } from "@/lib/demo-wallet";
import { runtimeDonations } from "@/lib/ledger";
import { findCauseById } from "@/lib/causes-store";
import { cleanDonorName, isCustomGuestUsername } from "@/lib/guest-identity";

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
    const isExplicitDemoRequest = Boolean(
      clientRequestedUserId &&
        (isDemoUserKey(clientRequestedUserId) || clientRequestedUserId.startsWith("judge-"))
    );

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
    const lookupName = req.nextUrl.searchParams.get("lookupName")?.trim() || "";
    const isBeneficiary = requestedRole === "beneficiary";
    const tableName = isBeneficiary ? "beneficiary_profiles" : "donor_profiles";
    const fallbackStore = isBeneficiary ? fallbackBeneficiaryStore : fallbackDonorStore;
    const getDefault = isBeneficiary ? getDefaultBeneficiaryProfile : getDefaultDonorProfile;

    async function fetchDonorRecentTransactions(targetUserId: string, exactGuestName: string) {
      const txs: any[] = [];
      const seen = new Set<string>();
      const pushTx = (tx: any) => {
        if (!tx?.id || seen.has(tx.id)) return;
        seen.add(tx.id);
        txs.push(tx);
      };

      if (isSupabaseConfigured) {
        try {
          const { data: byId } = await (supabaseAdmin as any)
            .from("donations")
            .select("*, causes(title, category, receiver_location, receiver_email, receiver_name, trust_score)")
            .eq("donor_id", targetUserId)
            .order("created_at", { ascending: false })
            .limit(50);

          const rows = [...(byId || [])];

          if (isCustomGuestUsername(exactGuestName) && !targetUserId.startsWith("user_") && !targetUserId.startsWith("judge-")) {
            const { data: byName } = await (supabaseAdmin as any)
              .from("donations")
              .select("*, causes(title, category, receiver_location, receiver_email, receiver_name, trust_score)")
              .eq("donor_name", exactGuestName)
              .not("donor_id", "like", "user_%")
              .neq("donor_id", "judge-donor-session")
              .order("created_at", { ascending: false })
              .limit(50);
            if (byName) rows.push(...byName);
          }

          for (const d of rows) {
            const matchedCause = d.causes || findCauseById(d.cause_id);
            pushTx({
              id: d.id,
              timestamp: d.created_at,
              causeId: d.cause_id,
              causeTitle: matchedCause?.title || "Verified Relief Need",
              category: matchedCause?.category || "utilities",
              donorName: d.donor_name || exactGuestName || "Kind Supporter",
              donorId: d.donor_id,
              amount: parseFloat(d.amount) || 0,
              paypalPayoutBatchId: d.paypal_payout_batch_id || `BATCH-${String(d.id).slice(0, 8)}`,
              receiverLocation: matchedCause?.receiver_location || matchedCause?.receiverLocation || "United States",
              receiverEmail: matchedCause?.receiver_email || matchedCause?.receiverEmail || "PayPal Rail",
              receiverName: matchedCause?.receiver_name || matchedCause?.receiverName || "Verified Beneficiary",
              trustScore: matchedCause?.trust_score?.overall || matchedCause?.trustScore?.overall || 95,
              isAgentic: Boolean(d.is_agentic),
            });
          }
        } catch (err) {
          console.warn("Could not query donor recent transactions:", err);
        }
      }

      for (const d of runtimeDonations) {
        const cleaned = cleanDonorName(d.donorName || "");
        const matchesId = d.donorId === targetUserId;
        const matchesGuestName =
          isCustomGuestUsername(exactGuestName) &&
          !targetUserId.startsWith("user_") &&
          !targetUserId.startsWith("judge-") &&
          (!d.donorId || !d.donorId.startsWith("user_")) &&
          cleaned === exactGuestName;
        if (matchesId || matchesGuestName) {
          const matchedCause = findCauseById(d.causeId);
          pushTx({
            id: d.id,
            timestamp: d.createdAt,
            causeId: d.causeId,
            causeTitle: matchedCause?.title || "Verified Relief Need",
            category: matchedCause?.category || "utilities",
            donorName: d.donorName || exactGuestName || "Kind Supporter",
            donorId: d.donorId,
            amount: Number(d.amount) || 0,
            paypalPayoutBatchId: d.paypalPayoutBatchId || `BATCH-${d.id.slice(0, 8)}`,
            receiverLocation: matchedCause?.receiverLocation || "United States",
            receiverEmail: matchedCause?.receiverEmail || "PayPal Rail",
            receiverName: matchedCause?.receiverName || "Verified Beneficiary",
            trustScore: matchedCause?.trustScore?.overall || 95,
            isAgentic: Boolean(d.isAgentic),
          });
        }
      }

      txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return txs.slice(0, 50);
    }

    // 2. Query Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabaseAdmin as any)
          .from(tableName)
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        const isEmptyCanonicalGuest =
          !isBeneficiary &&
          data &&
          isCustomGuestUsername(lookupName) &&
          userId.startsWith("guest-u-") &&
          Number(data.total_donated || 0) === 0 &&
          Number(data.wallet_balance || 0) === 0;

        if (!error && data && !isEmptyCanonicalGuest) {
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

          const effectiveName = isCustomGuestUsername(data.display_name)
            ? data.display_name
            : lookupName;
          const recentTransactions = !isBeneficiary
            ? await fetchDonorRecentTransactions(userId, effectiveName)
            : [];

          return NextResponse.json({
            profile: { ...data, role: requestedRole, ...(!isBeneficiary ? { wallet_balance: syncedBalance } : {}) },
            recentTransactions,
            restored: Boolean(
              Number(data.total_donated || 0) > 0 ||
              syncedBalance > 0 ||
              Number(data.bills_cleared || 0) > 0 ||
              recentTransactions.length > 0
            ),
            source: "supabase",
          });
        }

        // Exact case-sensitive lookup for returning named guest accounts stored under an older guest-* ID
        if (!isBeneficiary && isCustomGuestUsername(lookupName) && !userId.startsWith("user_") && !userId.startsWith("judge-")) {
          const { data: legacyNamed } = await (supabaseAdmin as any)
            .from("donor_profiles")
            .select("*")
            .eq("display_name", lookupName)
            .not("id", "like", "user_%")
            .neq("id", "judge-donor-session")
            .neq("id", "judge-beneficiary-session")
            .order("total_donated", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (legacyNamed) {
            const restoredBal = Math.max(Number(legacyNamed.wallet_balance || 0), getDemoWalletBalance(userId));
            setDemoWalletBalance(userId, restoredBal);
            const { role: _legacyRole, ...restoredRow } = {
              ...legacyNamed,
              id: userId,
              wallet_balance: restoredBal,
              updated_at: new Date().toISOString(),
            };
            await (supabaseAdmin as any).from("donor_profiles").upsert(restoredRow);
            const recentTransactions = await fetchDonorRecentTransactions(legacyNamed.id, lookupName);
            return NextResponse.json({
              profile: { ...restoredRow, role: requestedRole },
              recentTransactions,
              restored: true,
              source: "supabase_name_match",
            });
          }
        }

        if (data && isEmptyCanonicalGuest) {
          const syncedBalance = Math.max(Number(data.wallet_balance ?? 0), getDemoWalletBalance(userId));
          const recentTransactions = await fetchDonorRecentTransactions(userId, lookupName);
          return NextResponse.json({
            profile: { ...data, role: requestedRole, wallet_balance: syncedBalance },
            recentTransactions,
            restored: recentTransactions.length > 0 || syncedBalance > 0,
            source: "supabase",
          });
        }

        // Provision a fresh role-specific record in Supabase
        const initialName = isCustomGuestUsername(lookupName) ? lookupName : userName;
        const freshProfile = getDefault(userId, userEmail, initialName);
        if (!isBeneficiary && isDemoUserKey(userId)) {
          (freshProfile as any).wallet_balance = Math.max(
            Number((freshProfile as any).wallet_balance ?? 0),
            getDemoWalletBalance(userId)
          );
        }
        const { role: _role, ...dbProfile } = freshProfile;
        const { data: inserted, error: insertError } = await (supabaseAdmin as any)
          .from(tableName)
          .upsert(dbProfile)
          .select()
          .single();

        if (!insertError && inserted) {
          const syncedBalance = !isBeneficiary
            ? (isDemoUserKey(userId) ? Math.max(Number(inserted.wallet_balance ?? 0), getDemoWalletBalance(userId)) : Number(inserted.wallet_balance ?? 0))
            : 0;
          const recentTransactions = !isBeneficiary
            ? await fetchDonorRecentTransactions(userId, lookupName)
            : [];
          return NextResponse.json({
            profile: { ...inserted, role: requestedRole, ...(!isBeneficiary ? { wallet_balance: syncedBalance } : {}) },
            recentTransactions,
            restored: recentTransactions.length > 0 || syncedBalance > 0,
            source: "supabase_created",
          });
        }
      } catch (err) {
        console.warn(`Supabase ${tableName} lookup warning, falling back to in-memory:`, err);
      }
    }

    // 3. Fallback memory store (with exact case-sensitive guest username restore)
    let resolvedFallbackProfile = fallbackStore.get(userId);
    let wasRestoredFromFallback = false;

    if (
      !isBeneficiary &&
      isCustomGuestUsername(lookupName) &&
      !userId.startsWith("user_") &&
      !userId.startsWith("judge-") &&
      (!resolvedFallbackProfile ||
        (Number(resolvedFallbackProfile.total_donated || 0) === 0 &&
          Number(resolvedFallbackProfile.wallet_balance || 0) === 0))
    ) {
      for (const [k, candidate] of fallbackStore.entries()) {
        if (
          k !== userId &&
          !k.startsWith("user_") &&
          !k.startsWith("judge-") &&
          candidate?.display_name === lookupName
        ) {
          resolvedFallbackProfile = { ...candidate, id: userId };
          setFallbackProfile(fallbackStore, userId, resolvedFallbackProfile);
          wasRestoredFromFallback = true;
          break;
        }
      }
    }

    if (!resolvedFallbackProfile) {
      const initialName = isCustomGuestUsername(lookupName) ? lookupName : userName;
      setFallbackProfile(fallbackStore, userId, getDefault(userId, userEmail, initialName));
      resolvedFallbackProfile = fallbackStore.get(userId);
    }

    const memProfile = resolvedFallbackProfile;
    if (!isBeneficiary) {
      let currentBal = getDemoWalletBalance(userId);

      // Check if guest session has funds to migrate on sign-in
      if (currentBal === 0 && userId !== "guest-session" && !userId.startsWith("guest-u-")) {
        const guestBal = getDemoWalletBalance("guest-session");
        if (guestBal > 0) {
          topUpDemoWallet(guestBal, userId);
          setDemoWalletBalance("guest-session", 0);
          currentBal = guestBal;
        }
      }

      // Reconcile: If in-memory wallet reset to 0 on server reload but profile recorded balance, restore it
      if (Number(memProfile.wallet_balance || 0) > currentBal) {
        setDemoWalletBalance(userId, Number(memProfile.wallet_balance));
        currentBal = Number(memProfile.wallet_balance);
      }
      memProfile.wallet_balance = currentBal;
      // Reconcile total_donated from runtime donations
      const matchingDonations = runtimeDonations.filter(
        (d) =>
          d.donorId === userId ||
          (userId.startsWith("user_") && d.donorId === userId) ||
          (isCustomGuestUsername(lookupName) &&
            !userId.startsWith("user_") &&
            !userId.startsWith("judge-") &&
            (!d.donorId || !d.donorId.startsWith("user_")) &&
            cleanDonorName(d.donorName || "") === lookupName) ||
          (userId === "guest-session" && (d.donorId.startsWith("demo-") || d.donorId.startsWith("guest-")))
      );
      if (matchingDonations.length > 0) {
        const sum = matchingDonations.reduce((acc, d) => acc + (d.amount || 0), 0);
        memProfile.total_donated = Math.max(Number(memProfile.total_donated || 0), Math.round(sum * 100) / 100);
        memProfile.bills_cleared = Math.max(Number(memProfile.bills_cleared || 0), matchingDonations.length);
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

      // Reconcile client fallback stats if server in-memory store was restarted (strictly demo sessions)
      if (isDemoUserKey(userId)) {
        const fallbackBills = parseInt(req.nextUrl.searchParams.get("fallbackBillsCleared") || "0", 10);
        const fallbackTotal = parseFloat(req.nextUrl.searchParams.get("fallbackTotalDonated") || "0");
        if (!isNaN(fallbackBills) && fallbackBills > 0 && fallbackBills <= 1000) {
          memProfile.bills_cleared = Math.max(Number(memProfile.bills_cleared || 0), fallbackBills);
        }
        if (!isNaN(fallbackTotal) && Number.isFinite(fallbackTotal) && fallbackTotal > 0 && fallbackTotal <= 10000) {
          memProfile.total_donated = Math.max(Number(memProfile.total_donated || 0), Math.round(fallbackTotal * 100) / 100);
        }
      }
    }

    const recentTransactions = !isBeneficiary
      ? await fetchDonorRecentTransactions(userId, lookupName || memProfile?.display_name || "")
      : [];

    return NextResponse.json({
      profile: memProfile,
      recentTransactions,
      restored: Boolean(
        wasRestoredFromFallback ||
        Number(memProfile?.total_donated || 0) > 0 ||
        Number(memProfile?.wallet_balance || 0) > 0 ||
        recentTransactions.length > 0
      ),
      source: wasRestoredFromFallback ? "memory_name_match" : "memory_fallback",
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
        if (key === "default_swipe_amount") {
          const num = typeof val === "number" ? val : parseFloat(String(val));
          if (Number.isFinite(num)) {
            sanitizedUpdates[key] = Math.min(100, Math.max(1, Math.round(num * 100) / 100));
          }
          continue;
        }
        if (key === "monthly_budget") {
          const num = typeof val === "number" ? val : parseFloat(String(val));
          if (Number.isFinite(num)) {
            sanitizedUpdates[key] = Math.min(10000, Math.max(0, Math.round(num * 100) / 100));
          }
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
          setFallbackProfile(fallbackStore, userId, { ...updatedRow, role });
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
          setFallbackProfile(fallbackStore, userId, { ...insertedRow, role });
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

