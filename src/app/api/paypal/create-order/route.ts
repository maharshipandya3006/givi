import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";

// Rate limiting: max 30 order creation calls per 5 minutes per IP to block quota abuse
const orderRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkOrderRateLimit(ip: string, limit = 30, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  if (orderRateLimitMap.size > 1000) {
    for (const [k, v] of orderRateLimitMap.entries()) {
      if (now > v.resetAt) orderRateLimitMap.delete(k);
    }
    while (orderRateLimitMap.size > 1000) {
      const oldestKey = orderRateLimitMap.keys().next().value;
      if (oldestKey) orderRateLimitMap.delete(oldestKey);
      else break;
    }
  }
  const record = orderRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    orderRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkOrderRateLimit(ip)) {
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

