"use client";

import { ArrowUp } from "lucide-react";
import { AuthCard } from "./components/auth-card";
import { CinematicOpeningHero } from "@/components/ui/motion-footer";
import { Globe, type Marker, type Arc } from "@/components/ui/cobe-globe";

const GIVI_RELIEF_MARKERS: Marker[] = [
  { id: "detroit", location: [42.3314, -83.0458] },
  { id: "nyc", location: [40.7128, -74.006] },
  { id: "chicago", location: [41.8781, -87.6298] },
  { id: "sf", location: [37.7749, -122.4194] },
  { id: "austin", location: [30.2672, -97.7431] },
  { id: "atlanta", location: [33.749, -84.388] },
  { id: "london", location: [51.5074, -0.1278] },
  { id: "paris", location: [48.8566, 2.3522] },    // Europe node
  { id: "berlin", location: [52.52, 13.405] },     // Europe node
  { id: "mumbai", location: [19.076, 72.8777] },   // Asia node
  { id: "singapore", location: [1.3521, 103.8198] },// Asia node
  { id: "tokyo", location: [35.6762, 139.6503] },
];

const GIVI_RELIEF_ARCS: Arc[] = [
  { id: "sf-detroit", from: [37.7749, -122.4194], to: [42.3314, -83.0458] },
  { id: "nyc-atlanta", from: [40.7128, -74.006], to: [33.749, -84.388] },
  { id: "chicago-detroit", from: [41.8781, -87.6298], to: [42.3314, -83.0458] },
  { id: "london-nyc", from: [51.5074, -0.1278], to: [40.7128, -74.006] },
  { id: "london-berlin", from: [51.5074, -0.1278], to: [52.52, 13.405] },
  { id: "mumbai-singapore", from: [19.076, 72.8777], to: [1.3521, 103.8198] },
  { id: "singapore-tokyo", from: [1.3521, 103.8198], to: [35.6762, 139.6503] },
];

const GLOBE_MARKER_COLOR: [number, number, number] = [0.086, 0.42, 0.22];
const GLOBE_BASE_COLOR: [number, number, number] = [0.96, 0.94, 0.91];
const GLOBE_ARC_COLOR: [number, number, number] = [0.086, 0.42, 0.22];
const GLOBE_GLOW_COLOR: [number, number, number] = [0.98, 0.97, 0.95];

export default function HomePage() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full bg-background min-h-screen flex flex-col">
      {/* 
        SCREEN 1: The Grand Opening Stage (Shown First)
        Independent full-page hero stage in natural document flow.
        Completely separate from Screen 2 with zero layer overlapping.
      */}
      <section id="hero-stage" className="relative w-full min-h-dvh flex flex-col">
        <CinematicOpeningHero />
      </section>

      {/* 
        SCREEN 2: The Core Action & Authentication Gateway (Scroll-Down Destination)
        Separate sequential stage in natural document flow.
        No overlapping/covering of the hero layer; scrolls in smoothly below it.
      */}
      <section
        id="action-stage"
        className="relative w-full min-h-dvh bg-background border-t border-border flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 md:py-24 overflow-hidden"
      >
        {/* Ambient 3D Interactive Cobe Globe - Centered & Proportionally Fitted in Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
        >
          <div className="w-[480px] sm:w-[600px] md:w-[700px] lg:w-[760px] xl:w-[820px] max-w-[84vw] max-h-[64dvh] aspect-square opacity-80 sm:opacity-90 transition-opacity pointer-events-auto">
            <Globe
              markers={GIVI_RELIEF_MARKERS}
              arcs={GIVI_RELIEF_ARCS}
              markerColor={GLOBE_MARKER_COLOR}
              baseColor={GLOBE_BASE_COLOR}
              arcColor={GLOBE_ARC_COLOR}
              glowColor={GLOBE_GLOW_COLOR}
              dark={0}
              mapBrightness={8}
              markerSize={0.03}
              markerElevation={0.015}
              arcWidth={0.6}
              arcHeight={0.25}
              speed={0.0028}
              theta={0.12}
              diffuse={1.3}
              mapSamples={18000}
            />
          </div>
        </div>

        <div
          id="action-stage-content"
          className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pointer-events-none"
        >
          {/* Left Column: Clean Focused Statement Stage */}
          <div
            id="action-statement"
            className="flex flex-col items-center lg:items-start text-center lg:text-left justify-center pointer-events-auto w-full max-w-xl mx-auto lg:mx-0"
          >
            {/* Smooth Scroll Up Return Cue (§ 1, § 7 Spatial Continuity) */}
            <div className="mb-6 lg:mb-8">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-elevated hover:bg-surface border border-border text-xs text-ink-muted hover:text-ink transition-transform motion-safe:transition-transform motion-reduce:transition-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] cursor-pointer shadow-sm"
                aria-label="Scroll back to top overview"
              >
                <ArrowUp className="w-3.5 h-3.5 text-[#166534]" />
                <span>Return to top</span>
              </button>
            </div>

            {/* Headline: Punchy, Apple Optical Sizing */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-black tracking-[-0.04em] text-ink leading-[1.03]">
              Swipe a bill. <br />
              <span className="text-[#166534]">Keep the heat on.</span>
            </h2>
          </div>

          {/* Right Column: Sign In & Sign Up Auth Component */}
          <div
            id="auth-card-container"
            className="flex items-center justify-center lg:justify-end w-full pointer-events-auto"
          >
            <AuthCard />
          </div>
        </div>
      </section>
    </div>
  );
}
