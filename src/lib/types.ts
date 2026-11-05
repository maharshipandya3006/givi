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
  isAgentic: boolean;
  impactMessage: string;
  createdAt: string;
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
}

export interface TransparencyRecord {
  id: string;
  timestamp: string;
  causeId: string;
  causeTitle: string;
  category: CauseCategory;
  donorName: string;
  amount: number;
  paypalPayoutBatchId: string;
  receiverLocation: string;
  trustScore: number;
  isAgentic: boolean;
}

