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
        <body className="min-h-screen bg-black text-white antialiased flex flex-col">
          {/* Global Header */}
          <header className="sticky top-0 z-50 w-full border-b border-[#1f1f23] bg-black/90 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-[#118C4F] flex items-center justify-center text-white shadow-lg shadow-[#118C4F]/20 group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                    Givi
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-[#118C4F]/10 text-[#118C4F] border border-[#118C4F]/30">
                      Sandbox
                    </span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    100% Payouts · 0% Platform Fee
                  </span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-full border border-[#1f1f23]">
                <Link
                  href="/feed"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 text-[#118C4F]" />
                  Swipe Feed
                </Link>
                <Link
                  href="/transparency"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#118C4F]" />
                  Transparency
                </Link>
                <Link
                  href="/agent"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#118C4F]" />
                  AI Agent
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#118C4F]" />
                  Leaderboard
                </Link>
              </nav>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/create-cause"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-[#1f1f23] transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-[#118C4F]" />
                  Ask for Help
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#118C4F] hover:bg-[#0e703f] text-white shadow-md shadow-[#118C4F]/20 transition-all hover:scale-[1.02]"
                >
                  Start Donating
                </Link>
              </div>
            </div>
          </header>

          {/* Main Viewport Content */}
          <main className="flex-1 flex flex-col">{children}</main>

          {/* Footer */}
          <footer className="border-t border-[#1f1f23] py-8 px-4 bg-black text-zinc-500 text-xs">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <span>PayPal AI Hackathon 2026</span>
                <span>•</span>
                <span>Social Impact & Agentic Commerce</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-400">
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
