import { NextRequest, NextResponse } from "next/server";
import { generateImpactToast } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      causeTitle = "Community Aid",
      donorName = "A friend",
      amount = 5.0,
      category = "utilities",
      recipientName = "a neighbor",
      location = "their hometown",
    } = body;

    const message = await generateImpactToast({
      causeTitle,
      donorName,
      amount: parseFloat(amount),
      category,
      recipientName,
      location,
    });

    return NextResponse.json({ message });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate toast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

