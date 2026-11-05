import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SEED_CAUSES } from "@/lib/seed-data";
import { Cause, CauseCategory } from "@/lib/types";

// In-memory runtime cache to persist new causes during demo session if DB is offline
const runtimeCauses: Cause[] = [...SEED_CAUSES];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as CauseCategory | null;
  const status = searchParams.get("status") || "active";

  try {
    // Attempt Supabase query
    let query = supabaseAdmin
      .from("causes")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (category && category !== "all" as unknown as CauseCategory) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      // Map Supabase snake_case to frontend camelCase
      const mapped = data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        needType: item.need_type,
        goalAmount: parseFloat(item.goal_amount),
        raisedAmount: parseFloat(item.raised_amount),
        receiverEmail: item.receiver_email,
        receiverName: item.receiver_name,
        receiverLocation: item.receiver_location,
        receiverId: item.receiver_id,
        status: item.status,
        evidenceUrls: item.evidence_urls || [],
        redactedProofUrl: item.redacted_proof_url,
        trustScore: item.trust_score,
        channel3Product: item.channel3_product,
        milestones: item.milestones,
        deadline: item.deadline,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return NextResponse.json(mapped);
    }
  } catch (err) {
    console.warn("Supabase query error, falling back to runtime seed causes:", err);
  }

  // Fallback to runtime seeds
  let filtered = runtimeCauses.filter((c) => (status ? c.status === status : true));
  if (category && category !== "all" as unknown as CauseCategory) {
    filtered = filtered.filter((c) => c.category === category);
  }

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      needType = "bill",
      goalAmount,
      receiverEmail,
      receiverName,
      receiverLocation = "United States",
      receiverId = "user_guest",
      evidenceUrls = [],
      redactedProofUrl,
      trustScore,
      channel3Product,
      milestones,
      deadline,
    } = body;

    if (!title || !goalAmount || !receiverEmail || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, goalAmount, receiverEmail, category" },
        { status: 400 }
      );
    }

    const newCause: Cause = {
      id: `cause-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      description: description || "",
      category,
      needType,
      goalAmount: parseFloat(goalAmount),
      raisedAmount: 0.0,
      receiverEmail,
      receiverName: receiverName || "Community Member",
      receiverLocation,
      receiverId,
      status: "active",
      evidenceUrls,
      redactedProofUrl,
      trustScore: trustScore || {
        overall: 88,
        tier: "high",
        factors: [
          { name: "Initial Verification", score: 88, status: "verified", details: "Self-certified with proof documents" },
        ],
        verifiedAt: new Date().toISOString(),
      },
      channel3Product,
      milestones,
      deadline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Attempt Supabase insert
    try {
      await supabaseAdmin.from("causes").insert([
        {
          id: newCause.id,
          title: newCause.title,
          description: newCause.description,
          category: newCause.category,
          need_type: newCause.needType,
          goal_amount: newCause.goalAmount,
          raised_amount: 0.0,
          receiver_email: newCause.receiverEmail,
          receiver_name: newCause.receiverName,
          receiver_location: newCause.receiverLocation,
          receiver_id: newCause.receiverId,
          status: "active",
          evidence_urls: newCause.evidenceUrls,
          redacted_proof_url: newCause.redactedProofUrl,
          trust_score: newCause.trustScore,
          channel3_product: newCause.channel3Product,
          milestones: newCause.milestones,
          deadline: newCause.deadline,
        },
      ]);
    } catch (dbErr) {
      console.warn("Could not write cause to Supabase, stored in runtime cache:", dbErr);
    }

    // Always maintain in runtime cache so immediate GET reflects the new cause
    runtimeCauses.unshift(newCause);

    return NextResponse.json(newCause, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
