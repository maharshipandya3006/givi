"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { Heart, Receipt, ArrowDown } from "lucide-react";

// Register ScrollTrigger safely for React in browser
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// 1. APPLE FLUID DESIGN THEME STYLES (SF PRO / INTER + SPECULAR GLASS)
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-hero-wrapper {
  font-family: var(--font-hero, "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  
  /* Dynamic Variables using Givi brand tokens */
  --pill-bg-1: color-mix(in oklab, var(--color-paper-2) 90%, transparent);
  --pill-bg-2: color-mix(in oklab, var(--color-paper-3) 90%, transparent);
  --pill-shadow: rgba(28, 25, 23, 0.08);
  --pill-highlight: rgba(255, 255, 255, 0.95);
  --pill-inset-shadow: rgba(28, 25, 23, 0.04);
  --pill-border: var(--color-rule);
  --pill-border-top: rgba(255, 255, 255, 0.9);
  
  --pill-bg-1-hover: var(--color-paper-2);
  --pill-bg-2-hover: var(--color-paper-highlight);
  --pill-border-hover: var(--color-muted);
  --pill-border-top-hover: #ffffff;
  --pill-shadow-hover: rgba(28, 25, 23, 0.14);
  --pill-highlight-hover: #ffffff;

  /* Primary Apple Luminous Pill Tokens (§ 16.6 Hierarchy) */
  --primary-pill-bg-1: var(--color-accent);
  --primary-pill-bg-2: var(--color-accent-hover);
  --primary-pill-border: var(--color-accent-hover);
  --primary-pill-border-top: rgba(255, 255, 255, 0.5);
  --primary-pill-highlight: rgba(255, 255, 255, 0.35);
  --primary-pill-shadow: color-mix(in oklab, var(--color-accent) 25%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.85; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 35s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-footer-breathe,
  .animate-footer-scroll-marquee {
    animation: none !important;
  }
}

/* Theme-adaptive Grid Background (60px Apple Engineering Mesh) */
.footer-bg-grid {
  background-size: 60px 60px;
  background-image: 
    linear-gradient(to right, color-mix(in oklab, var(--color-rule) 50%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklab, var(--color-rule) 50%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
}

/* Theme-adaptive Emerald Aurora Glow */
.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%, 
    color-mix(in oklab, var(--color-accent) 12%, transparent) 0%, 
    color-mix(in oklab, var(--color-paper-3) 45%, transparent) 45%, 
    transparent 70%
  );
}

/* Apple Specular Glass Pill (§ 12 Materials & Depth) */
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 
      0 12px 28px -10px var(--pill-shadow), 
      inset 0 1px 1px var(--pill-highlight), 
      inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  border-top: 1px solid var(--pill-border-top); /* Specular top light catch */
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  transition-property: background, border-color, box-shadow, color, transform;
  transition-duration: 0.22s;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  touch-action: manipulation;
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  border-top-color: var(--pill-border-top-hover);
  box-shadow: 
      0 18px 36px -10px var(--pill-shadow-hover), 
      inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--color-ink);
}

/* Apple Primary Luminous Emerald Pill (§ 16.6 Hierarchy) */
.footer-primary-pill {
  background: linear-gradient(145deg, var(--primary-pill-bg-1) 0%, var(--primary-pill-bg-2) 100%);
  box-shadow: 
      0 16px 36px -10px var(--primary-pill-shadow), 
      inset 0 1px 1px var(--primary-pill-highlight), 
      inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--primary-pill-border);
  border-top: 1px solid var(--primary-pill-border-top); /* Specular light catch */
  color: var(--color-accent-ink, #ffffff);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  transition-property: background, border-color, box-shadow, color, transform;
  transition-duration: 0.22s;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  touch-action: manipulation;
}

