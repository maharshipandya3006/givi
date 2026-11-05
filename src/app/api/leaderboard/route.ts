import { NextResponse } from "next/server";

export interface LeaderboardEntry {
  rank: number;
  id: string;
  displayName: string;
  totalDonated: number;
  causeCount: number;
  isAnonymous: boolean;
  avatarUrl?: string;
  badge: string;
  categories: string[];
}

const LEADERBOARD_SEED: LeaderboardEntry[] = [
  {
    rank: 1,
    id: "user_maya",
    displayName: "Maya Lin",
    totalDonated: 485.0,
    causeCount: 42,
    isAnonymous: false,
    badge: "🏆 Winter Guardian",
    categories: ["utilities", "medical", "community"],
  },
  {
    rank: 2,
    id: "user_elena",
    displayName: "Elena Rostova",
    totalDonated: 340.0,
    causeCount: 29,
    isAnonymous: false,
    badge: "⚡ Heat Savior",
    categories: ["utilities", "food"],
  },
  {
    rank: 3,
    id: "user_marcus",
    displayName: "Marcus Chen",
    totalDonated: 275.0,
    causeCount: 24,
    isAnonymous: false,
    badge: "💊 Rx Angel",
    categories: ["medical", "education"],
  },
  {
    rank: 4,
    id: "user_anon_1",
    displayName: "Kind Supporter",
    totalDonated: 195.0,
    causeCount: 18,
    isAnonymous: true,
    badge: "🌱 Climate Ally",
    categories: ["climate", "community"],
  },
  {
    rank: 5,
    id: "user_liam",
    displayName: "Liam Vance",
    totalDonated: 140.0,
    causeCount: 14,
    isAnonymous: false,
    badge: "🎒 STEM Sponsor",
    categories: ["education"],
  },
];

export async function GET() {
  return NextResponse.json(LEADERBOARD_SEED);
}
