import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, causeId = "cause_general", causeTitle = "Givi Donation" } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount specified" }, { status: 400 });
    }

    const order = await createPayPalOrder({
      amount: parsedAmount,
      causeId,
      causeTitle,
    });

    return NextResponse.json(order);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create PayPal order";
    console.error("PayPal Create Order Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
