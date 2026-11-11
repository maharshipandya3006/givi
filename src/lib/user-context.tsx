"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser as useClerkUser, useClerk } from "@clerk/nextjs";
import { CauseCategory, createDefaultDonorProfile } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { guestIdForUsername, isCustomGuestUsername } from "@/lib/guest-identity";

export type UserRole = "donor" | "beneficiary";
export type DemoPersona = "judge_donor" | "judge_beneficiary" | null;

export interface DonorPreferences {
  interests: CauseCategory[];
  defaultSwipeAmount: number;
  monthlyBudget: number;
  impactRadius: "urgent" | "local" | "national" | "global";
  isAnonymous: boolean;
  displayName: string;
  location: string;
  bookmarkedCauseIds: string[];
  totalDonated: number;
  billsCleared: number;
  streakDays: number;
  walletBalance: number;
  onboarded: boolean;
  paymentPreference: "wallet" | "direct_paypal";
  paypalEmail?: string;
}

export interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userId: string;
  userEmail: string;
  userName?: string;
  isSignedIn: boolean;
  isClerkSignedIn: boolean;
  isLoaded: boolean;
  isDemoUser: boolean;
  isJudgeDonor: boolean;
  isJudgeBeneficiary: boolean;
  demoPersona: DemoPersona;
  switchJudgePersona: (persona: DemoPersona) => void;
  enableDemoSession: (role?: UserRole) => void;
  isOnboarded: boolean;
  donorOnboarded: boolean;
  setDonorOnboarded: (val: boolean) => void;
  beneficiaryOnboarded: boolean;
  setBeneficiaryOnboarded: (val: boolean) => void;
  donorPrefs: DonorPreferences;
  updateDonorPrefs: (updates: Partial<DonorPreferences>) => Promise<void>;
  activateGuestProfile: (
    username: string,
    options?: { fromOnboarding?: boolean; onboardingUpdates?: Partial<DonorPreferences> }
  ) => Promise<{ restored: boolean; userId: string; preferences?: Partial<DonorPreferences> }>;
  toggleBookmark: (causeId: string) => Promise<void>;
  isBookmarked: (causeId: string) => boolean;
  rechargeWallet: (amount: number, newBalance?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetDemoUser: (targetRole: UserRole) => void;
  signOut: () => Promise<void>;
}

