import { NextRequest, NextResponse } from "next/server";
import { analyzeProofDocument } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType = "image/jpeg", statedAmount = 100, category = "utilities" } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No document image provided" }, { status: 400 });
    }

    const analysis = await analyzeProofDocument({
      imageBase64,
      mimeType,
      statedAmount: parseFloat(statedAmount),
      category,
    });

    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Document analysis failed";
    console.error("AI Document Analysis Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

