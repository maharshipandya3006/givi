-- ==============================================================================
-- Givi — Complete Supabase PostgreSQL Production Setup
-- Run this ONCE in Supabase SQL Editor to provision all tables & realtime
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Causes Table
CREATE TABLE IF NOT EXISTS public.causes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utilities', 'medical', 'education', 'food', 'climate', 'community')),
  need_type TEXT NOT NULL DEFAULT 'bill' CHECK (need_type IN ('bill', 'aid_supply', 'community')),
  goal_amount NUMERIC(10, 2) NOT NULL,
  raised_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  receiver_email TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_location TEXT NOT NULL,
  receiver_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'funded', 'cancelled')),
  evidence_urls TEXT[] DEFAULT '{}',
  redacted_proof_url TEXT,
  trust_score JSONB NOT NULL DEFAULT '{"overall": 85, "tier": "high", "factors": []}',
  channel3_product JSONB,
  milestones JSONB,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  cause_id TEXT NOT NULL REFERENCES public.causes(id) ON DELETE CASCADE,
  donor_id TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  paypal_order_id TEXT,
  paypal_payout_batch_id TEXT,
  paypal_payout_item_id TEXT,
  is_agentic BOOLEAN NOT NULL DEFAULT false,
  impact_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Donor Profiles Table
CREATE TABLE IF NOT EXISTS public.donor_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Supporter',
  avatar_url TEXT,
  location TEXT,
  wallet_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  monthly_budget NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  default_swipe_amount NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  impact_radius TEXT DEFAULT 'urgent',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  bookmarked_cause_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  total_donated NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  bills_cleared INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  payment_preference TEXT NOT NULL DEFAULT 'wallet' CHECK (payment_preference IN ('wallet', 'direct_paypal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Beneficiary Profiles Table
CREATE TABLE IF NOT EXISTS public.beneficiary_profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Applicant',
  avatar_url TEXT,
  phone_number TEXT,
  location TEXT,
  payout_paypal_email TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'flagged')),
  total_relief_received NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  active_bill_count INTEGER NOT NULL DEFAULT 0,
  causes_created INTEGER NOT NULL DEFAULT 0,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Agent Policies Table
CREATE TABLE IF NOT EXISTS public.agent_policies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT CHECK (category IN ('utilities', 'medical', 'education', 'food', 'climate', 'community')),
  max_amount_per_cause NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  min_trust_score INTEGER NOT NULL DEFAULT 80,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_causes_status ON public.causes(status);
CREATE INDEX IF NOT EXISTS idx_causes_category ON public.causes(category);
CREATE INDEX IF NOT EXISTS idx_donations_cause_id ON public.donations(cause_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_email ON public.donor_profiles(email);
CREATE INDEX IF NOT EXISTS idx_beneficiary_profiles_email ON public.beneficiary_profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiary_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_policies ENABLE ROW LEVEL SECURITY;

-- Transparent Public Policies
CREATE POLICY "Public causes viewable" ON public.causes FOR SELECT USING (true);
CREATE POLICY "Public causes insertable" ON public.causes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public causes updatable" ON public.causes FOR UPDATE USING (true);

CREATE POLICY "Public donations viewable" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Public donations insertable" ON public.donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Public donor profiles viewable" ON public.donor_profiles FOR SELECT USING (true);
CREATE POLICY "Public donor profiles insertable" ON public.donor_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public donor profiles updatable" ON public.donor_profiles FOR UPDATE USING (true);

CREATE POLICY "Public beneficiary profiles viewable" ON public.beneficiary_profiles FOR SELECT USING (true);
CREATE POLICY "Public beneficiary profiles insertable" ON public.beneficiary_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public beneficiary profiles updatable" ON public.beneficiary_profiles FOR UPDATE USING (true);

-- Enable Realtime Replication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'causes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.causes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'donations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'donor_profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donor_profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'beneficiary_profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beneficiary_profiles;
  END IF;
END;
$$;

