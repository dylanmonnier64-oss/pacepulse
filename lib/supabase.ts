import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

// Public client — used in client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service-role client — used in API routes only (server-side)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })
}

// ── SQL migration (run once in Supabase SQL editor) ──────────────
// Copy-paste this into your Supabase project → SQL Editor → Run
/*
create table if not exists health_logs (
  id uuid default gen_random_uuid() primary key,
  user_profile text not null default 'dydz',
  date date not null,
  steps integer,
  heart_rate_avg integer,
  exercise_done boolean default false,
  exercise_duration integer,
  sleep_hours integer,
  sleep_minutes integer,
  ai_analysis jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_profile, date)
);

create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_profile text not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_profile)
);

alter table health_logs enable row level security;
alter table push_subscriptions enable row level security;
create policy "anon_all_health" on health_logs for all using (true) with check (true);
create policy "anon_all_push" on push_subscriptions for all using (true) with check (true);
*/
