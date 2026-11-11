"use client";

import { useState, useEffect } from "react";
import { CauseCategory, NeedType, TrustScore, Cause } from "./types";

export interface UseCauseSubmissionOptions {
  draftStorageKey: string;
  defaultEmail?: string;
  defaultName?: string;
  defaultLocation?: string;
  userId?: string | null;
  onSuccess?: (cause: Cause) => void;
}

export function useCauseSubmission(options: UseCauseSubmissionOptions) {
  const {
    draftStorageKey,
    defaultEmail = "",
    defaultName = "",
    defaultLocation = "",
    userId = null,
    onSuccess,
  } = options;

  const [needType] = useState<NeedType>("bill");
  const [category, setCategory] = useState<CauseCategory>("utilities");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState<string>("");
  const [receiverName, setReceiverName] = useState(defaultName);
  const [receiverLocation, setReceiverLocation] = useState(defaultLocation);
  const [receiverEmail, setReceiverEmail] = useState(defaultEmail);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  const [uploadedProofUrl, setUploadedProofUrl] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore saved draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.category) setCategory(draft.category);
        if (typeof draft.title === "string") setTitle(draft.title);
        if (typeof draft.description === "string") setDescription(draft.description);
        if (typeof draft.goalAmount === "string") setGoalAmount(draft.goalAmount);
        if (typeof draft.receiverName === "string") setReceiverName(draft.receiverName);
        if (typeof draft.receiverLocation === "string") setReceiverLocation(draft.receiverLocation);
        if (typeof draft.receiverEmail === "string") setReceiverEmail(draft.receiverEmail);
      } else {
        if (defaultEmail && !receiverEmail) setReceiverEmail(defaultEmail);
        if (defaultName && !receiverName) setReceiverName(defaultName);
        if (defaultLocation && !receiverLocation) setReceiverLocation(defaultLocation);
      }
    } catch {}
    setDraftLoaded(true);
  }, [draftStorageKey]);

  // Autosave changes
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          category,
          title,
          description,
          goalAmount,
          receiverName,
          receiverLocation,
          receiverEmail,
        })
      );
      setAutoSaved(true);
    } catch {}
  }, [
    draftLoaded,
    draftStorageKey,
    category,
    title,
    description,
    goalAmount,
    receiverName,
    receiverLocation,
    receiverEmail,
  ]);

  const handleProofAnalysis = (result: {
    trustScore: TrustScore;
    extractedAmount?: number;
    extractedVendor?: string;
    imageBase64: string;
  }) => {
    setTrustScore(result.trustScore);
    setUploadedProofUrl(result.imageBase64);
    if (result.extractedAmount && !goalAmount) {
      setGoalAmount(result.extractedAmount.toString());
    }
    if (result.extractedVendor && !title) {
      setTitle(`${result.extractedVendor} Overdue Balance`);
    }
  };

  const submitCause = async (e?: React.FormEvent): Promise<{ success: boolean; cause?: Cause; error?: string }> => {
    if (e) e.preventDefault();

    if (!title || !goalAmount || !receiverEmail) {
      const err = "Please fill in the statement title, goal amount, and PayPal payout email.";
      alert(err);
      return { success: false, error: err };
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || "Urgent emergency statement posted for verified community relief.",
        category,
        needType,
        goalAmount: parseFloat(goalAmount),
        receiverEmail: receiverEmail.trim(),
        receiverName: receiverName.trim() || "Community Member",
        receiverLocation: receiverLocation.trim() || "United States",
        receiverId: userId || "user_guest",
        evidenceUrls: uploadedProofUrl
          ? [uploadedProofUrl]
          : ["https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80"],
        redactedProofUrl: uploadedProofUrl || undefined,
        trustScore: trustScore || undefined,
      };

      const res = await fetch("/api/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create need request");
      }

      const created: Cause = await res.json();

      // Record submitted cause ID into this browser session's list
      try {
        const existing: string[] = JSON.parse(
          localStorage.getItem("givi_my_submitted_cause_ids") || "[]"
        );
        if (!existing.includes(created.id)) {
          existing.unshift(created.id);
          localStorage.setItem("givi_my_submitted_cause_ids", JSON.stringify(existing));
        }
        localStorage.removeItem(draftStorageKey);
      } catch {}

      if (onSuccess) onSuccess(created);
      return { success: true, cause: created };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      alert(msg);
      return { success: false, error: msg };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    needType,
    category,
    setCategory,
    title,
    setTitle,
    description,
    setDescription,
    goalAmount,
    setGoalAmount,
    receiverName,
    setReceiverName,
    receiverLocation,
    setReceiverLocation,
    receiverEmail,
    setReceiverEmail,
    uploadedProofUrl,
    setUploadedProofUrl,
    trustScore,
    setTrustScore,
    handleProofAnalysis,
    submitCause,
    isSubmitting,
    autoSaved,
    draftLoaded,
  };
}

