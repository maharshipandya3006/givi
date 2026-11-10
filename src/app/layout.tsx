import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";
import { AppHeader } from "./components/app-header";
import { MobileNav } from "./components/mobile-nav";
import { JudgeDemoPill } from "@/components/ui/judge-demo-pill";

export const metadata: Metadata = {
  title: "Givi — Swipe-to-Donate Micro-Relief Platform",
  description:
    "Direct, transparent micro-donations powered by PayPal Orders & Payouts, Google Gemini AI verification, and zero platform fees.",
};

const rawClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isLiveKey = Boolean(rawClerkKey && !rawClerkKey.includes("REPLACE") && rawClerkKey.startsWith("pk_"));
const clerkPublishableKey = isLiveKey ? rawClerkKey! : "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" className="overflow-x-clip">
        <body className="min-h-screen bg-background text-ink antialiased flex flex-col font-sans selection:bg-accent/20 selection:text-ink overflow-x-clip">
          <UserProvider>
            {/* Global Header with Role Switcher & 4-Tab Navigation */}
            <AppHeader />

            {/* Main Page Viewport */}
            <main className="flex-1 flex flex-col">{children}</main>

            {/* Mobile Bottom Dock (Hidden on Landing Page) */}
            <MobileNav />

            {/* Hackathon Judge Sandbox Assistant Pill */}
            <JudgeDemoPill />
          </UserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