const defaultBase = createDefaultDonorProfile();
const DEFAULT_DONOR_PREFS: DonorPreferences = {
  interests: defaultBase.interests,
  defaultSwipeAmount: defaultBase.default_swipe_amount,
  monthlyBudget: defaultBase.monthly_budget,
  impactRadius: defaultBase.impact_radius as any,
  isAnonymous: defaultBase.is_anonymous,
  displayName: "",
  location: "",
  bookmarkedCauseIds: defaultBase.bookmarked_cause_ids,
  totalDonated: defaultBase.total_donated,
  billsCleared: defaultBase.bills_cleared,
  streakDays: defaultBase.streak_days,
  walletBalance: defaultBase.wallet_balance,
  onboarded: defaultBase.onboarded,
  paymentPreference: defaultBase.payment_preference as any,
  paypalEmail: "",
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Clerk authentication state
  let clerkUser: any = null;
  let isClerkLoaded = false;
  let isClerkSignedIn = false;
  let clerkInstance: any = null;

  try {
    const clerkUserHook = useClerkUser();
    clerkUser = clerkUserHook.user;
    isClerkLoaded = clerkUserHook.isLoaded;
    isClerkSignedIn = Boolean(clerkUserHook.isSignedIn);
  } catch (e) {
    // Graceful fallback if ClerkProvider is unconfigured or in dummy mode
  }

  try {
    clerkInstance = useClerk();
  } catch (e) {
    // Graceful fallback
  }

  // Active user identification
  const [guestSessionId, setGuestSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let saved = localStorage.getItem("givi_guest_id");
      if (!saved) {
        saved = `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem("givi_guest_id", saved);
      }
      return saved;
    }
    return "guest-session";
  });

  const [demoPersona, setDemoPersona] = useState<DemoPersona>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("givi_demo_persona");
      if (saved === "judge_donor" || saved === "judge_beneficiary") return saved;
    }
    return null;
  });

  const userPrimaryEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isMaharshiAuth = Boolean(
    userPrimaryEmail === "maharshipandya006@gmail.com" ||
    userPrimaryEmail.startsWith("maharshipandya006@")
  );
  const isJudgeDonorAuth = Boolean(
    demoPersona === "judge_donor" ||
    userPrimaryEmail === "gividonor@personal.example.com" ||
    userPrimaryEmail.startsWith("gividonor@")
  );
  const isJudgeBeneficiaryAuth = Boolean(
    demoPersona === "judge_beneficiary" ||
    userPrimaryEmail === "relief.beneficiary@personal.example.com" ||
    userPrimaryEmail.startsWith("relief.beneficiary@") ||
    userPrimaryEmail === "givibeneficiary@business.example.com" ||
    userPrimaryEmail.startsWith("givibeneficiary@")
  );

  const activeUserId =
    isJudgeDonorAuth
      ? "judge-donor-session"
      : isJudgeBeneficiaryAuth
      ? "judge-beneficiary-session"
      : clerkUser?.id || guestSessionId;

  const activeUserEmail =
    isJudgeDonorAuth
      ? "gividonor@personal.example.com"
      : isJudgeBeneficiaryAuth
      ? "givibeneficiary@business.example.com"
      : clerkUser?.primaryEmailAddress?.emailAddress || (isMaharshiAuth ? "maharshipandya006@gmail.com" : "guest@givi.app");

  const activeUserName =
    isJudgeDonorAuth
      ? "Judge Donor"
      : isJudgeBeneficiaryAuth
      ? "Judge Beneficiary (Demo)"
      : clerkUser?.fullName || clerkUser?.firstName || (isMaharshiAuth ? "Maharshi Pandya" : "Kind Supporter");

  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const persona = localStorage.getItem("givi_demo_persona");
      if (persona === "judge_donor" || persona === "judge_beneficiary") return true;
      return localStorage.getItem("givi_demo_session") === "true";
    }
    return false;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      const persona = localStorage.getItem("givi_demo_persona");
      if (persona === "judge_beneficiary") return "beneficiary";
      if (persona === "judge_donor") return "donor";
      const savedRole = localStorage.getItem("givi_demo_role");
      if (savedRole === "beneficiary" || savedRole === "donor") return savedRole;
    }
    return isJudgeBeneficiaryAuth ? "beneficiary" : "donor";
  });

  const [donorOnboarded, setDonorOnboardedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("givi_donor_onboarded") === "true";
    }
    return false;
  });

  const [beneficiaryOnboarded, setBeneficiaryOnboardedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("givi_beneficiary_onboarded") === "true";
    }
    return false;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("givi_donor_onboarded") === "true" ||
        localStorage.getItem("givi_beneficiary_onboarded") === "true" ||
        localStorage.getItem("givi_demo_session") === "true"
      );
    }
    return false;
  });

  useEffect(() => {
    if (isClerkSignedIn) {
      setIsOnboarded(true);
      setDonorOnboardedState(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("givi_donor_onboarded", "true");
      }
    }
  }, [isClerkSignedIn]);

  const [donorPrefs, setDonorPrefs] = useState<DonorPreferences>(() => {
    const savedPersona = typeof window !== "undefined" ? localStorage.getItem("givi_demo_persona") : null;
    const isJudgeDonorInit = savedPersona === "judge_donor" || isJudgeDonorAuth;
    if (isJudgeDonorInit) {
      const savedBalance = typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_judge_donor_wallet") || "50") : 50;
      const savedBills = Math.max(
        typeof window !== "undefined" ? parseInt(localStorage.getItem("givi_judge_donor_bills") || "0", 10) : 0,
        typeof window !== "undefined" ? parseInt(localStorage.getItem("givi_bills_cleared") || "0", 10) : 0
      );
      const savedTotal = Math.max(
        typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_judge_donor_total") || "0") : 0,
        typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_total_donated") || "0") : 0
      );
      const savedJudgeName = typeof window !== "undefined"
        ? localStorage.getItem("givi_judge_donor_name") || localStorage.getItem("givi_display_name") || ""
        : "";
      return {
        ...DEFAULT_DONOR_PREFS,
        displayName: savedJudgeName && savedJudgeName !== "Kind Supporter" ? savedJudgeName : "Judge Donor",
        paypalEmail: "gividonor@personal.example.com",
        walletBalance: savedBalance > 0 ? savedBalance : 50,
        billsCleared: isNaN(savedBills) ? 0 : savedBills,
        totalDonated: isNaN(savedTotal) ? 0 : savedTotal,
      };
    }
    if (savedPersona === "judge_beneficiary" || isJudgeBeneficiaryAuth) {
      return {
        ...DEFAULT_DONOR_PREFS,
        displayName: "Judge Beneficiary (Demo)",
        paypalEmail: "givibeneficiary@business.example.com",
        walletBalance: 0,
        billsCleared: 0,
        totalDonated: 0,
      };
    }

    const savedName = typeof window !== "undefined" ? localStorage.getItem("givi_display_name") || "" : "";
    const savedBalance = typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_wallet_balance") || "0") : 0;
    const savedBills = typeof window !== "undefined" ? parseInt(localStorage.getItem("givi_bills_cleared") || "0", 10) : 0;
    const savedTotal = typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_total_donated") || "0") : 0;
    return {
      ...DEFAULT_DONOR_PREFS,
      displayName: savedName,
      walletBalance: savedBalance > 0 ? savedBalance : DEFAULT_DONOR_PREFS.walletBalance,
      billsCleared: Math.max(DEFAULT_DONOR_PREFS.billsCleared, isNaN(savedBills) ? 0 : savedBills),
      totalDonated: Math.max(DEFAULT_DONOR_PREFS.totalDonated, isNaN(savedTotal) ? 0 : savedTotal),
    };
  });
  const isSyncingRef = useRef(false);

  // Sync profile data from database/backend model to React state
  const applyProfileData = useCallback((profile: any) => {
    if (!profile) return;
    if (profile.role) setRoleState(profile.role === "beneficiary" ? "beneficiary" : "donor");
    const isAuthenticSession = Boolean(
      isClerkSignedIn || isDemoUser || demoPersona === "judge_donor" || demoPersona === "judge_beneficiary"
    );
    const onboardedFlag = Boolean(
      isClerkSignedIn ||
      (isAuthenticSession && (
        Boolean(profile.onboarded) ||
        (typeof window !== "undefined" && (localStorage.getItem("givi_donor_onboarded") === "true" || localStorage.getItem("givi_demo_session") === "true"))
      ))
    );
    setIsOnboarded(onboardedFlag);
    if (profile.role === "beneficiary") {
      setBeneficiaryOnboardedState(onboardedFlag);
    } else {
      setDonorOnboardedState(onboardedFlag);
    }
    setDonorPrefs((prev) => {
      if (demoPersona === "judge_donor" || isJudgeDonorAuth) {
        const judgeBal = typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_judge_donor_wallet") || "50") : 50;
        const judgeTotal = Math.max(
          typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_judge_donor_total") || "0") : 0,
          typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_total_donated") || "0") : 0,
          Number(profile.total_donated || 0)
        );
        const judgeBills = Math.max(
          typeof window !== "undefined" ? parseInt(localStorage.getItem("givi_judge_donor_bills") || "0", 10) : 0,
          typeof window !== "undefined" ? parseInt(localStorage.getItem("givi_bills_cleared") || "0", 10) : 0,
          Number(profile.bills_cleared || 0)
        );
        const judgeCustomName =
          (isCustomGuestUsername(profile.display_name) ? profile.display_name : "") ||
          (isCustomGuestUsername(prev.displayName) ? prev.displayName : "") ||
          (typeof window !== "undefined" && isCustomGuestUsername(localStorage.getItem("givi_judge_donor_name")) ? localStorage.getItem("givi_judge_donor_name")! : "") ||
          (typeof window !== "undefined" && isCustomGuestUsername(localStorage.getItem("givi_display_name")) ? localStorage.getItem("givi_display_name")! : "") ||
          "Judge Donor";

        return {
          ...prev,
          displayName: judgeCustomName,
          walletBalance: judgeBal > 0 ? judgeBal : 50,
          totalDonated: judgeTotal,
          billsCleared: judgeBills,
          paypalEmail: "gividonor@personal.example.com",
        };
      }
      if (demoPersona === "judge_beneficiary" || isJudgeBeneficiaryAuth) {
        return {
          ...prev,
          displayName: "Judge Beneficiary (Demo)",
          paypalEmail: "givibeneficiary@business.example.com",
        };
      }

      const incomingName = profile.display_name;
      const isGenericIncoming = !incomingName || incomingName === "Kind Supporter" || incomingName === "Applicant";
      const savedLocalName = typeof window !== "undefined" ? localStorage.getItem("givi_display_name") : "";

      const resolvedDisplayName =
        (!isGenericIncoming ? incomingName : "") ||
        (prev.displayName && prev.displayName !== "Kind Supporter" ? prev.displayName : "") ||
        savedLocalName ||
        (activeUserName && activeUserName !== "Kind Supporter" ? activeUserName : "") ||
        (activeUserEmail && activeUserEmail.includes("@") && !activeUserEmail.includes("guest") ? activeUserEmail.split("@")[0] : "") ||
        incomingName ||
        "Kind Supporter";

      if (resolvedDisplayName && resolvedDisplayName !== "Kind Supporter" && typeof window !== "undefined") {
        localStorage.setItem("givi_display_name", resolvedDisplayName);
      }

      const incomingBalance = profile.wallet_balance !== undefined ? Number(profile.wallet_balance) : undefined;
      const cachedBalance = typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_wallet_balance") || "0") : 0;
      const resolvedBalance =
        incomingBalance !== undefined && !isNaN(incomingBalance)
          ? Math.round(incomingBalance * 100) / 100
          : Math.max(0, Math.round(cachedBalance * 100) / 100);

      if (typeof window !== "undefined") {
        localStorage.setItem("givi_wallet_balance", resolvedBalance.toString());
        if (isJudgeDonorAuth) {
          localStorage.setItem("givi_judge_donor_wallet", resolvedBalance.toString());
        }
      }

      const cachedBills = typeof window !== "undefined" ? parseInt(localStorage.getItem("givi_bills_cleared") || "0", 10) : 0;
      const incomingBills = Number(profile.bills_cleared);
      const resolvedBills = Math.max(
        !isNaN(incomingBills) ? incomingBills : 0,
        prev.billsCleared || 0,
        isNaN(cachedBills) ? 0 : cachedBills
      );
      if (typeof window !== "undefined" && resolvedBills > 0) {
        localStorage.setItem("givi_bills_cleared", resolvedBills.toString());
      }

      const cachedTotal = typeof window !== "undefined" ? parseFloat(localStorage.getItem("givi_total_donated") || "0") : 0;
      const incomingTotal = Number(profile.total_donated);
      const resolvedTotal = Math.max(
        !isNaN(incomingTotal) ? incomingTotal : 0,
        prev.totalDonated || 0,
        isNaN(cachedTotal) ? 0 : cachedTotal
      );
      if (typeof window !== "undefined" && resolvedTotal > 0) {
        localStorage.setItem("givi_total_donated", resolvedTotal.toString());
      }

      return {
        ...prev,
        displayName: resolvedDisplayName,
        location: profile.location || prev.location || "",
        walletBalance: resolvedBalance,
        monthlyBudget: Number(profile.monthly_budget ?? prev.monthlyBudget),
        defaultSwipeAmount: Number(profile.default_swipe_amount ?? prev.defaultSwipeAmount),
        interests: Array.isArray(profile.interests) ? profile.interests : prev.interests,
        bookmarkedCauseIds: Array.isArray(profile.bookmarked_cause_ids) ? profile.bookmarked_cause_ids : prev.bookmarkedCauseIds,
        totalDonated: resolvedTotal,
        billsCleared: resolvedBills,
        streakDays: Number(profile.streak_days ?? prev.streakDays),
        isAnonymous: Boolean(profile.is_anonymous),
        impactRadius: profile.impact_radius || prev.impactRadius || "urgent",
        onboarded: onboardedFlag,
        paymentPreference: profile.payment_preference === "direct_paypal" ? "direct_paypal" : "wallet",
        paypalEmail: profile.paypal_email || prev.paypalEmail || "",
      };
    });
  }, [activeUserName, activeUserEmail, demoPersona, isClerkSignedIn, isDemoUser]);

  // Fetch live profile from backend for current role
  const refreshProfile = useCallback(async () => {
    try {
      const cachedBills = typeof window !== "undefined" ? localStorage.getItem("givi_bills_cleared") || "0" : "0";
      const cachedTotal = typeof window !== "undefined" ? localStorage.getItem("givi_total_donated") || "0" : "0";
      const cachedName = typeof window !== "undefined" ? localStorage.getItem("givi_display_name") || "" : "";
      const lookupParam =
        activeUserId.startsWith("guest-") && isCustomGuestUsername(cachedName)
          ? `&lookupName=${encodeURIComponent(cachedName)}`
          : "";
      const res = await fetch(
        `/api/profile?userId=${encodeURIComponent(activeUserId)}&role=${encodeURIComponent(role)}&fallbackBillsCleared=${encodeURIComponent(cachedBills)}&fallbackTotalDonated=${encodeURIComponent(cachedTotal)}${lookupParam}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.profile) {
          applyProfileData(data.profile);
        }
        if (typeof window !== "undefined" && Array.isArray(data?.recentTransactions) && data.recentTransactions.length > 0) {
          try {
            const raw = localStorage.getItem("givi_recent_transactions");
            const existing = raw ? JSON.parse(raw) : [];
            const seen = new Set<string>();
            const merged = [...data.recentTransactions, ...(Array.isArray(existing) ? existing : [])].filter((tx: any) => {
              if (!tx?.id || seen.has(tx.id)) return false;
              seen.add(tx.id);
              return true;
            });
            localStorage.setItem("givi_recent_transactions", JSON.stringify(merged.slice(0, 500)));
          } catch {}
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote profile:", e);
    }
  }, [activeUserId, role, applyProfileData]);

  // Load profile on user mount or change
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Supabase Real-Time Sync Subscription for active role table
  useEffect(() => {
    if (!isSupabaseConfigured || !activeUserId || activeUserId === "guest-session") return;

    const tableName = role === "beneficiary" ? "beneficiary_profiles" : "donor_profiles";
    try {
      const channel = supabase
        .channel(`profile-realtime-${tableName}-${activeUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: tableName,
            filter: `id=eq.${activeUserId}`,
          },
          (payload) => {
            if (payload.new && !isSyncingRef.current) {
              applyProfileData(payload.new);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn("Supabase Realtime subscription error:", err);
    }
  }, [activeUserId, role, applyProfileData]);

  // Push updates to API and persist to Supabase
  const persistUpdates = async (updates: Record<string, any>) => {
    isSyncingRef.current = true;
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          role,
          ...updates,
        }),
      });
    } catch (e) {
      console.warn("Failed to persist profile update:", e);
    } finally {
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 300);
    }
  };

  const setRole = (newRole: UserRole) => {
    // Strict Donor Lock for maharshipandya006@gmail.com
    if (isMaharshiAuth && !demoPersona && newRole === "beneficiary") {
      console.warn("Blocked role change: maharshipandya006@gmail.com is strictly locked to donor role.");
      return;
    }
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("givi_demo_role", newRole);
    }
    persistUpdates({ role: newRole });
  };

  const setDonorOnboarded = (val: boolean) => {
    setDonorOnboardedState(val);
    setIsOnboarded(val);
    if (typeof window !== "undefined") {
      if (val) {
        localStorage.setItem("givi_donor_onboarded", "true");
        localStorage.setItem("givi_demo_session", "true");
      } else {
        localStorage.removeItem("givi_donor_onboarded");
      }
    }
    persistUpdates({ onboarded: val, role: "donor" });
  };

  const setBeneficiaryOnboarded = (val: boolean) => {
    setBeneficiaryOnboardedState(val);
    setIsOnboarded(val);
    if (typeof window !== "undefined") {
      if (val) {
        localStorage.setItem("givi_beneficiary_onboarded", "true");
        localStorage.setItem("givi_demo_session", "true");
      } else {
        localStorage.removeItem("givi_beneficiary_onboarded");
      }
    }
    persistUpdates({ onboarded: val, role: "beneficiary" });
  };

  const enableDemoSession = (targetRole: UserRole = "donor") => {
    setIsDemoUser(true);
    setRoleState(targetRole);
    setIsOnboarded(true);
    if (targetRole === "donor") {
      setDonorOnboardedState(true);
    } else {
      setBeneficiaryOnboardedState(true);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("givi_demo_session", "true");
      localStorage.setItem("givi_demo_role", targetRole);
      if (targetRole === "donor") {
        localStorage.setItem("givi_donor_onboarded", "true");
      } else {
        localStorage.setItem("givi_beneficiary_onboarded", "true");
      }
    }
    persistUpdates({ onboarded: true, role: targetRole });
  };

  const switchJudgePersona = (target: DemoPersona) => {
    setDemoPersona(target);
    if (typeof window !== "undefined") {
      if (target) {
        localStorage.setItem("givi_demo_persona", target);
      } else {
        localStorage.removeItem("givi_demo_persona");
      }
    }
    if (target === "judge_donor") {
      setRoleState("donor");
      setIsDemoUser(true);
      setIsOnboarded(true);
      setDonorOnboardedState(true);
      setBeneficiaryOnboardedState(false);
      const cachedJudgeBal = typeof window !== "undefined"
        ? parseFloat(localStorage.getItem("givi_judge_donor_wallet") || "50")
        : 50;
      const cachedJudgeTotal = typeof window !== "undefined"
        ? parseFloat(localStorage.getItem("givi_judge_donor_total") || "0")
        : 0;
      const cachedJudgeBills = typeof window !== "undefined"
        ? parseInt(localStorage.getItem("givi_judge_donor_bills") || "0", 10)
        : 0;
      const savedJudgeName = typeof window !== "undefined"
        ? localStorage.getItem("givi_judge_donor_name") || localStorage.getItem("givi_display_name") || ""
        : "";
      const effectiveJudgeName = isCustomGuestUsername(savedJudgeName) ? savedJudgeName : "Judge Donor";
      if (typeof window !== "undefined") {
        localStorage.setItem("givi_display_name", effectiveJudgeName);
        localStorage.setItem("givi_demo_role", "donor");
        localStorage.setItem("givi_judge_donor_wallet", cachedJudgeBal.toString());
      }
      setDonorPrefs((prev) => ({
        ...prev,
        displayName: effectiveJudgeName,
        walletBalance: cachedJudgeBal,
        totalDonated: cachedJudgeTotal,
        billsCleared: cachedJudgeBills,
        paypalEmail: "gividonor@personal.example.com",
      }));
    } else if (target === "judge_beneficiary") {
      setRoleState("beneficiary");
      setIsDemoUser(true);
      setIsOnboarded(true);
      setDonorOnboardedState(false);
      setBeneficiaryOnboardedState(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("givi_display_name", "Judge Beneficiary (Demo)");
        localStorage.setItem("givi_demo_role", "beneficiary");
      }
      setDonorPrefs((prev) => ({
        ...prev,
        displayName: "Judge Beneficiary (Demo)",
        paypalEmail: "givibeneficiary@business.example.com",
      }));
    } else {
      // Return to authenticated personal account (e.g. Maharshi)
      setIsDemoUser(false);
      if (isMaharshiAuth) {
        setRoleState("donor");
        setIsOnboarded(true);
        setDonorOnboardedState(true);
        setBeneficiaryOnboardedState(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("givi_demo_role", "donor");
          localStorage.setItem("givi_display_name", "Maharshi Pandya");
        }
      }
    }
    refreshProfile();
  };

  const updateDonorPrefs = async (updates: Partial<DonorPreferences>) => {
    setDonorPrefs((prev) => ({ ...prev, ...updates }));

    const isJudgeDonor = demoPersona === "judge_donor" || isJudgeDonorAuth;
    const walletKey = isJudgeDonor ? "givi_judge_donor_wallet" : "givi_wallet_balance";
    const totalKey = isJudgeDonor ? "givi_judge_donor_total" : "givi_total_donated";
    const billsKey = isJudgeDonor ? "givi_judge_donor_bills" : "givi_bills_cleared";
    const nameKey = isJudgeDonor ? "givi_judge_donor_name" : "givi_display_name";

    const payload: Record<string, any> = {};
    if (updates.displayName !== undefined) {
      payload.display_name = updates.displayName;
      if (typeof window !== "undefined") {
        localStorage.setItem(nameKey, updates.displayName);
        if (isJudgeDonor) localStorage.setItem("givi_display_name", updates.displayName);
      }
    }
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.walletBalance !== undefined) {
      const rounded = Math.round(updates.walletBalance * 100) / 100;
      payload.wallet_balance = rounded;
      if (typeof window !== "undefined") {
        localStorage.setItem(walletKey, rounded.toString());
        if (isJudgeDonor) localStorage.setItem("givi_wallet_balance", rounded.toString());
      }
    }
    if (updates.monthlyBudget !== undefined) payload.monthly_budget = updates.monthlyBudget;
    if (updates.defaultSwipeAmount !== undefined) payload.default_swipe_amount = updates.defaultSwipeAmount;
    if (updates.interests !== undefined) payload.interests = updates.interests;
    if (updates.bookmarkedCauseIds !== undefined) payload.bookmarked_cause_ids = updates.bookmarkedCauseIds;
    if (updates.totalDonated !== undefined) {
      const val = Math.max(0, Math.round(updates.totalDonated * 100) / 100);
      payload.total_donated = val;
      if (typeof window !== "undefined") {
        localStorage.setItem(totalKey, val.toString());
        if (isJudgeDonor) localStorage.setItem("givi_total_donated", val.toString());
      }
    }
    if (updates.billsCleared !== undefined) {
      const val = Math.max(0, updates.billsCleared);
      payload.bills_cleared = val;
      if (typeof window !== "undefined") {
        localStorage.setItem(billsKey, val.toString());
        if (isJudgeDonor) localStorage.setItem("givi_bills_cleared", val.toString());
      }
    }
    if (updates.isAnonymous !== undefined) payload.is_anonymous = updates.isAnonymous;
    if (updates.impactRadius !== undefined) payload.impact_radius = updates.impactRadius;
    if (updates.onboarded !== undefined) {
      payload.onboarded = updates.onboarded;
      setIsOnboarded(updates.onboarded);
      setDonorOnboardedState(updates.onboarded);
      if (typeof window !== "undefined") {
        if (updates.onboarded) {
          localStorage.setItem("givi_donor_onboarded", "true");
          localStorage.setItem("givi_demo_session", "true");
        } else {
          localStorage.removeItem("givi_donor_onboarded");
        }
      }
    }
    if (updates.paymentPreference !== undefined) payload.payment_preference = updates.paymentPreference;
    if (updates.paypalEmail !== undefined) payload.paypal_email = updates.paypalEmail;

    if (typeof window !== "undefined" && activeUserId.startsWith("guest-u-")) {
      try {
        const merged = { ...donorPrefs, ...updates };
        const rawTx = localStorage.getItem("givi_recent_transactions");
        localStorage.setItem(
          `guest_archive:${activeUserId}`,
          JSON.stringify({ prefs: merged, transactions: rawTx ? JSON.parse(rawTx) : [] })
        );
      } catch {}
    }

    await persistUpdates(payload);
  };

  const activateGuestProfile = async (
    username: string,
    options: { fromOnboarding?: boolean; onboardingUpdates?: Partial<DonorPreferences> } = {}
  ): Promise<{ restored: boolean; userId: string; preferences?: Partial<DonorPreferences> }> => {
    const trimmed = username.trim();
    const shouldRestoreFresh = Boolean(
      options.fromOnboarding ||
      (!activeUserId.startsWith("user_") &&
        !isJudgeDonorAuth &&
        donorPrefs.totalDonated === 0 &&
        donorPrefs.walletBalance === 0)
    );

    // Mid-session rename with existing active balance/donations: keep active session & stats
    if (!shouldRestoreFresh || !isCustomGuestUsername(trimmed) || activeUserId.startsWith("user_") || isJudgeDonorAuth) {
      await updateDonorPrefs({
        ...(options.onboardingUpdates || {}),
        displayName: trimmed || donorPrefs.displayName,
      });
      return { restored: false, userId: activeUserId };
    }

    const canonicalId = guestIdForUsername(trimmed);
    setGuestSessionId(canonicalId);
    if (typeof window !== "undefined") {
      localStorage.setItem("givi_guest_id", canonicalId);
      localStorage.setItem("givi_display_name", trimmed);
      localStorage.setItem("givi_demo_session", "true");
      localStorage.setItem("givi_donor_onboarded", "true");
    }

    const patchCanonical = async (fields: Record<string, any>) => {
      try {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: canonicalId, role: "donor", ...fields }),
        });
      } catch {}
    };

    try {
      const res = await fetch(
        `/api/profile?userId=${encodeURIComponent(canonicalId)}&role=donor&lookupName=${encodeURIComponent(trimmed)}`
      );
      if (res.ok) {
        const data = await res.json();
        const remote = data?.profile;
        const remoteTxs = Array.isArray(data?.recentTransactions) ? data.recentTransactions : [];
        const hasStoredAccount = Boolean(
          data?.restored ||
          Number(remote?.total_donated || 0) > 0 ||
          Number(remote?.wallet_balance || 0) > 0 ||
          Number(remote?.bills_cleared || 0) > 0 ||
          remoteTxs.length > 0
        );

        if (hasStoredAccount && remote) {
          const restoredWallet = Number(remote.wallet_balance || 0);
          const restoredTotal = Number(remote.total_donated || 0);
          const restoredBills = Number(remote.bills_cleared || 0);
          const restoredStreak = Number(remote.streak_days || 0);
          const restoredLocation = remote.location || options.onboardingUpdates?.location || "";

          if (typeof window !== "undefined") {
            localStorage.setItem("givi_wallet_balance", restoredWallet.toString());
            localStorage.setItem("givi_total_donated", restoredTotal.toString());
            localStorage.setItem("givi_bills_cleared", restoredBills.toString());
            if (remoteTxs.length > 0) {
              localStorage.setItem("givi_recent_transactions", JSON.stringify(remoteTxs));
            }
          }

          setIsDemoUser(true);
          setIsOnboarded(true);
          setDonorOnboardedState(true);
          const updatedInterests =
            Array.isArray(options.onboardingUpdates?.interests) && options.onboardingUpdates.interests.length > 0
              ? options.onboardingUpdates.interests
              : (Array.isArray(remote.interests) && remote.interests.length > 0
                ? remote.interests
                : ["utilities", "medical"]);

          const updatedBudget =
            typeof options.onboardingUpdates?.monthlyBudget === "number"
              ? options.onboardingUpdates.monthlyBudget
              : Number(remote.monthly_budget ?? 50);

          const updatedSwipeAmount =
            typeof options.onboardingUpdates?.defaultSwipeAmount === "number"
              ? options.onboardingUpdates.defaultSwipeAmount
              : Number(remote.default_swipe_amount ?? 5);

          const updatedLocation =
            options.onboardingUpdates?.location !== undefined && options.onboardingUpdates.location !== ""
              ? options.onboardingUpdates.location
              : (remote.location || "");

          const updatedImpactRadius =
            options.onboardingUpdates?.impactRadius || remote.impact_radius || "urgent";

          const updatedIsAnonymous =
            options.onboardingUpdates?.isAnonymous !== undefined
              ? options.onboardingUpdates.isAnonymous
              : Boolean(remote.is_anonymous);

          const restoredPrefs: Partial<DonorPreferences> = {
            displayName: trimmed,
            location: updatedLocation,
            walletBalance: restoredWallet,
            totalDonated: restoredTotal,
            billsCleared: restoredBills,
            streakDays: restoredStreak,
            monthlyBudget: updatedBudget,
            defaultSwipeAmount: updatedSwipeAmount,
            interests: updatedInterests,
            bookmarkedCauseIds: Array.isArray(remote.bookmarked_cause_ids) ? remote.bookmarked_cause_ids : [],
            impactRadius: updatedImpactRadius,
            isAnonymous: updatedIsAnonymous,
            onboarded: true,
          };

          setDonorPrefs((prev) => ({
            ...prev,
            ...restoredPrefs,
          }));

          await patchCanonical({
            display_name: trimmed,
            onboarded: true,
            interests: updatedInterests,
            monthly_budget: updatedBudget,
            default_swipe_amount: updatedSwipeAmount,
            location: updatedLocation,
            impact_radius: updatedImpactRadius,
            is_anonymous: updatedIsAnonymous,
          });
          return { restored: true, userId: canonicalId, preferences: restoredPrefs };
        }
      }
    } catch {}

    // Offline / restarted-server fallback archive lookup for exact case-sensitive username
    if (typeof window !== "undefined") {
      try {
        const rawArchive = localStorage.getItem(`guest_archive:${canonicalId}`);
        if (rawArchive) {
          const parsed = JSON.parse(rawArchive);
          const archivedPrefs = parsed?.prefs;
          const archivedTxs = Array.isArray(parsed?.transactions) ? parsed.transactions : [];
          if (
            archivedPrefs &&
            (archivedPrefs.totalDonated > 0 || archivedPrefs.walletBalance > 0 || archivedTxs.length > 0)
          ) {
            localStorage.setItem("givi_wallet_balance", String(archivedPrefs.walletBalance || 0));
            localStorage.setItem("givi_total_donated", String(archivedPrefs.totalDonated || 0));
            localStorage.setItem("givi_bills_cleared", String(archivedPrefs.billsCleared || 0));
            if (archivedTxs.length > 0) {
              localStorage.setItem("givi_recent_transactions", JSON.stringify(archivedTxs));
            }
            setIsDemoUser(true);
            setIsOnboarded(true);
            setDonorOnboardedState(true);
            const mergedArchived: Partial<DonorPreferences> = {
              ...DEFAULT_DONOR_PREFS,
              ...archivedPrefs,
              ...(options.onboardingUpdates || {}),
              displayName: trimmed,
              walletBalance: Math.max(Number(archivedPrefs.walletBalance || 0), donorPrefs.walletBalance || 0),
              onboarded: true,
            };
            setDonorPrefs((prev) => ({ ...prev, ...mergedArchived }));
            await patchCanonical({ display_name: trimmed, onboarded: true });
            return { restored: true, userId: canonicalId, preferences: mergedArchived };
          }
        }
      } catch {}
    }

    // Brand-new guest username: save preferences cleanly under canonical guest ID
    const freshUpdates = {
      ...(options.onboardingUpdates || {}),
      displayName: trimmed,
      onboarded: true,
    };
    setIsDemoUser(true);
    setIsOnboarded(true);
    setDonorOnboardedState(true);
    setDonorPrefs((prev) => ({ ...prev, ...freshUpdates }));
    await patchCanonical({
      display_name: trimmed,
      onboarded: true,
      ...(freshUpdates.interests ? { interests: freshUpdates.interests } : {}),
      ...(freshUpdates.defaultSwipeAmount !== undefined ? { default_swipe_amount: freshUpdates.defaultSwipeAmount } : {}),
      ...(freshUpdates.monthlyBudget !== undefined ? { monthly_budget: freshUpdates.monthlyBudget } : {}),
      ...(freshUpdates.impactRadius ? { impact_radius: freshUpdates.impactRadius } : {}),
      ...(freshUpdates.location !== undefined ? { location: freshUpdates.location } : {}),
      ...(freshUpdates.isAnonymous !== undefined ? { is_anonymous: freshUpdates.isAnonymous } : {}),
    });
    return { restored: false, userId: canonicalId };
  };

  const toggleBookmark = async (causeId: string) => {
    const current = donorPrefs.bookmarkedCauseIds;
    const exists = current.includes(causeId);
    const nextBookmarks = exists
      ? current.filter((id) => id !== causeId)
      : [...current, causeId];

    setDonorPrefs((prev) => ({ ...prev, bookmarkedCauseIds: nextBookmarks }));
    await persistUpdates({ bookmarked_cause_ids: nextBookmarks });
  };

  const isBookmarked = (causeId: string) => {
    return donorPrefs.bookmarkedCauseIds.includes(causeId);
  };

  const rechargeWallet = async (amount: number, newBalance?: number) => {
    const nextBalance =
      typeof newBalance === "number"
        ? Math.round(newBalance * 100) / 100
        : Math.round((donorPrefs.walletBalance + amount) * 100) / 100;
    setDonorPrefs((prev) => {
      const updated = { ...prev, walletBalance: nextBalance };
      if (typeof window !== "undefined" && activeUserId.startsWith("guest-u-")) {
        try {
          const rawTx = localStorage.getItem("givi_recent_transactions");
          localStorage.setItem(
            `guest_archive:${activeUserId}`,
            JSON.stringify({ prefs: updated, transactions: rawTx ? JSON.parse(rawTx) : [] })
          );
        } catch {}
      }
      return updated;
    });
    if (typeof window !== "undefined") {
      const isJudge = demoPersona === "judge_donor" || isJudgeDonorAuth;
      localStorage.setItem(isJudge ? "givi_judge_donor_wallet" : "givi_wallet_balance", nextBalance.toString());
      if (isJudge) {
        localStorage.setItem("givi_wallet_balance", nextBalance.toString());
      }
    }
  };

  const switchRole = (targetRole: UserRole) => {
    setRole(targetRole);
    refreshProfile();
  };

  const resetDemoUser = (targetRole: UserRole) => {
    setIsDemoUser(false);
    setIsOnboarded(false);
    setDonorOnboardedState(false);
    setBeneficiaryOnboardedState(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("givi_demo_session");
      localStorage.removeItem("givi_demo_role");
      localStorage.removeItem("givi_donor_onboarded");
      localStorage.removeItem("givi_beneficiary_onboarded");
    }
    switchRole(targetRole);
  };

  const signOut = useCallback(async () => {
    setDemoPersona(null);
    setIsDemoUser(false);
    setIsOnboarded(false);
    setDonorOnboardedState(false);
    setBeneficiaryOnboardedState(false);
    setDonorPrefs(DEFAULT_DONOR_PREFS);

    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("givi_") || key.startsWith("clerk_"))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (err) {
        console.warn("Storage wipe error:", err);
      }

      // Expire auth cookies across root and domain
      try {
        const cookieNames = ["__session", "__client_uat", "__clerk_handshake", "__clerk_db_jwt"];
        const hostParts = window.location.hostname.split(".");
        for (const name of cookieNames) {
          document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          for (let i = 0; i < hostParts.length - 1; i++) {
            const domain = hostParts.slice(i).join(".");
            document.cookie = `${name}=; Path=/; Domain=.${domain}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          }
        }
      } catch (err) {
        console.warn("Cookie expire warning:", err);
      }
    }

    try {
      if (clerkInstance && typeof clerkInstance.signOut === "function") {
        await Promise.race([
          clerkInstance.signOut(),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
    } catch (err) {
      console.warn("Clerk signOut error:", err);
    }

    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, [clerkInstance]);

  const isAuthReady =
    isClerkLoaded || isDemoUser || Boolean(demoPersona);

  const isUserAuthenticated = Boolean(
    isClerkSignedIn || isDemoUser || demoPersona === "judge_donor" || demoPersona === "judge_beneficiary"
  );

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        userId: activeUserId,
        userEmail: activeUserEmail,
        userName: donorPrefs.displayName || (activeUserName !== "Kind Supporter" ? activeUserName : "") || "Kind Supporter",
        isSignedIn: isUserAuthenticated,
        isClerkSignedIn,
        isLoaded: isAuthReady,
        isDemoUser,
        isJudgeDonor: isJudgeDonorAuth,
        isJudgeBeneficiary: isJudgeBeneficiaryAuth,
        demoPersona,
        switchJudgePersona,
        enableDemoSession,
        isOnboarded,
        donorOnboarded,
        setDonorOnboarded,
        beneficiaryOnboarded,
        setBeneficiaryOnboarded,
        donorPrefs,
        updateDonorPrefs,
        activateGuestProfile,
        toggleBookmark,
        isBookmarked,
        rechargeWallet,
        refreshProfile,
        resetDemoUser,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
