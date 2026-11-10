"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Compass, User, Trophy, Receipt, PlusCircle } from "lucide-react";
import { useUser } from "@/lib/user-context";

export function MobileNav() {
  const pathname = usePathname();
  const { role, isOnboarded } = useUser();

  // Hide mobile navigation dock on landing page, palette preview, during onboarding, or on PayPal success return
  if (
    pathname === "/" ||
    pathname === "/palette-preview" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/paypal-success") ||
    !isOnboarded
  ) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  if (role === "beneficiary") {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-4 py-2 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-lg">
        <Link
          href="/my-causes"
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#166534] focus-visible:outline-none"
        >
          <div className="w-10 h-10 rounded-full bg-[#166534] flex items-center justify-center text-white -mt-5 shadow-sm border-2 border-surface">
            <Receipt className="w-5 h-5" />
          </div>
          <span>My Requests</span>
        </Link>
        <Link
          href="/create-cause"
          className={`flex flex-col items-center gap-1 text-[11px] transition-colors focus-visible:outline-none ${
            isActive("/create-cause") ? "text-[#166534] font-bold" : "text-ink-muted hover:text-ink"
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>New Need</span>
        </Link>
        <Link
          href="/explore"
          className={`flex flex-col items-center gap-1 text-[11px] transition-colors focus-visible:outline-none ${
            isActive("/explore") ? "text-[#166534] font-bold" : "text-ink-muted hover:text-ink"
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 text-[11px] transition-colors focus-visible:outline-none ${
            isActive("/profile") ? "text-[#166534] font-bold" : "text-ink-muted hover:text-ink"
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    );
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-4 py-2 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-lg">
      <Link
        href="/profile"
        className={`flex flex-col items-center gap-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isActive("/profile") ? "text-emerald-400 font-bold" : "text-ink-muted hover:text-ink"
        }`}
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </Link>
      <Link
        href="/feed"
        className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white -mt-5 shadow-emerald-sm border-2 border-surface">
          <Heart className="w-5 h-5 fill-white" />
        </div>
        <span>Swipe</span>
      </Link>
      <Link
        href="/explore"
        className={`flex flex-col items-center gap-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isActive("/explore") ? "text-emerald-400 font-bold" : "text-ink-muted hover:text-ink"
        }`}
      >
        <Compass className="w-5 h-5" />
        <span>Explore</span>
      </Link>
      <Link
        href="/leaderboard"
        className={`flex flex-col items-center gap-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          isActive("/leaderboard") ? "text-emerald-400 font-bold" : "text-ink-muted hover:text-ink"
        }`}
      >
        <Trophy className="w-5 h-5" />
        <span>Leaderboard</span>
      </Link>
    </nav>
  );
}

