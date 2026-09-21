-- Stock Pro v2.5 — Métrologie / Étalonnage
-- Date: 14 September 2026
-- Run this once in Supabase SQL Editor for the same project used by Stock Pro.

create table if not exists public.metrology (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  reference text,
  serial_number text,
  calibration_date date not null,
  calibration_duration_months integer not null default 12 check (calibration_duration_months > 0),
  expiry_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists metrology_user_id_idx on public.metrology(user_id);
create index if not exists metrology_expiry_date_idx on public.metrology(expiry_date);

alter table public.metrology enable row level security;

drop policy if exists "metrology_select_own" on public.metrology;
drop policy if exists "metrology_insert_own" on public.metrology;
drop policy if exists "metrology_update_own" on public.metrology;
drop policy if exists "metrology_delete_own" on public.metrology;

create policy "metrology_select_own" on public.metrology for select using (auth.uid() = user_id);
create policy "metrology_insert_own" on public.metrology for insert with check (auth.uid() = user_id);
create policy "metrology_update_own" on public.metrology for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "metrology_delete_own" on public.metrology for delete using (auth.uid() = user_id);
