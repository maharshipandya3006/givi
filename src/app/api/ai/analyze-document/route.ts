import { NextRequest, NextResponse } from "next/server";
import { analyzeProofDocument } from "@/lib/gemini";

// shortcut: in-memory limiter; upgrade to Upstash Redis for distributed multi-region rate limiting across serverless instances
// Rate limit: max 10 OCR document analyses per 5-minute window per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 10, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 1000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) rateLimitMap.delete(k);
    }
    if (rateLimitMap.size > 1000) {
      rateLimitMap.clear();
    }
  }
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count += 1;
  return true;
}

const MAX_BASE64_LENGTH = 14_000_000; // ~10MB payload limit

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many document scans. Please wait a few minutes before submitting another file." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { imageBase64, mimeType = "image/jpeg", statedAmount = 100, category = "utilities" } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "No document image provided" }, { status: 400 });
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        { error: "Document payload exceeds 10MB limit. Please upload a compressed image or PDF." },
        { status: 413 }
      );
    }

    const parsedAmount = parseFloat(statedAmount);
    const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 100.0;

    const analysis = await analyzeProofDocument({
      imageBase64,
      mimeType,
      statedAmount: validAmount,
      category,
    });

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Document analysis failed";
    console.error("AI Document Analysis Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
