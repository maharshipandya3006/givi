"use client";

import React from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck, Heart, Sparkles } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { AuthCard } from "@/app/components/auth-card";

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function AuthGate({
  children,
  title = "Authentication Required",
  description = "Sign in to access your direct micro-relief dashboard, verified bills, and real-time PayPal ledger.",
}: AuthGateProps) {
  const { isLoaded, isSignedIn, isDemoUser, demoPersona } = useUser();

  // 1. While auth state is initializing from session cookies/Clerk, render an elegant skeleton frame
  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 lg:px-8 py-10 max-w-5xl lg:max-w-6xl mx-auto w-full space-y-6 animate-pulse select-none">
        {/* Header Profile Card Skeleton */}
        <div className="w-full rounded-3xl bg-surface border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-surface-elevated border border-border" />
            <div className="space-y-2.5 text-center sm:text-left pt-1">
              <div className="w-48 h-6 rounded-xl bg-surface-elevated" />
              <div className="w-32 h-4 rounded-lg bg-surface-elevated/70" />
            </div>
          </div>
          <div className="w-36 h-9 rounded-2xl bg-surface-elevated/60 hidden sm:block" />
        </div>

        {/* 4 Impact Stat Cards Skeleton */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-border h-24 flex flex-col justify-between">
            <div className="w-16 h-3 rounded-md bg-surface-elevated/80" />
            <div className="w-24 h-6 rounded-lg bg-surface-elevated" />
            <div className="w-20 h-2.5 rounded bg-surface-elevated/60" />
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border h-24 flex flex-col justify-between">
            <div className="w-16 h-3 rounded-md bg-surface-elevated/80" />
            <div className="w-12 h-6 rounded-lg bg-surface-elevated" />
            <div className="w-16 h-2.5 rounded bg-surface-elevated/60" />
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border h-24 flex flex-col justify-between">
            <div className="w-20 h-3 rounded-md bg-surface-elevated/80" />
            <div className="w-14 h-6 rounded-lg bg-surface-elevated" />
            <div className="w-24 h-2.5 rounded bg-surface-elevated/60" />
          </div>
          <div className="p-5 rounded-2xl bg-surface border border-border h-24 flex flex-col justify-between">
            <div className="w-16 h-3 rounded-md bg-surface-elevated/80" />
            <div className="w-16 h-6 rounded-lg bg-surface-elevated" />
            <div className="w-24 h-2.5 rounded bg-surface-elevated/60" />
          </div>
        </div>

        {/* Marquee Agent Card Skeleton */}
        <div className="w-full h-44 rounded-3xl bg-surface border border-border" />

        {/* Bento Analytics Skeleton */}
        <div className="w-full h-72 rounded-3xl bg-surface border border-border" />
      </div>
    );
  }

  // 2. If user is authenticated via Clerk OR active in demo session, render immediately
  if (isSignedIn || isDemoUser || Boolean(demoPersona)) {
    return <>{children}</>;
  }

  // Otherwise, render an elegant in-app auth gate preserving current context
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
          <Lock className="w-5 h-5 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-ink mb-2">
          {title}
        </h2>
        <p className="text-xs text-ink-muted leading-relaxed max-w-sm">
          {description}
        </p>
      </div>

      <div className="w-full max-w-md">
        <AuthCard />
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <span>Return to overview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

