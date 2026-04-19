-- Feedback table: in-app feedback / bug reports submitted via the anon key.
-- RLS: anon can INSERT only. No public SELECT / UPDATE / DELETE.
-- Read feedback from the Supabase dashboard (service_role bypasses RLS).

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null check (category in ('bug', 'suggestion', 'car_data', 'other')),
  message text not null check (char_length(message) between 1 and 2000),
  email text,
  player_name text,
  app_version text,
  platform text,
  context jsonb
);

alter table public.feedback enable row level security;

-- Only policy: allow inserts from the anon role. No select/update/delete policies
-- means RLS blocks those operations for anon (and authenticated).
create policy "anon can insert feedback"
  on public.feedback
  for insert
  to anon
  with check (true);
