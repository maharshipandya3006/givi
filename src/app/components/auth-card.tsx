"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Receipt, ArrowRight, ShieldCheck, Mail, Lock, User, AlertCircle, KeyRound, Sparkles } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { useSignIn, useSignUp } from "@clerk/nextjs";

export function AuthCard() {
  const router = useRouter();
  const { setRole, refreshProfile, enableDemoSession } = useUser();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"donor" | "beneficiary">("donor");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Clerk headless authentication hooks
  let clerkSignIn: any = null;
  let clerkSignUp: any = null;

  try {
    clerkSignIn = useSignIn();
  } catch (e) { }

  try {
    clerkSignUp = useSignUp();
  } catch (e) { }

  const isClerkAvailable = Boolean(
    clerkSignIn?.isLoaded && clerkSignUp?.isLoaded && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("example.com")
  );

  useEffect(() => {
    // Check URL query parameters on mount
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const roleParam = params.get("role");
      if (tabParam === "signin" || tabParam === "signup") {
        setTab(tabParam);
      }
      if (roleParam === "donor" || roleParam === "beneficiary") {
        setSelectedRole(roleParam);
      }
    }

    // Listen for tab and role switch events
    const handleSetTab = (e: Event) => {
      const customEvent = e as CustomEvent<
        "signin" | "signup" | { tab?: "signin" | "signup"; role?: "donor" | "beneficiary" }
      >;
      if (typeof customEvent.detail === "string") {
        if (customEvent.detail === "signin" || customEvent.detail === "signup") {
          setTab(customEvent.detail);
        }
      } else if (customEvent.detail && typeof customEvent.detail === "object") {
        if (customEvent.detail.tab) setTab(customEvent.detail.tab);
        if (customEvent.detail.role) setSelectedRole(customEvent.detail.role);
      }
    };
    window.addEventListener("set-auth-tab", handleSetTab);
    return () => window.removeEventListener("set-auth-tab", handleSetTab);
  }, []);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthError(null);

    if (isClerkAvailable) {
      try {
        // Unified OAuth: use continueSignUp so both returning and new Google accounts authenticate seamlessly
        if (clerkSignIn?.signIn) {
          await clerkSignIn.signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sso-callback",
            redirectUrlComplete: selectedRole === "beneficiary" ? "/my-causes" : "/feed",
            continueSignUp: true,
          });
        } else if (clerkSignUp?.signUp) {
          await clerkSignUp.signUp.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/sso-callback",
            redirectUrlComplete: selectedRole === "beneficiary" ? "/my-causes" : "/feed",
            continueSignIn: true,
          });
        }
      } catch (err: any) {
        console.error("Google OAuth error:", err);
        const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message;
        setAuthError(clerkMsg || "Failed to initialize Google authentication.");
        setIsLoading(false);
      }
    } else {
      setAuthError("Authentication service is connecting. Please refresh and try again.");
      setIsLoading(false);
    }
  };

  const handleFinishAuth = async (userId: string, userEmail: string, userName: string) => {
    setRole(selectedRole);
    try {
      const patchBody: Record<string, any> = {
        userId,
        email: userEmail,
        role: selectedRole,
      };

      // Only patch display_name if a real name was entered or is saved in local session
      const savedName = typeof window !== "undefined" ? localStorage.getItem("givi_display_name") : "";
      const effectiveName = userName.trim() || savedName || "";
      if (effectiveName && effectiveName !== "Kind Supporter") {
        patchBody.display_name = effectiveName;
        if (typeof window !== "undefined") {
          localStorage.setItem("givi_display_name", effectiveName);
        }
      }

      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      await refreshProfile();
    } catch (e) {
      console.warn("Could not sync profile post-auth:", e);
    }

    if (selectedRole === "beneficiary") {
      router.push("/my-causes");
    } else {
      router.push("/feed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    // 1. Real Clerk Authentication Flow
    if (isClerkAvailable) {
      try {
        if (tab === "signin") {
          const result = await clerkSignIn.signIn.create({
            identifier: email,
            password,
          });

          if (result.status === "complete") {
            await clerkSignIn.setActive({ session: result.createdSessionId });
            await handleFinishAuth(result.createdUserId || "clerk-user", email, fullName);
            return;
          } else {
            setAuthError("Additional verification required by your Clerk configuration.");
          }
        } else {
          // Sign Up
          const result = await clerkSignUp.signUp.create({
            emailAddress: email,
            password,
            firstName: fullName.split(" ")[0] || fullName,
            lastName: fullName.split(" ").slice(1).join(" ") || "",
          });

          if (result.status === "complete") {
            await clerkSignUp.setActive({ session: result.createdSessionId });
            await handleFinishAuth(result.createdUserId || "clerk-user", email, fullName);
            return;
          } else if (result.status === "missing_requirements") {
            // Need email verification code
            await clerkSignUp.signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.error("Clerk auth error:", err);
        const clerkMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message;
        setAuthError(clerkMsg || "Authentication failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }
    }

    // 2. Dual-Mode Fallback Flow (when Clerk keys are in setup/development)
    await handleFinishAuth(`dev-${Date.now()}`, email, fullName);
    setIsLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClerkAvailable || !clerkSignUp?.signUp) return;
    setIsLoading(true);
    setAuthError(null);

    try {
      const completeSignUp = await clerkSignUp.signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (completeSignUp.status === "complete") {
        await clerkSignUp.setActive({ session: completeSignUp.createdSessionId });
        await handleFinishAuth(completeSignUp.createdUserId || "clerk-user", email, fullName);
      } else {
        setAuthError("Verification incomplete. Please check the code and try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message;
      setAuthError(msg || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-surface/65 backdrop-blur-lg border border-border/75 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Subtle top dollar-green glow line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#166534]/50 to-transparent" />

      {/* Tab Header: Sign In vs Sign Up */}
      <div className="flex items-center p-1 rounded-2xl bg-background/45 backdrop-blur-sm border border-border-subtle/80 mb-5">
        <button
          type="button"
          onClick={() => {
            setTab("signup");
            setPendingVerification(false);
            setAuthError(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${tab === "signup"
            ? "bg-[#166534] text-white"
            : "text-ink-muted hover:text-ink"
            }`}
        >
          Create account
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("signin");
            setPendingVerification(false);
            setAuthError(null);
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${tab === "signin"
            ? "bg-[#166534] text-white"
            : "text-ink-muted hover:text-ink"
            }`}
        >
          Sign in
        </button>
      </div>

      {/* Role Picker (Sign Up): Donor vs Beneficiary */}
      {tab === "signup" && (
        <div className="mb-4">
          <label className="block text-xs text-ink-dim mb-1.5 font-medium">I want to</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole("donor")}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer ${selectedRole === "donor"
                ? "bg-[#166534]/10 border-[#166534] text-[#166534] font-semibold"
                : "bg-background/45 backdrop-blur-xs border-border/70 text-ink-muted hover:text-ink"
                }`}
            >
              Help pay bills
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("beneficiary")}
              className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer ${selectedRole === "beneficiary"
                ? "bg-[#166534]/10 border-[#166534] text-[#166534] font-semibold"
                : "bg-background/40 backdrop-blur-xs border-border/70 text-ink-muted hover:text-ink"
                }`}
            >
              Request bill relief
            </button>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {authError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{authError}</span>
        </div>
      )}

      {/* Verification Step (if required by Clerk email code) */}
      {pendingVerification ? (
        <form onSubmit={handleVerifyCode} className="space-y-3.5">
          <div>
            <label className="block text-xs text-ink-dim mb-1 font-medium">
              Enter verification code sent to {email}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/40 backdrop-blur-xs border border-border/70 text-ink text-xs focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] focus:bg-background/70 transition-colors placeholder:text-ink-muted/70"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform motion-safe:transition-transform motion-reduce:transition-none active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer"
          >
            {isLoading ? <span>Verifying...</span> : <span>Verify & Continue</span>}
          </button>
        </form>
      ) : (
        /* Credentials Form */
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <div>
              <label className="block text-xs text-ink-dim mb-1 font-medium">Full name</label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/40 backdrop-blur-xs border border-border/70 text-ink text-xs focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] focus:bg-background/70 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-ink-dim mb-1 font-medium">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/40 backdrop-blur-xs border border-border/70 text-ink text-xs focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] focus:bg-background/70 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink-dim mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/40 backdrop-blur-xs border border-border/70 text-ink text-xs focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534] focus:bg-background/70 transition-colors"
              />
            </div>
          </div>

          {/* Divider: or continue with Google */}
          <div className="flex items-center gap-2 pt-1 pb-0.5">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-[10px] text-ink-muted">or continue with Google</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          {/* 1-Tap Google Sign-In with official SVG logo */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-elevated/60 hover:bg-surface-elevated/85 backdrop-blur-sm border border-border/70 text-ink font-semibold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-transform motion-safe:transition-transform motion-reduce:transition-none active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Primary Action Button: Get started / Sign in (under Continue with Google) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-[#166534] hover:bg-[#14532d] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform motion-safe:transition-transform motion-reduce:transition-none active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{tab === "signup" ? "Get started" : "Sign in"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Hackathon Judge Demo Walkthrough Fast-Track */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                enableDemoSession(selectedRole);
                router.push(selectedRole === "donor" ? "/onboarding/donor" : "/onboarding/beneficiary");
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#166534]/10 hover:bg-[#166534]/20 border border-[#166534]/30 text-[#166534] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Judge Demo (Start Full {selectedRole === "donor" ? "Donor" : "Receiver"} Onboarding)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Safety Micro-line */}
      <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between text-[10px] text-ink-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
          <span>Clerk secure authentication</span>
        </div>
        <span className="font-mono text-[#166534] font-medium">100% direct payouts</span>
      </div>
    </div>
  );
}