.footer-primary-pill:hover {
  background: linear-gradient(145deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  box-shadow: 
      0 20px 42px -10px var(--primary-pill-shadow), 
      inset 0 1px 1px rgba(255, 255, 255, 0.55);
  color: var(--color-accent-ink, #ffffff);
}

/* Apple Instant Press Deflection (§ 1 & § 10) */
.footer-glass-pill:active,
.footer-primary-pill:active {
  transform: scale(0.96) !important;
  transition: transform 80ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}

/* Giant Background Text Masking (Restored GIVI) */
.footer-giant-bg-text {
  font-size: 24vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklab, var(--color-accent) 12%, transparent);
  background: linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 14%, transparent) 0%, transparent 65%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Apple Optical Headline Display Glow (§ 15 Typography) */
.footer-text-glow {
  letter-spacing: -0.04em;
  line-height: 1.02;
  background: linear-gradient(180deg, var(--color-ink) 0%, color-mix(in oklab, var(--color-ink) 75%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;

// -------------------------------------------------------------------------
// 2. MAGNETIC BUTTON PRIMITIVE (Interruptible Springs § 3 & § 4)
// -------------------------------------------------------------------------
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & 
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
    href?: string;
  };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const h = rect.width / 2;
          const w = rect.height / 2;
          const x = e.clientX - rect.left - h;
          const y = e.clientY - rect.top - w;

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            rotationX: -y * 0.1,
            rotationY: x * 0.1,
            scale: 1.03,
            ease: "power2.out",
            duration: 0.3,
            overwrite: "auto",
          });
        };

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.0,
            overwrite: "auto",
          });
        };

        element.addEventListener("mousemove", handleMouseMove as any);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          element.removeEventListener("mousemove", handleMouseMove as any);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as any).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as any).current = node;
        }}
        className={cn("cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// 3. MAIN CINEMATIC OPENING HERO (SCREEN 1)
// -------------------------------------------------------------------------
const MarqueeItem = () => (
  <div className="flex items-center space-x-10 px-6 font-medium">
    <span>100% Direct PayPal Payouts</span> <span className="text-[#166534]">✦</span>
    <span>0% Platform Take Fee</span> <span className="text-[#166534]">✦</span>
    <span>Gemini Vision OCR Verification</span> <span className="text-[#166534]">✦</span>
    <span>$5 Micro-Relief Auto-Capping</span> <span className="text-[#166534]">✦</span>
    <span>Real-Time AG Grid Public Ledger</span> <span className="text-[#166534]">✦</span>
    <span>Autonomous AI Giving Agent</span> <span className="text-[#166534]">✦</span>
  </div>
);

export function CinematicOpeningHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const auroraRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;

    // Respect reduced motion preference (Hallmark Gate 27)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const actionStage = document.getElementById("action-stage");
    const actionStatement = document.getElementById("action-statement");
    const authCardContainer = document.getElementById("auth-card-container");
    const heroCenterContent = linksRef.current?.parentElement;

    const ctx = gsap.context(() => {
      // 1. Subtle in-hero background parallax depth as the hero stage scrolls up naturally
      if (giantTextRef.current && containerRef.current) {
        gsap.to(giantTextRef.current, {
          y: "14vh",
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      if (auroraRef.current && containerRef.current) {
        gsap.to(auroraRef.current, {
          scale: 0.85,
          opacity: 0.4,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }

      // 2. Parallax fade for the opening hero content as user scrolls down toward Action Stage
      if (heroCenterContent && containerRef.current) {
        gsap.to(heroCenterContent, {
          y: -50,
          opacity: 0.25,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom 30%",
            scrub: 0.8,
          },
        });
      }

      // 3. Luxurious, long & smooth pop-up choreography for the Sign In / Sign Up Card
      // NOTE: Maintains full opacity throughout so the frosted glass (backdrop-blur) continuously blurs the globe without ghosting or shifting
      if (actionStage && authCardContainer) {
        gsap.fromTo(
          authCardContainer,
          {
            y: 140,
            scale: 0.88,
            rotateX: 8,
            transformPerspective: 1000,
          },
          {
            y: 0,
            scale: 1,
            rotateX: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: actionStage,
              start: "top 95%",
              end: "top 25%", // Long, smooth travel distance
              scrub: 1.2,     // Fluid spring momentum
            },
          }
        );
      }

      // 4. Smooth glide-in for the statement & metrics on the left
      if (actionStage && actionStatement) {
        gsap.fromTo(
          actionStatement,
          {
            y: 75,
            opacity: 0.1,
          },
          {
            y: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: actionStage,
              start: "top 95%",
              end: "top 35%",
              scrub: 1.0,
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const scrollToStage = (role?: "donor" | "beneficiary", tab: "signin" | "signup" = "signup") => {
    const el = document.getElementById("action-stage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("set-auth-tab", {
          detail: { tab, role: role || "donor" },
        })
      );
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      
      <div
        ref={containerRef}
        className="relative min-h-dvh w-full flex flex-col justify-between overflow-hidden bg-background text-ink cinematic-hero-wrapper pt-0 pb-6 sm:pb-8"
      >
        {/* Ambient Light & Grid Background (60px Apple Engineering Mesh) */}
        <div
          ref={auroraRef}
          className="footer-aurora absolute left-1/2 top-1/2 h-[65vh] w-[85vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[90px] pointer-events-none z-0"
        />
        <div className="footer-bg-grid absolute inset-0 z-0 pointer-events-none" />

        {/* Giant background text: GIVI (Restored) */}
        <div
          ref={giantTextRef}
          className="footer-giant-bg-text absolute bottom-[4vh] sm:bottom-[6vh] md:bottom-[7vh] left-1/2 -translate-x-1/2 whitespace-nowrap z-0 pointer-events-none select-none"
        >
          GIVI
        </div>

        {/* 1. Horizontal Sleek Marquee (Continuous Fluid Motion) */}
        <div className="relative w-full overflow-hidden border-y border-border bg-background/70 backdrop-blur-md py-3 z-10 shadow-sm">
          <div className="flex w-max animate-footer-scroll-marquee text-xs md:text-sm font-semibold text-ink-muted">
            <MarqueeItem />
            <MarqueeItem />
          </div>
        </div>

        {/* 2. Main Center Content: Optical Apple Typography & Dynamic Actions */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 my-4 sm:my-6 w-full max-w-5xl mx-auto text-center -translate-y-5 sm:-translate-y-8 md:-translate-y-10">
          {/* Brand Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs text-ink-dim mb-4 sm:mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#166534] shadow-sm animate-pulse" />
            <span className="font-semibold text-ink">givi</span>
            <span className="text-ink-muted">·</span>
            <span>PayPal AI Hackathon 2026</span>
          </div>

          {/* High-Impact Punchy Headline with Apple Optical Sizing (§ 15) */}
          <h1
            ref={headingRef}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black footer-text-glow mb-6 sm:mb-7 text-center leading-[1.04]"
          >
            Real bills. Direct relief. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-ink via-ink/80 to-ink-muted">
              Zero friction.
            </span>
          </h1>

          {/* Interactive Magnetic Dual Action Stage with Apple Hierarchy (§ 16.6) */}
          <div ref={linksRef} className="flex flex-col items-center gap-3 w-full">
            <div className="flex flex-wrap justify-center gap-3.5 w-full">
              <MagneticButton
                as="button"
                type="button"
                onClick={() => scrollToStage("donor", "signup")}
                className="footer-primary-pill px-8 py-4 rounded-full font-bold text-sm md:text-base flex items-center gap-2.5 group cursor-pointer"
              >
                <Heart className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform duration-200" />
                <span>Start donating</span>
              </MagneticButton>
              
              <MagneticButton
                as="button"
                type="button"
                onClick={() => scrollToStage("beneficiary", "signup")}
                className="footer-glass-pill px-8 py-4 rounded-full text-ink font-bold text-sm md:text-base flex items-center gap-2.5 group cursor-pointer"
              >
                <Receipt className="w-5 h-5 text-[#166534] group-hover:scale-110 transition-transform duration-200" />
                <span>Request bill relief</span>
              </MagneticButton>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar with Scroll Cue (Uncluttered) */}
        <div className="relative z-20 w-full px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          {/* Guarantee */}
          <div className="font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />
            <span>0% platform take fee · 100% direct to families</span>
          </div>

          {/* Scroll Down Cue */}
          <MagneticButton
            as="button"
            type="button"
            onClick={() => scrollToStage("donor", "signin")}
            className="footer-glass-pill px-4 py-2 rounded-full flex items-center gap-2 text-ink-dim hover:text-ink font-semibold text-xs"
            aria-label="Scroll down to sign in and swipe deck"
          >
            <span>Sign in & swipe</span>
            <ArrowDown className="w-3.5 h-3.5 text-[#166534] motion-safe:animate-bounce" />
          </MagneticButton>
        </div>
      </div>
    </>
  );
}

// Backwards compatibility alias
export const CinematicFooter = CinematicOpeningHero;

