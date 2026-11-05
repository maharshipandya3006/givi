import Link from "next/link";
import {
  Heart,
  Zap,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Receipt,
  Sparkles,
  Layers,
  Bot,
  ShoppingBag,
  ExternalLink,
  Lock,
} from "lucide-react";
import { DollarTapeCorner, DollarTickerTape } from "@/components/ui/dollar-tape";
import { HeroPreviewCard } from "./components/hero-preview-card";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center w-full bg-black text-white selection:bg-[#118C4F] selection:text-white">
      {/* Infinite Dollar Ticker Tape */}
      <DollarTickerTape />

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col items-center">
        {/* Hero Section: 2-Column Fintech Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full mb-20">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Hackathon Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#118C4F]/10 border border-[#118C4F]/30 text-[#118C4F] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PayPal AI Hackathon · Social Impact & Agentic Commerce</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
              Swipe a bill. <br />
              <span className="text-[#118C4F] underline decoration-[#118C4F]/40 underline-offset-8">
                Keep the heat on.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-zinc-400 mb-8 max-w-xl leading-relaxed">
              The micro-donation platform turning abstract charity pleas into tangible,
              verified utility and medical statements. 100% of your micro-donation reaches the
              recipient immediately via instant PayPal Payouts with 0% platform fees.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10">
              <Link
                href="/feed"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#118C4F] hover:bg-[#0e703f] text-white font-bold text-base shadow-xl shadow-[#118C4F]/25 transition-all hover:scale-[1.02]"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>Start Swiping ($5)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/create-cause"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 text-zinc-200 font-semibold text-base border border-[#1f1f23] transition-colors"
              >
                <Receipt className="w-5 h-5 text-[#118C4F]" />
                <span>Submit an Overdue Bill</span>
              </Link>
            </div>

            {/* Micro Trust Stats */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[#1f1f23] w-full text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#118C4F]" />
                <span>Gemini Vision AI Audited</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#118C4F]" />
                <span>Automatic PII Redaction</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#118C4F]" />
                <span>Instant PayPal Payouts Rail</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Dollar-Taped Hero Card */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <HeroPreviewCard />
          </div>
        </div>

        {/* Live Fintech Stats Strip */}
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-3xl bg-zinc-950 border border-[#1f1f23] shadow-lg mb-20">
          <div className="flex flex-col items-center lg:items-start p-4">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              0.0%
            </span>
            <span className="text-xs font-bold text-[#118C4F] uppercase tracking-wider mb-1">
              Platform Take Rate
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">100% of donation disbursed</span>
          </div>

          <div className="flex flex-col items-center lg:items-start p-4 border-l-0 sm:border-l border-[#1f1f23]">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              &lt; 2.4s
            </span>
            <span className="text-xs font-bold text-[#118C4F] uppercase tracking-wider mb-1">
              Settlement Speed
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">PayPal Payouts v1 Rail</span>
          </div>

          <div className="flex flex-col items-center lg:items-start p-4 border-l-0 lg:border-l border-[#1f1f23]">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              98.4%
            </span>
            <span className="text-xs font-bold text-[#118C4F] uppercase tracking-wider mb-1">
              Gemini OCR Accuracy
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Auto-verification & masking</span>
          </div>

          <div className="flex flex-col items-center lg:items-start p-4 border-l-0 sm:border-l border-[#1f1f23]">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              $5.00
            </span>
            <span className="text-xs font-bold text-[#118C4F] uppercase tracking-wider mb-1">
              Micro-Relief Unit
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Auto-capped goal protection</span>
          </div>
        </div>

        {/* 3-Step Gesture Mechanics Bento */}
        <div className="w-full mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold text-[#118C4F] uppercase tracking-widest block mb-2">
              Intuitive Donating
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Tinder-Style Gesture Mechanics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gesture 1: Swipe Right */}
            <div className="relative p-7 rounded-3xl bg-zinc-950 border border-[#1f1f23] overflow-hidden flex flex-col justify-between">
              <DollarTapeCorner corner="top-left" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F] mb-6">
                  <ArrowRight className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Swipe Right · $5 Micro-Relief
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Chip in $5 toward an overdue heating, water, or insulin bill. The payment engine
                  automatically caps your contribution if the remaining statement ask is less than
                  $5.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1f1f23] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>GESTURE: DRAG RIGHT</span>
                <span className="text-[#118C4F] font-bold">1-TAP DISBURSE</span>
              </div>
            </div>

            {/* Gesture 2: Swipe Up */}
            <div className="relative p-7 rounded-3xl bg-zinc-950 border border-[#1f1f23] overflow-hidden flex flex-col justify-between">
              <DollarTapeCorner corner="top-right" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F] mb-6">
                  <ArrowUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Swipe Up · Pay Ask in Full
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Want to clear the entire overdue statement at once? Swipe up to summon a safe
                  confirmation drawer and extinguish the bill in a single transaction.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1f1f23] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>GESTURE: DRAG UP</span>
                <span className="text-[#118C4F] font-bold">CLEAR IN FULL</span>
              </div>
            </div>

            {/* Gesture 3: Swipe Left */}
            <div className="relative p-7 rounded-3xl bg-zinc-950 border border-[#1f1f23] overflow-hidden flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-[#1f1f23] flex items-center justify-center text-zinc-400 mb-6">
                  <ArrowLeft className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Swipe Left · Pass Cause
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  Not the right cause for you today? Pass frictionlessly without awkward guilt
                  trips. Browse at your own pace through authentic, community-submitted requests.
                </p>
              </div>
              <div className="pt-4 border-t border-[#1f1f23] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>GESTURE: DRAG LEFT</span>
                <span className="text-zinc-400 font-bold">ZERO GUILT PASS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Pillars: Bento Grid */}
        <div className="w-full mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold text-[#118C4F] uppercase tracking-widest block mb-2">
              Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Enterprise Fintech Infrastructure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento Card 1: Autonomous Giving Agent */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-[#1f1f23] relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F]">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-[#118C4F] bg-[#118C4F]/10 px-2.5 py-1 rounded-full border border-[#118C4F]/30">
                  AGENTIC COMMERCE
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Autonomous Giving Agent
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Set a monthly budget, target categories (Heating, Medical, Child Nutrition), and a
                minimum Gemini AI Trust Score. Your autonomous background agent scans active causes
                and automatically disburses micro-donations via PayPal on your behalf.
              </p>
              <Link
                href="/agent"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118C4F] hover:text-[#1cb668]"
              >
                <span>Configure Agent Rules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bento Card 2: AG Grid Transparency Ledger */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-[#1f1f23] relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F]">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-[#118C4F] bg-[#118C4F]/10 px-2.5 py-1 rounded-full border border-[#118C4F]/30">
                  AG GRID COMMUNITY
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Public Transparency Audit Ledger
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Every single dollar is accounted for in real time. Powered by AG Grid React, anyone
                can search, filter by category or city, inspect PayPal Payout batch IDs, and export
                tax-deductible receipt records as CSV with 1 click.
              </p>
              <Link
                href="/transparency"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118C4F] hover:text-[#1cb668]"
              >
                <span>View Public Audit Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bento Card 3: Channel3 Retail Aid */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-[#1f1f23] relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-[#118C4F] bg-[#118C4F]/10 px-2.5 py-1 rounded-full border border-[#118C4F]/30">
                  CHANNEL3 COMMERCE
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Verified Retail Aid Integration
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Beyond utility bills, receivers can search real e-commerce catalogs via the
                Channel3 API to fund essential physical items—space heaters, infant formula, and
                emergency winter boots—directly delivered to their doorstep.
              </p>
              <Link
                href="/create-cause"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118C4F] hover:text-[#1cb668]"
              >
                <span>Search Retail Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Bento Card 4: APIMatic OpenAPI Engine */}
            <div className="p-8 rounded-3xl bg-zinc-950 border border-[#1f1f23] relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#118C4F]/10 border border-[#118C4F]/30 flex items-center justify-center text-[#118C4F]">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <span className="text-xs font-mono text-[#118C4F] bg-[#118C4F]/10 px-2.5 py-1 rounded-full border border-[#118C4F]/30">
                  APIMATIC DEVELOPER PORTAL
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                OpenAPI Specification & Multi-Language SDKs
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Givi exposes a full OpenAPI 3.0 specification allowing external charity bots, donor
                wallets, and partner apps to query active statements and disburse micro-donations
                programmatically with auto-generated SDKs in 6 languages.
              </p>
              <Link
                href="/developers"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#118C4F] hover:text-[#1cb668]"
              >
                <span>Explore Developer Docs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sponsor Showcase Strip */}
        <div className="w-full border-t border-[#1f1f23] pt-12 text-center">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-6">
            Built for the PayPal AI Hackathon 2026 with Official Sponsor Rails
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-zinc-400 text-sm font-semibold">
            <span className="hover:text-white transition-colors">PayPal Payouts & Orders</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors">Google Gemini AI</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors">AG Grid Community</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors">Channel3 Commerce</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors">APIMatic Portal</span>
            <span className="text-zinc-700">•</span>
            <span className="hover:text-white transition-colors">Render Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
}
