// ==============================================================================
// Givi — Shared Core Types & Data Models
// ==============================================================================

export type CauseCategory =
  | "utilities"
  | "medical"
  | "education"
  | "food"
  | "climate"
  | "community";

export const CAUSE_CATEGORY_OPTIONS: { id: CauseCategory; label: string }[] = [
  { id: "utilities", label: "Heat & Utilities" },
  { id: "medical", label: "Prescriptions" },
  { id: "education", label: "School & Youth" },
  { id: "food", label: "Groceries" },
  { id: "climate", label: "Emergency Supplies" },
  { id: "community", label: "Family Care" },
];

export type NeedType = "bill" | "aid_supply" | "community";

export type CauseStatus = "active" | "funded" | "cancelled";

export interface TrustScoreFactor {
  name: string;
  score: number; // 0 - 100
  status: "verified" | "flagged" | "neutral";
  details: string;
}

export interface TrustScore {
  overall: number; // 0 - 100
  tier: "high" | "medium" | "low";
  factors: TrustScoreFactor[];
  redactedProofUrl?: string;
  verifiedAt: string;
}

export interface CauseMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  requiredAmount: number;
}

export interface Channel3Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  merchant: string;
  imageUrl: string;
  productUrl: string;
  inStock: boolean;
}

export interface Cause {
  id: string;
  title: string;
  description: string;
  category: CauseCategory;
  needType: NeedType;
  goalAmount: number;
  raisedAmount: number;
  receiverEmail: string;
  receiverName: string;
  receiverLocation: string; // e.g. "Detroit, MI"
  receiverId: string;
  status: CauseStatus;
  evidenceUrls: string[];
  redactedProofUrl?: string;
  trustScore: TrustScore;
  channel3Product?: Channel3Product;
  milestones?: CauseMilestone[];
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  causeId: string;
  donorId: string;
  donorName: string;
  amount: number;
  paypalOrderId?: string;
  paypalPayoutBatchId?: string;
  paypalPayoutItemId?: string;
  settlementStatus?: "PENDING" | "SETTLED" | "FAILED";
  settledAt?: string;
  failureReason?: string;
  isAgentic: boolean;
  impactMessage: string;
  createdAt: string;
}

export interface DonorProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  location?: string | null;
  walletBalance: number;
  monthlyBudget: number;
  defaultSwipeAmount: number;
  impactRadius: "urgent" | "local" | "national" | "global";
  isAnonymous: boolean;
  interests: CauseCategory[];
  bookmarkedCauseIds: string[];
  totalDonated: number;
  billsCleared: number;
  streakDays: number;
  onboarded: boolean;
  paymentPreference: "wallet" | "direct_paypal";
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  payoutPaypalEmail?: string | null;
  verificationStatus: "pending" | "verified" | "flagged";
  totalReliefReceived: number;
  activeBillCount: number;
  causesCreated: number;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: "donor" | "receiver" | "admin";
  defaultSwipeAmount: number; // e.g. 5
  isAnonymous: boolean;
  totalDonated: number;
  causeCount: number;
  categoriesSupported: CauseCategory[];
  givingAllowance: number; // Current session test allowance balance
  agentBudgetMonthly?: number;
  agentRules?: AgentPolicyRule[];
  createdAt: string;
}

export interface AgentPolicyRule {
  id: string;
  category?: CauseCategory;
  maxAmountPerCause: number;
  minTrustScore: number;
  enabled: boolean;
}

export interface ImpactToastData {
  id: string;
  message: string;
  amount: number;
  causeTitle: string;
  category: CauseCategory;
  paypalPayoutBatchId?: string;
  receiverEmail?: string;
}

export interface TransparencyRecord {
  id: string;
  timestamp: string;
  causeId: string;
  causeTitle: string;
  category: CauseCategory;
  donorName: string;
  donorId?: string;
  amount: number;
  paypalPayoutBatchId: string;
  paypalPayoutItemId?: string;
  settlementStatus?: "PENDING" | "SETTLED" | "FAILED";
  settledAt?: string;
  receiverLocation: string;
  receiverEmail?: string;
  receiverName?: string;
  trustScore: number;
  isAgentic: boolean;
}

export function createDefaultDonorProfile(id: string = "guest-session", email: string = "supporter@givi.app", name: string = "Kind Supporter") {
  return {
    id,
    email,
    display_name: name,
    avatar_url: null,
    role: "donor",
    location: null,
    wallet_balance: 0.0,
    monthly_budget: 0.0,
    default_swipe_amount: 5.0,
    impact_radius: "urgent",
    is_anonymous: false,
    interests: [] as CauseCategory[],
    bookmarked_cause_ids: [] as string[],
    total_donated: 0.0,
    bills_cleared: 0,
    streak_days: 0,
    onboarded: false,
    payment_preference: "wallet",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function createDefaultBeneficiaryProfile(id: string = "guest-session", email: string = "receiver@givi.app", name: string = "Applicant") {
  return {
    id,
    email,
    display_name: name,
    avatar_url: null,
    role: "beneficiary",
    location: null,
    phone_number: null,
    payout_paypal_email: email,
    verification_status: "pending",
    total_relief_received: 0.0,
    active_bill_count: 0,
    causes_created: 0,
    onboarded: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getGiverBadge(totalDonated: number): string {
  if (totalDonated >= 500) return "Level 5 Guardian";
  if (totalDonated >= 200) return "Level 3 Giver · Heat Guardian";
  if (totalDonated >= 50) return "Level 2 Supporter";
  return "Level 1 Neighbor";
}


