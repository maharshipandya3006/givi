-- ==============================================================================
-- Givi — Supabase Profiles Schema & Real-Time Sync Configuration
-- ==============================================================================

create table if not exists public.profiles (
  id text primary key, -- Clerk User ID (e.g. user_2...) or Givi Fallback Session ID
  clerk_user_id text unique,
  email text not null,
  display_name text not null default 'Kind Supporter',
  avatar_url text,
  role text not null default 'donor' check (role in ('donor', 'beneficiary', 'admin')),
  location text default 'Detroit, MI',
  wallet_balance numeric(10, 2) not null default 50.00,
  monthly_budget numeric(10, 2) not null default 50.00,
  default_swipe_amount numeric(10, 2) not null default 5.00,
  impact_radius text default 'urgent',
  is_anonymous boolean not null default false,
  interests text[] default array['utilities', 'medical', 'food']::text[],
  bookmarked_cause_ids text[] default array[]::text[],
  total_donated numeric(10, 2) not null default 0.00,
  bills_cleared integer not null default 0,
  streak_days integer not null default 0,
  payout_paypal_email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table public.profiles enable row level security;

-- Allow read access for authenticated users or service role
create policy "Allow read access to profiles"
  on public.profiles for select
  using (true);

-- Allow users to update their own profile
create policy "Allow individual profile update"
  on public.profiles for update
  using (auth.uid() = id or auth.jwt()->>'sub' = id);

-- Allow profile creation
create policy "Allow profile insert"
  on public.profiles for insert
  with check (auth.uid() = id or auth.jwt()->>'sub' = id);

-- Real-time publication broadcast
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;

