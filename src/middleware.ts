import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isLiveKey = Boolean(rawKey && rawKey.startsWith("pk_") && !rawKey.includes("REPLACE"));

export default isLiveKey
  ? clerkMiddleware()
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

