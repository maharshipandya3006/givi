"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  ShieldCheck,
  Trophy,
  Sparkles,
  User,
  Compass,
  ArrowRight,
  LogOut,
  Receipt,
  PlusCircle,
} from "lucide-react";
import { useUser } from "@/lib/user-context";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isSignedIn, userEmail, isOnboarded, signOut: userSignOut } = useUser();

  const handleSignOut = async () => {
    try {
      if (userSignOut) {
        await userSignOut();
      }
    } catch (e) {
      console.warn("Sign-out warning:", e);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

  const isActive = (path: string) => pathname === path;
  const isLandingPage = pathname === "/";
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isPaypalSuccessPage = pathname === "/paypal-success" || pathname.startsWith("/paypal-success");
  const showInAppNav = !isLandingPage && !isOnboardingPage && !isPaypalSuccessPage && isOnboarded;

  const handleAuthAction = (mode: "signin" | "signup") => {
    if (isLandingPage) {
      const el = document.getElementById("action-stage");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("set-auth-tab", { detail: mode }));
      }
    } else {
      router.push(`/?tab=${mode}#action-stage`);
    }
  };

  return (
    <header className="sticky top-2 sm:top-2.5 z-40 w-full px-3 sm:px-6 pointer-events-none pb-1.5 sm:pb-2">
      <div className="relative max-w-6xl mx-auto h-14 sm:h-16 px-3.5 sm:px-5 rounded-full bg-surface border border-border shadow-xs flex items-center justify-between pointer-events-auto transition-colors">
        {/* Left: Brand Mark */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-emerald-500 via-[#166534] to-emerald-700 flex items-center justify-center text-white shadow-emerald-sm group-hover:scale-105 transition-transform duration-200 motion-safe:transition-transform motion-reduce:transition-none">
            <span className="font-black text-sm tracking-tighter">g.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base sm:text-lg tracking-tight text-ink group-hover:text-[#166534] transition-colors">
              givi
            </span>
            <span className="w-2 h-2 rounded-full bg-[#166534] shadow-emerald-sm motion-safe:animate-pulse" />
          </div>
        </Link>

        {/* Center: Navigation Pills (Role-Aware for Donor vs Beneficiary) */}
        {showInAppNav && (
          <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-surface-elevated p-1 rounded-full border border-border/80 shadow-xs">
            {role === "beneficiary" ? (
              <>
                <Link
                  href="/my-causes"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/my-causes")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>My Requests</span>
                </Link>

                <Link
                  href="/create-cause"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/create-cause")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Request Relief</span>
                </Link>

                <Link
                  href="/explore"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/explore")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore</span>
                </Link>

                <Link
                  href="/profile"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/profile")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/profile")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </Link>

                <Link
                  href="/feed"
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/feed")
                      ? "bg-[#166534] text-white shadow-xs"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isActive("/feed") ? "fill-current text-rose-300" : "text-ink/70"}`} />
                  <span>Swipe</span>
                </Link>

                <Link
                  href="/explore"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/explore")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore</span>
                </Link>

                <Link
                  href="/leaderboard"
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive("/leaderboard")
                      ? "bg-[#166534] text-white shadow-xs font-bold"
                      : "text-ink/80 hover:text-ink hover:bg-surface"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Leaderboard</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Right Action Hub: Sign In & Sign Up on Landing Page OR In-App Controls */}
        {isLandingPage ? (
          isSignedIn ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href={role === "beneficiary" ? "/my-causes" : "/feed"}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleAuthAction("signup")}
                className="px-4 py-2 rounded-full text-xs font-semibold text-ink-dim hover:text-ink hover:bg-surface-elevated transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer"
              >
                Sign up
              </button>
              <button
                type="button"
                onClick={() => handleAuthAction("signin")}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer"
              >
                Sign in
              </button>
            </div>
          )
        ) : !showInAppNav ? (
          <div className="flex items-center gap-2">
            {isSignedIn && !isPaypalSuccessPage && (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Autonomous Giving Agent Pill (Donors Only) */}
            {role !== "beneficiary" && (
              <Link
                href="/agent"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-surface text-ink hover:text-[#166534] text-xs font-semibold border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs"
                title="Autonomous AI Giving Agent"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Agent</span>
              </Link>
            )}

            {/* Quick Transparency Ledger Pill */}
            <Link
              href="/transparency"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-surface text-ink hover:text-[#166534] text-xs font-semibold border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs"
              title="Inspect live AG Grid PayPal audit ledger"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
              <span>Ledger</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
