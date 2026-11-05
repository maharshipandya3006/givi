// ==============================================================================
// Givi — PayPal Payments & Payouts Engine
// ==============================================================================

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

/**
 * Fetches or returns cached OAuth2 Bearer token from PayPal Sandbox.
 */
export async function getPayPalAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.warn("PayPal client credentials missing. Operating in sandbox emulation mode.");
    return "mock_sandbox_access_token";
  }

  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authenticate with PayPal: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Creates an authorized PayPal Order for a donation.
 */
export async function createPayPalOrder(params: {
  amount: number;
  currency?: string;
  causeId: string;
  causeTitle: string;
}): Promise<{ orderId: string; approvalUrl?: string }> {
  const { amount, currency = "USD", causeId, causeTitle } = params;
  const token = await getPayPalAccessToken();

  if (token === "mock_sandbox_access_token") {
    return {
      orderId: `ORDER-MOCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      approvalUrl: `https://sandbox.paypal.com/checkoutnow?token=mock`,
    };
  }

  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: causeId,
        description: `Micro-donation to: ${causeTitle.slice(0, 100)}`,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: "Givi",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feed?donation=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feed?donation=cancelled`,
    },
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal Order Creation Failed: ${JSON.stringify(error)}`);
  }

  const order = await response.json();
  const approvalLink = order.links?.find((l: { rel: string; href: string }) => l.rel === "approve");

  return {
    orderId: order.id,
    approvalUrl: approvalLink?.href,
  };
}

/**
 * Captures an approved PayPal order.
 */
export async function capturePayPalOrder(orderId: string): Promise<{
  captureId: string;
  status: string;
  amount: number;
}> {
  const token = await getPayPalAccessToken();

  if (token === "mock_sandbox_access_token" || orderId.startsWith("ORDER-MOCK-")) {
    return {
      captureId: `CAPTURE-MOCK-${Date.now()}`,
      status: "COMPLETED",
      amount: 5.0,
    };
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal Order Capture Failed: ${JSON.stringify(error)}`);
  }

  const captureData = await response.json();
  const captureUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    captureId: captureUnit?.id || captureData.id,
    status: captureData.status,
    amount: parseFloat(captureUnit?.amount?.value || "0"),
  };
}

/**
 * Disburses 100% of donation directly to recipient's PayPal account via Payouts API v1.
 * Uses idempotency key (PayPal-Request-Id) to guarantee safe single-disbursement.
 */
export async function disbursePayPalPayout(params: {
  recipientEmail: string;
  amount: number;
  currency?: string;
  note?: string;
  senderItemId: string; // Idempotency seed (e.g. donation ID)
}): Promise<{ payoutBatchId: string; payoutItemId?: string; status: string }> {
  const { recipientEmail, amount, currency = "USD", note = "Givi community donation", senderItemId } = params;
  const token = await getPayPalAccessToken();

  if (token === "mock_sandbox_access_token") {
    return {
      payoutBatchId: `BATCH-MOCK-${Date.now()}`,
      payoutItemId: `ITEM-MOCK-${senderItemId}`,
      status: "SUCCESS",
    };
  }

  const payload = {
    sender_batch_header: {
      sender_batch_id: `givi_batch_${Date.now()}_${senderItemId.slice(0, 8)}`,
      email_subject: "You received a direct micro-donation via Givi!",
      email_message: "A donor just contributed to your verified cause on Givi. 100% of the funds are now in your account.",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        receiver: recipientEmail,
        note,
        sender_item_id: senderItemId,
      },
    ],
  };

  const response = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `payout-idemp-${senderItemId}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`PayPal Payout Failed: ${JSON.stringify(error)}`);
  }

  const payoutResult = await response.json();

  return {
    payoutBatchId: payoutResult.batch_header?.payout_batch_id || payoutResult.batch_header?.batch_id,
    payoutItemId: payoutResult.items?.[0]?.payout_item_id,
    status: payoutResult.batch_header?.batch_status || "PENDING",
  };
}
