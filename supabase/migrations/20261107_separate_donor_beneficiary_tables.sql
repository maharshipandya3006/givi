-- ==============================================================================
-- Givi — Separate Donor & Beneficiary Data Architecture
-- Migration: 20261107_separate_donor_beneficiary_tables.sql
-- ==============================================================================

-- 1. DONOR PROFILES TABLE
-- Dedicated database table tracking giving allowances, interests, and impact
create table if not exists public.donor_profiles (
  id text primary key, -- Clerk User ID (user_...)
  email text not null,
  display_name text not null default 'Supporter',
  avatar_url text,
  location text,
  wallet_balance numeric(10, 2) not null default 0.00,
  monthly_budget numeric(10, 2) not null default 0.00,
  default_swipe_amount numeric(10, 2) not null default 5.00,
  impact_radius text default 'urgent',
  is_anonymous boolean not null default false,
  interests text[] default array[]::text[],
  bookmarked_cause_ids text[] default array[]::text[],
  total_donated numeric(10, 2) not null default 0.00,
  bills_cleared integer not null default 0,
  streak_days integer not null default 0,
  onboarded boolean not null default false,
  payment_preference text not null default 'wallet' check (payment_preference in ('wallet', 'direct_paypal')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BENEFICIARY PROFILES TABLE
-- Dedicated database table tracking payout recipients, verified bills, and relief history
create table if not exists public.beneficiary_profiles (
  id text primary key, -- Clerk User ID (user_...)
  email text not null,
  display_name text not null default 'Applicant',
  avatar_url text,
  phone_number text,
  location text,
  payout_paypal_email text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'flagged')),
  total_relief_received numeric(10, 2) not null default 0.00,
  active_bill_count integer not null default 0,
  causes_created integer not null default 0,
  onboarded boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.donor_profiles enable row level security;
alter table public.beneficiary_profiles enable row level security;

-- Donor Policies
create policy "Allow read access to donor_profiles"
  on public.donor_profiles for select
  using (true);

create policy "Allow update to donor_profiles"
  on public.donor_profiles for update
  using (auth.uid() = id or auth.jwt()->>'sub' = id);

create policy "Allow insert to donor_profiles"
  on public.donor_profiles for insert
  with check (auth.uid() = id or auth.jwt()->>'sub' = id);

-- Beneficiary Policies
create policy "Allow read access to beneficiary_profiles"
  on public.beneficiary_profiles for select
  using (true);

create policy "Allow update to beneficiary_profiles"
  on public.beneficiary_profiles for update
  using (auth.uid() = id or auth.jwt()->>'sub' = id);

create policy "Allow insert to beneficiary_profiles"
  on public.beneficiary_profiles for insert
  with check (auth.uid() = id or auth.jwt()->>'sub' = id);

-- 4. REAL-TIME PUBLICATION SUBSCRIPTIONS
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'donor_profiles'
  ) then
    alter publication supabase_realtime add table public.donor_profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'beneficiary_profiles'
  ) then
    alter publication supabase_realtime add table public.beneficiary_profiles;
  end if;
end;
$$;

