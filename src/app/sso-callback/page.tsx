"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthenticateWithRedirectCallback, useUser as useClerkUser } from "@clerk/nextjs";
import { useUser } from "@/lib/user-context";
import { ArrowRight } from "lucide-react";

export default function SSOCallbackPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useClerkUser();
  const { role, isOnboarded } = useUser();
  const [showManualLink, setShowManualLink] = useState(false);

  const targetDashboard = isOnboarded ? (role === "beneficiary" ? "/my-causes" : "/feed") : "/onboarding";

  // Reactive instant redirect once Clerk session is confirmed
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(targetDashboard);
    }
  }, [isLoaded, isSignedIn, targetDashboard, router]);

  // Safety fallback: if router has not transitioned after 2.5s, auto-push and show manual cue
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowManualLink(true);
      router.replace(targetDashboard);
    }, 2500);

    return () => clearTimeout(timer);
  }, [targetDashboard, router]);

  return (
    <div className="min-h-[80vh] bg-background flex flex-col items-center justify-center p-6 text-center selection:bg-emerald-500/30">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full motion-safe:animate-spin motion-reduce:animate-none mb-4" />
      <h2 className="text-sm font-semibold text-ink mb-1">Finalizing secure authentication...</h2>
      <p className="text-xs text-ink-muted mb-4 max-w-xs">
        Syncing your profile with verified payment rails.
      </p>

      {/* Clerk headless redirect callback processor */}
      <div className="hidden">
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl={targetDashboard}
          signUpForceRedirectUrl={targetDashboard}
          signInFallbackRedirectUrl={targetDashboard}
          signUpFallbackRedirectUrl={targetDashboard}
          continueSignUpUrl="/onboarding"
        />
      </div>

      {showManualLink && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Link
            href={targetDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="text-[11px] text-ink-muted">Click above if redirect takes more than a few seconds.</span>
        </div>
      )}
    </div>
  );
}
