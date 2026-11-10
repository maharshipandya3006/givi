"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Wallet,
  CreditCard,
  Loader2,
  AlertCircle,
  Lock,
  Calendar,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AmountSlider } from "@/components/ui/amount-slider";
import { AnimatedTicket } from "@/components/ui/ticket-confirmation-card";
import { formatCurrency } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

interface WalletFundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, newBalance: number) => void;
  initialAmount?: number;
  title?: string;
  description?: string;
}

export function WalletFundingModal({
  isOpen,
  onClose,
  onSuccess,
  initialAmount = 50,
  title = "givi. Wallet",
  description = "Every swipe in your feed will be deducted directly from this balance. Once your balance runs out, you can simply top it up to continue swiping.",
}: WalletFundingModalProps) {
  const { userId, rechargeWallet, refreshProfile } = useUser();

  const [amount, setAmount] = useState<number>(initialAmount);
  const [customInput, setCustomInput] = useState<string>(initialAmount.toString());
  const [isCustomActive, setIsCustomActive] = useState<boolean>(false);
  const [fundingMethod, setFundingMethod] = useState<"paypal" | "card">("paypal");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [fundedAmount, setFundedAmount] = useState<number>(initialAmount);
  const [newWalletBalance, setNewWalletBalance] = useState<number>(0);

  // Card Form State
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExp, setCardExp] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");

  const customInputRef = useRef<HTMLInputElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      isCapturingRef.current = false;
      setAmount(initialAmount);
      setCustomInput(initialAmount.toString());
      setIsCustomActive(false);
      setIsSuccess(false);
      setErrorMessage(null);
      setIsProcessing(false);
      setFundingMethod("paypal");
      setCardNumber("");
      setCardExp("");
      setCardCvv("");
    }
  }, [isOpen, initialAmount]);

  const handleClose = () => {
    isCapturingRef.current = false;
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    onClose();
  };

  if (!isOpen) return null;

  const handleSliderChange = (vals: number[]) => {
    const nextVal = vals[vals.length - 1] ?? 50;
    setAmount(nextVal);
    setCustomInput(nextVal.toString());
    setIsCustomActive(false);
    setErrorMessage(null);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    setIsCustomActive(true);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
      setErrorMessage(null);
    }
  };

  const setPresetAmount = (preset: number) => {
    setAmount(preset);
    setCustomInput(preset.toString());
    setIsCustomActive(false);
    setErrorMessage(null);
  };

  const triggerCelebration = (loadedAmount: number, balance: number) => {
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#166534", "#22c55e", "#ffffff", "#f59e0b"],
    });
    setFundedAmount(loadedAmount);
    setNewWalletBalance(balance);
    setIsSuccess(true);
    setIsProcessing(false);
    if (onSuccess) {
      onSuccess(loadedAmount, balance);
    }
    // Automatically close modal after celebration so user returns to the active view
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      onClose();
    }, 2400);
  };

  // Real PayPal Sandbox Popup Window Flow
  const handlePayPalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    // 1. Open popup window immediately on click so browser popup blocker does not intercept it
    const width = 500;
    const height = 660;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "about:blank",
      "PayPalCheckoutWindow",
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (popup) {
      popup.document.write(
        `<!DOCTYPE html><html><head><title>Connecting to PayPal...</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#fafafa;color:#111;text-align:center;padding:24px;}.spinner{width:40px;height:40px;border:3px solid #e2e8f0;border-top-color:#0070ba;border-radius:50%;animation:spin .8s linear infinite;margin-bottom:16px;}@keyframes spin{to{transform:rotate(360deg);}}h3{margin:0 0 6px;font-size:18px;color:#003087;font-weight:700;}p{margin:0;font-size:13px;color:#64748b;}</style></head><body><div class="spinner"></div><h3>Connecting to PayPal Sandbox</h3><p>Securing checkout session for $${amount.toFixed(2)}...</p></body></html>`
      );
    }

    // Clean any prior cross-window tokens
    try {
      localStorage.removeItem("givi_paypal_order_captured");
      localStorage.removeItem("givi_paypal_order_approved");
      localStorage.removeItem("givi_paypal_order_cancelled");
      localStorage.removeItem("givi_paypal_capture_failed");
    } catch {}

    try {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/feed";
      const returnUrl = `${window.location.origin}/paypal-success?amount=${amount}&userId=${encodeURIComponent(userId || "")}&returnTo=${encodeURIComponent(currentPath)}`;
      const cancelUrl = `${window.location.origin}/paypal-success?cancelled=true&returnTo=${encodeURIComponent(currentPath)}`;

      // 2. Create PayPal Order on backend
      const orderRes = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          causeId: "wallet_allowance",
          causeTitle: "givi. Wallet Allowance Preload",
          returnUrl,
          cancelUrl,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        if (popup && !popup.closed) popup.close();
        throw new Error(orderData.error || "Failed to initialize PayPal Sandbox checkout.");
      }

      const orderId = orderData.orderId;
      const approvalUrl =
        orderData.approvalUrl ||
        `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

      // 3. Direct popup to PayPal approval URL
      if (popup && !popup.closed) {
        popup.location.href = approvalUrl;
      } else {
        // Fallback: full redirect if popup was blocked
        window.location.href = approvalUrl;
        return;
      }

      const handleInstantCaptured = async (loadedAmount: number, newBalance: number) => {
        if (isCapturingRef.current) return;
        isCapturingRef.current = true;
        cleanup();
        await rechargeWallet(loadedAmount, newBalance);
        await refreshProfile();
        triggerCelebration(loadedAmount, newBalance);
      };

      const finishCaptureFallback = async (approvedOrderId: string) => {
        if (isCapturingRef.current) return;
        isCapturingRef.current = true;
        cleanup();

        try {
          const topupRes = await fetch("/api/paypal/wallet/topup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: approvedOrderId,
              amount,
              userId,
            }),
          });

          const topupData = await topupRes.json();
          if (!topupRes.ok || !topupData.success) {
            throw new Error(topupData.error || "Failed to capture approved PayPal order.");
          }

          await rechargeWallet(amount, topupData.newBalance);
          await refreshProfile();
          triggerCelebration(amount, topupData.newBalance);
        } catch (captureErr: unknown) {
          isCapturingRef.current = false;
          const msg = captureErr instanceof Error ? captureErr.message : "Capture failed";
          setErrorMessage(msg);
          setIsProcessing(false);
        }
      };

      // 4. Primary: Message event from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === "PAYPAL_ORDER_CAPTURED") {
          handleInstantCaptured(event.data.amount || amount, event.data.newBalance);
        } else if (event.data?.type === "PAYPAL_ORDER_APPROVED") {
          finishCaptureFallback(event.data.orderId || orderId);
        } else if (event.data?.type === "PAYPAL_CAPTURE_FAILED") {
          cleanup();
          setErrorMessage(event.data.error || "PayPal payment verification failed.");
          setIsProcessing(false);
        } else if (event.data?.type === "PAYPAL_ORDER_CANCELLED") {
          cleanup();
          setIsProcessing(false);
        }
      };

      // Secondary: Storage event for browsers that strip window.opener (Brave/privacy shields)
      const storageHandler = (e: StorageEvent) => {
        if (e.key === "givi_paypal_order_captured" && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            handleInstantCaptured(data.amount || amount, data.newBalance);
          } catch {}
        } else if (e.key === "givi_paypal_order_approved" && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            finishCaptureFallback(data.orderId || orderId);
          } catch {}
        } else if (e.key === "givi_paypal_capture_failed" && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            cleanup();
            setErrorMessage(data.error || "PayPal payment verification failed.");
            setIsProcessing(false);
          } catch {}
        } else if (e.key === "givi_paypal_order_cancelled") {
          cleanup();
          setIsProcessing(false);
        }
      };

      window.addEventListener("message", messageHandler);
      window.addEventListener("storage", storageHandler);

      // 5. Poll to detect if popup closed or storage updated
      const popupPoll = setInterval(() => {
        try {
          const capturedRaw = localStorage.getItem("givi_paypal_order_captured");
          if (capturedRaw) {
            const parsed = JSON.parse(capturedRaw);
            handleInstantCaptured(parsed.amount || amount, parsed.newBalance);
            return;
          }

          const approvedRaw = localStorage.getItem("givi_paypal_order_approved");
          if (approvedRaw) {
            const parsed = JSON.parse(approvedRaw);
            if (parsed.orderId) {
              finishCaptureFallback(parsed.orderId);
              return;
            }
          }
        } catch {}

        if (popup && popup.closed) {
          cleanup();
          setIsProcessing(false);
        }
      }, 500);

      const cleanup = () => {
        isCapturingRef.current = false;
        clearInterval(popupPoll);
        window.removeEventListener("message", messageHandler);
        window.removeEventListener("storage", storageHandler);
        try {
          localStorage.removeItem("givi_paypal_order_captured");
          localStorage.removeItem("givi_paypal_order_approved");
          localStorage.removeItem("givi_paypal_order_cancelled");
          localStorage.removeItem("givi_paypal_capture_failed");
        } catch {}
      };
    } catch (err: unknown) {
      if (popup && !popup.closed) popup.close();
      const msg = err instanceof Error ? err.message : "PayPal checkout error";
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  // Card Payment Submission
  const handleCardPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.length < 13 || !cardExp || !cardCvv || cardCvv.length < 3) {
      setErrorMessage("Please enter a valid card number (at least 13 digits), expiration, and CVV.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/paypal/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          isDemo: true,
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Card authorization failed.");
      }

      await rechargeWallet(amount, data.newBalance);
      await refreshProfile();
      triggerCelebration(amount, data.newBalance);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Card payment failed";
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border bg-surface-elevated/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#166534]/15 border border-[#166534]/30 flex items-center justify-center text-[#166534]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">{title}</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {isSuccess ? (
            /* Celebratory Success Ticket View */
            <div className="py-2 flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-200">
              <AnimatedTicket
                ticketId={`GIVI-${Date.now().toString().slice(-8)}`}
                amount={fundedAmount}
                date={new Date()}
                cardHolder={
                  fundingMethod === "paypal"
                    ? "PayPal Supporter"
                    : cardNumber
                    ? "Card Supporter"
                    : "Supporter"
                }
                last4Digits={
                  fundingMethod === "paypal"
                    ? "PAYPAL"
                    : cardNumber.replace(/\s+/g, "").slice(-4) || "1881"
                }
                barcodeValue={`GIVI${Math.round(fundedAmount * 100)}${Date.now().toString().slice(-6)}`}
                title="Wallet Filled!"
                subtitle="Your givi. wallet has been credited successfully"
                paymentMethod={fundingMethod}
              />

              <button
                type="button"
                onClick={handleClose}
                className="w-full max-w-sm py-3.5 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Continue Swiping</span>
              </button>
            </div>
          ) : (
            /* Interactive Selection & Payment View */
            <>
              <p className="text-xs text-ink-dim leading-relaxed">{description}</p>

              {/* Amount Display & Two-way Input */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Amount to Preload
                  </span>
                  <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-xl focus-within:border-[#166534] focus-within:ring-1 focus-within:ring-[#166534]">
                    <span className="text-sm font-bold text-ink-muted">$</span>
                    <input
                      ref={customInputRef}
                      type="number"
                      min="1"
                      step="any"
                      value={customInput}
                      onChange={handleCustomInputChange}
                      placeholder="Custom"
                      className="w-28 text-right bg-transparent text-lg font-black text-ink font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Amount Slider with Evenly Spaced Dots */}
                <div className="pt-2">
                  <AmountSlider
                    min={10}
                    max={250}
                    step={5}
                    ticks={7}
                    value={[Math.min(Math.max(amount, 10), 250)]}
                    onValueChange={handleSliderChange}
                  />
                  <div className="flex justify-between text-[10px] text-ink-muted font-mono mt-1.5">
                    <span>$10</span>
                    <span>$50</span>
                    <span>$100</span>
                    <span>$175</span>
                    <span>$250</span>
                  </div>
                </div>

                {/* Quick Preset Buttons (4 Buttons with Custom) */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPresetAmount(preset)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        amount === preset && !isCustomActive
                          ? "bg-[#166534]/15 border-[#166534] text-[#166534]"
                          : "bg-surface border-border text-ink-muted hover:text-ink hover:border-ink-muted"
                      }`}
                    >
                      +${preset}.00
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomActive(true);
                      customInputRef.current?.focus();
                      customInputRef.current?.select();
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      isCustomActive || (amount !== 25 && amount !== 50 && amount !== 100)
                        ? "bg-[#166534]/15 border-[#166534] text-[#166534] ring-1 ring-[#166534]"
                        : "bg-surface border-border text-ink-muted hover:text-ink hover:border-ink-muted"
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom Amount Inline Input when Custom is selected */}
                {isCustomActive && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-[#166534] ring-2 ring-[#166534]/20 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="text-xs font-bold text-ink">Enter Custom Amount:</span>
                    <div className="flex items-center gap-1 bg-surface-elevated px-2.5 py-1 rounded-lg border border-border focus-within:border-[#166534]">
                      <span className="text-sm font-bold text-[#166534]">$</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={customInput}
                        onChange={handleCustomInputChange}
                        placeholder="Amount"
                        className="w-28 text-right bg-transparent text-base font-black text-ink font-mono focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-500 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Payment Methods Section */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-ink block">
                  Select Funding Method
                </span>

                {/* Method Selector Tabs: PayPal vs Debit/Credit Card */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-surface-elevated border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setFundingMethod("paypal");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      fundingMethod === "paypal"
                        ? "bg-[#166534] text-white shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <span>PayPal Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFundingMethod("card");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      fundingMethod === "card"
                        ? "bg-[#166534] text-white shadow-sm"
                        : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Debit or Credit Card</span>
                  </button>
                </div>

                {/* Tab 1: PayPal Method (Real Popup Window) */}
                {fundingMethod === "paypal" && (
                  <form
                    onSubmit={handlePayPalSubmit}
                    className="rounded-2xl border border-border p-4 bg-background shadow-sm space-y-3.5 animate-in fade-in duration-150"
                  >
                    <div className="text-xs">
                      <span className="font-bold text-ink">PayPal Checkout</span>
                    </div>

                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Click below to open the real PayPal Sandbox popup window. Log in with your test buyer account and approve the transaction.
                    </p>

                    {/* Official PayPal Gold Button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#ffc439] hover:bg-[#f4bb34] text-[#003087] font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#003087]" />
                          <span className="text-xs font-bold">Authorizing with PayPal...</span>
                        </>
                      ) : (
                        <>
                          <span className="font-extrabold italic tracking-tight text-base">
                            Pay<span className="text-[#0079C1]">Pal</span>
                          </span>
                          <span className="text-xs font-bold">
                            Checkout {formatCurrency(amount)}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Tab 2: Debit or Credit Card Form */}
                {fundingMethod === "card" && (
                  <form
                    onSubmit={handleCardPaymentSubmit}
                    className="rounded-2xl border border-border p-4 bg-background shadow-sm space-y-3.5 animate-in fade-in duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">Enter Card Details</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCardNumber("4012 8888 8888 1881");
                          setCardExp("12/28");
                          setCardCvv("123");
                        }}
                        className="text-[11px] text-[#166534] font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Auto-Fill Test Card</span>
                      </button>
                    </div>

                    {/* Card Number Bar without top label */}
                    <div>
                      <div className="relative flex items-center">
                        <CreditCard className="w-4 h-4 absolute left-3 text-ink-muted" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                            const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                            setCardNumber(formatted);
                          }}
                          placeholder="Card Number"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-xs text-ink font-mono focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Expiry without top label */}
                      <div>
                        <div className="relative flex items-center">
                          <Calendar className="w-3.5 h-3.5 absolute left-3 text-ink-muted" />
                          <input
                            type="text"
                            required
                            value={cardExp}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                              const formatted = raw.length > 2 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
                              setCardExp(formatted);
                            }}
                            placeholder="MM/YY"
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-xs text-ink font-mono focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                          />
                        </div>
                      </div>

                      {/* CVV without top label */}
                      <div>
                        <div className="relative flex items-center">
                          <Lock className="w-3.5 h-3.5 absolute left-3 text-ink-muted" />
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="CVV"
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-border text-xs text-ink font-mono focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>Pay {formatCurrency(amount)} with Card</span>
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
