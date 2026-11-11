import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkRateLimit("orders", ip, 30, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many order requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }
    const body = await request.json().catch(() => ({}));
    const {
      amount,
      causeId = "cause_general",
      causeTitle = "Givi Donation",
      returnUrl,
      cancelUrl,
    } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0.01) {
      return NextResponse.json({ error: "Invalid amount specified (minimum $0.01)" }, { status: 400 });
    }

    const order = await createPayPalOrder({
      amount: parsedAmount,
      causeId,
      causeTitle,
      returnUrl,
      cancelUrl,
    });

    return NextResponse.json(order);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create PayPal order";
    console.error("PayPal Create Order Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

