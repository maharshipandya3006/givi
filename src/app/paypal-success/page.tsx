"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function PayPalSuccessPage() {
  const [status, setStatus] = useState<"capturing" | "success" | "error" | "cancelled">("capturing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<number>(0);
  const executedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || executedRef.current) return;
    executedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const payerId = params.get("PayerID");
    const cancelled = params.get("cancelled");
    const amountParam = parseFloat(params.get("amount") || "0");
    const userIdParam = params.get("userId") || undefined;

    if (amountParam > 0) {
      setDisplayAmount(amountParam);
    }

    const returnTo = params.get("returnTo") || "/feed";

    // 1. Handle Cancellation
    if (cancelled) {
      setStatus("cancelled");
      if (window.opener) {
        try {
          window.opener.postMessage({ type: "PAYPAL_ORDER_CANCELLED" }, "*");
        } catch {}
      }
      try {
        localStorage.setItem("givi_paypal_order_cancelled", Date.now().toString());
      } catch {}
      setTimeout(() => {
        window.close();
        setTimeout(() => {
          window.location.href = returnTo;
        }, 200);
      }, 500);
      return;
    }

    // 2. Handle Approval & Capture in Popup
    if (token) {
      const executeCapture = async () => {
        try {
          // Perform backend capture while the user is still looking at the popup
          const res = await fetch("/api/paypal/wallet/topup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: token,
              amount: amountParam || 50,
              userId: userIdParam,
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || "Failed to capture PayPal Sandbox order.");
          }

          // Verified & captured successfully!
          setStatus("success");

          const payload = {
            type: "PAYPAL_ORDER_CAPTURED",
            orderId: token,
            payerId: payerId || undefined,
            amount: amountParam || data.amount || 50,
            newBalance: data.newBalance,
            captureId: data.captureId,
            time: Date.now(),
          };

          // Inform opener window
          if (window.opener) {
            try {
              window.opener.postMessage(payload, "*");
            } catch {}
          }

          // Also set localStorage for privacy browsers / stripped openers
          try {
            localStorage.setItem("givi_paypal_order_captured", JSON.stringify(payload));
          } catch {}

          // Brief celebratory pause then close or return to app
          setTimeout(() => {
            window.close();
            setTimeout(() => {
              window.location.href = returnTo;
            }, 300);
          }, 500);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Capture failed";
          setStatus("error");
          setErrorMessage(msg);

          if (window.opener) {
            try {
              window.opener.postMessage({ type: "PAYPAL_CAPTURE_FAILED", error: msg }, "*");
            } catch {}
          }
          try {
            localStorage.setItem(
              "givi_paypal_capture_failed",
              JSON.stringify({ error: msg, time: Date.now() })
            );
          } catch {}
        }
      };

      executeCapture();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-white border border-[#e5e0d8] shadow-xl flex flex-col items-center">
        {status === "capturing" && (
          <div className="flex flex-col items-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-center text-[#166534] mb-3 relative">
              <Loader2 className="w-7 h-7 animate-spin text-[#166534]" />
              <ShieldCheck className="w-3.5 h-3.5 text-[#166534] absolute" />
            </div>
            <h2 className="text-base font-extrabold text-[#1a1a1a] mb-1">
              Verifying Sandbox Payment
            </h2>
            <p className="text-xs text-[#737373] max-w-[240px] leading-relaxed">
              Securing {displayAmount > 0 ? `$${displayAmount.toFixed(2)}` : "funds"} and crediting your givi. Wallet...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-[#166534] text-white flex items-center justify-center mb-3 shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-base font-extrabold text-[#166534] mb-1">
              Payment Verified!
            </h2>
            <p className="text-xs text-[#737373] mb-3">
              Returning to Givi...
            </p>
            <button
              type="button"
              onClick={() => {
                try { window.close(); } catch {}
                const params = new URLSearchParams(window.location.search);
                window.location.href = params.get("returnTo") || "/feed";
              }}
              className="px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow transition-colors cursor-pointer"
            >
              Return to Givi
            </button>
          </div>
        )}

        {status === "cancelled" && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-base font-extrabold text-[#1a1a1a] mb-1">
              Checkout Cancelled
            </h2>
            <p className="text-xs text-[#737373]">
              Closing window...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-base font-extrabold text-red-600 mb-1">
              Verification Failed
            </h2>
            <p className="text-xs text-[#737373] mb-4">
              {errorMessage || "Unable to capture sandbox order."}
            </p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
