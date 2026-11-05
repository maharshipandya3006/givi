import Link from "next/link";
import {
  Heart,
  Zap,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Receipt,
  Sparkles,
  Layers,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 md:py-20 max-w-5xl mx-auto w-full text-center">
      {/* Hackathon Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sky-400 text-xs font-semibold mb-8 animate-fade-in">
        <Sparkles className="w-3.5 h-3.5" />
        <span>PayPal AI Hackathon · Social Impact & Agentic Commerce</span>
      </div>

      {/* Hero Headline */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15] mb-6">
        Swipe a bill. <br />
        <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
          Keep the heat on.
        </span>
      </h1>

      <p className="text-base sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
        The &quot;Tinder-for-good&quot; platform turning abstract charity pleas into tangible,
        verified utility and medical statements. 100% of your micro-donation reaches the
        recipient immediately via PayPal Payouts.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
        <Link
          href="/feed"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
        >
          <Heart className="w-5 h-5 fill-white" />
          Start Swiping ($5)
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
        <Link
          href="/create-cause"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/10 transition-colors"
        >
          <Receipt className="w-5 h-5 text-sky-400" />
          Submit an Overdue Bill
        </Link>
      </div>

      {/* 3-Step Gesture Mechanics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left mb-16">
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 font-bold text-lg">
            👉
          </div>
          <h3 className="text-base font-bold text-white mb-2">Swipe Right · $5 Micro-Relief</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Chip in $5 towards an overdue heating, water, or insulin statement. Auto-caps if the
            remaining balance is less than $5.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 font-bold text-lg">
            👆
          </div>
          <h3 className="text-base font-bold text-white mb-2">Swipe Up · Clear The Ask</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Pay the remaining goal in full. Protected by a 1-tap confirmation drawer to prevent
            accidental gestures.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 font-bold text-lg">
            👈
          </div>
          <h3 className="text-base font-bold text-white mb-2">Swipe Left · Pass Cause</h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Move to the next verified cause without guilt. Zero pressure, frictionless discovery.
          </p>
        </div>
      </div>

      {/* Feature Pillars (Sponsor Tech Native Showcase) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl text-center border-t border-[var(--border-default)] pt-12">
        <div className="flex flex-col items-center">
          <Zap className="w-5 h-5 text-sky-400 mb-2" />
          <span className="text-sm font-bold text-white">0% Platform Fee</span>
          <span className="text-xs text-[var(--text-muted)]">PayPal Payouts Rail</span>
        </div>
        <div className="flex flex-col items-center">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
          <span className="text-sm font-bold text-white">Gemini Vision OCR</span>
          <span className="text-xs text-[var(--text-muted)]">AI Privacy Redaction</span>
        </div>
        <div className="flex flex-col items-center">
          <Layers className="w-5 h-5 text-purple-400 mb-2" />
          <span className="text-sm font-bold text-white">AG Grid Audit</span>
          <span className="text-xs text-[var(--text-muted)]">Live Public Ledger</span>
        </div>
        <div className="flex flex-col items-center">
          <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
          <span className="text-sm font-bold text-white">Agentic Commerce</span>
          <span className="text-xs text-[var(--text-muted)]">Autonomous Giving</span>
        </div>
      </div>
    </div>
  );
}

