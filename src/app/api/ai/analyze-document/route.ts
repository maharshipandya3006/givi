import { NextRequest, NextResponse } from "next/server";
import { analyzeProofDocument } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limiter";

const MAX_BASE64_LENGTH = 14_000_000; // ~10MB payload limit

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkRateLimit("ocr", ip, 10, 5 * 60 * 1000)) {
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
