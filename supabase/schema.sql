-- ==============================================================================
-- Givi — Supabase PostgreSQL Database Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'receiver', 'admin')),
  default_swipe_amount NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  total_donated NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  cause_count INTEGER NOT NULL DEFAULT 0,
  categories_supported TEXT[] DEFAULT '{}',
  giving_allowance NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  agent_budget_monthly NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Causes Table
CREATE TABLE IF NOT EXISTS public.causes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 3. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cause_id UUID NOT NULL REFERENCES public.causes(id) ON DELETE CASCADE,
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

-- 4. Agent Policies Table (Agentic Commerce)
CREATE TABLE IF NOT EXISTS public.agent_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  category TEXT CHECK (category IN ('utilities', 'medical', 'education', 'food', 'climate', 'community')),
  max_amount_per_cause NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  min_trust_score INTEGER NOT NULL DEFAULT 80,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_causes_status ON public.causes(status);
CREATE INDEX IF NOT EXISTS idx_causes_category ON public.causes(category);
CREATE INDEX IF NOT EXISTS idx_donations_cause_id ON public.donations(cause_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_policies ENABLE ROW LEVEL SECURITY;

-- Public read access for causes and donations (radical transparency)
CREATE POLICY "Causes are viewable by everyone" ON public.causes FOR SELECT USING (true);
CREATE POLICY "Donations are viewable by everyone" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Authenticated modifications
CREATE POLICY "Users can insert causes" ON public.causes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "System can record donations" ON public.donations FOR INSERT WITH CHECK (true);
