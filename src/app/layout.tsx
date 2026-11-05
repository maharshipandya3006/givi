import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
import { Heart, ShieldCheck, Trophy, Sparkles, PlusCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Givi — Micro-Donations with PayPal Instant Payouts & Gemini AI",
  description:
    "Accessible swipe-to-donate platform. 100% direct payouts to verified utility, medical, and community needs.",
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" className="dark">
        <body className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] antialiased flex flex-col">
          {/* Global Header */}
          <header className="sticky top-0 z-50 w-full border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                    Givi
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-sky-400 border border-blue-500/20">
                      Sandbox
                    </span>
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    100% Payouts · 0% Fee
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-full border border-[var(--border-default)]">
                <Link
                  href="/feed"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Swipe Feed
                </Link>
                <Link
                  href="/transparency"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Transparency
                </Link>
                <Link
                  href="/agent"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  AI Agent
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  Leaderboard
                </Link>
              </nav>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/create-cause"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-sky-400" />
                  Ask for Help
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  Start Donating
                </Link>
              </div>
            </div>
          </header>

          {/* Main Viewport Content */}
          <main className="flex-1 flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="border-t border-[var(--border-default)] py-8 px-4 bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span>Built for PayPal AI Hackathon 2026</span>
                <span>•</span>
                <span>Social Impact & Agentic Commerce</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/transparency" className="hover:text-white transition-colors">
                  AG Grid Audit
                </Link>
                <Link href="/developers" className="hover:text-white transition-colors">
                  APIMatic Docs
                </Link>
                <a
                  href="https://github.com/maharshipandya/givi"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}

