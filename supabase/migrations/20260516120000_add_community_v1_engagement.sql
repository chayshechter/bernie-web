-- =========================================================================
-- BERNIE Community v1 — votes + reactions + email retention (anon-friendly)
-- =========================================================================
-- v1 scope (revised from the original community migration): no comments yet,
-- just engagement. Anonymous players engage via a client-generated device_id
-- (localStorage UUID); authenticated players via profiles.id.
--
-- The original 20260424120000_add_community_system.sql comment/like tables
-- and helper functions are intentionally left untouched — they are unused in
-- v1 but ship in v2, so this migration is purely additive there.
--
-- RLS NOTE (important tradeoff): Postgres RLS cannot read a custom
-- "device_id" request header, so for the anon write paths we deliberately
-- keep INSERT/UPDATE open at the RLS layer and lean on the partial UNIQUE
-- constraints to prevent abuse. Consequence: an attacker can spam from many
-- fresh device_ids, but cannot double-vote/react from a single device. The
-- authenticated path is still tied to auth.uid() and the ban check.
-- =========================================================================


-- -------------------------------------------------------------------------
-- 1. car_reactions  (new)
-- -------------------------------------------------------------------------
create table if not exists public.car_reactions (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  device_id uuid,                                              -- anon player
  user_id uuid references public.profiles(id) on delete cascade, -- auth player
  reaction text not null
    check (reaction in ('fire', 'skull', 'heart_eyes', 'thinking')),
  created_at timestamptz not null default now(),
  -- exactly one actor: anon device OR authed user, never both / neither
  constraint car_reactions_one_actor
    check ((device_id is not null)::int + (user_id is not null)::int = 1)
);

-- One reaction per device per car / one reaction per user per car.
-- Partial unique indexes (not table constraints) so the NULL side is ignored.
create unique index if not exists car_reactions_car_device_uidx
  on public.car_reactions (car_id, device_id)
  where device_id is not null;

create unique index if not exists car_reactions_car_user_uidx
  on public.car_reactions (car_id, user_id)
  where user_id is not null;

-- Fast aggregation of reaction counts per car.
create index if not exists car_reactions_car_id_idx
  on public.car_reactions (car_id);


-- -------------------------------------------------------------------------
-- 2. car_votes  (modify existing table for the anon path)
-- -------------------------------------------------------------------------
-- Original definition: user_id uuid NOT NULL, unique (car_id, user_id).
-- v1 makes user_id optional and adds the parallel device_id actor.
alter table public.car_votes
  add column if not exists device_id uuid;

-- user_id must be nullable for anon rows (original table had it NOT NULL).
alter table public.car_votes
  alter column user_id drop not null;

-- Drop the old whole-table unique (auto-named car_votes_car_id_user_id_key);
-- replaced below by two partial unique indexes.
alter table public.car_votes
  drop constraint if exists car_votes_car_id_user_id_key;

-- exactly one actor, same rule as car_reactions.
alter table public.car_votes
  drop constraint if exists car_votes_one_actor;
alter table public.car_votes
  add constraint car_votes_one_actor
  check ((device_id is not null)::int + (user_id is not null)::int = 1);

create unique index if not exists car_votes_car_device_uidx
  on public.car_votes (car_id, device_id)
  where device_id is not null;

create unique index if not exists car_votes_car_user_uidx
  on public.car_votes (car_id, user_id)
  where user_id is not null;


-- -------------------------------------------------------------------------
-- 3. email_reminders  (new)
-- -------------------------------------------------------------------------
create table if not exists public.email_reminders (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,                 -- app lowercases + validates
  device_id uuid,                             -- link to anon play history
  confirmed boolean not null default false,   -- reserved for double opt-in
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

-- The UNIQUE on email already provides the lookup index
-- (email_reminders_email_key); an explicit lower(email) index keeps
-- case-insensitive lookups fast even though the app normalizes on write.
create index if not exists email_reminders_email_lower_idx
  on public.email_reminders (lower(email));


-- =========================================================================
-- RLS
-- =========================================================================

-- ---- car_votes ----------------------------------------------------------
-- Recreate policies: the original ones were authenticated-only and assumed
-- a NOT NULL user_id. v1 also serves the anon device path.
alter table public.car_votes enable row level security;

drop policy if exists "car_votes_select_public" on public.car_votes;
drop policy if exists "car_votes_insert_self"   on public.car_votes;
drop policy if exists "car_votes_update_self"   on public.car_votes;

create policy "car_votes_select_public"
  on public.car_votes for select
  using (true);

-- INSERT: anon rows (device_id only) OR authed rows owned by the caller.
create policy "car_votes_insert"
  on public.car_votes for insert
  to anon, authenticated
  with check (
    (user_id is null and device_id is not null)
    or (user_id = auth.uid() and not public.is_banned(auth.uid()))
  );

-- UPDATE: same shape (changing one's vote). Anon path is open by design —
-- see the RLS NOTE at the top of this file.
create policy "car_votes_update"
  on public.car_votes for update
  to anon, authenticated
  using (
    (user_id is null and device_id is not null)
    or (user_id = auth.uid() and not public.is_banned(auth.uid()))
  )
  with check (
    (user_id is null and device_id is not null)
    or (user_id = auth.uid() and not public.is_banned(auth.uid()))
  );


-- ---- car_reactions ------------------------------------------------------
-- Same access pattern as car_votes.
alter table public.car_reactions enable row level security;

create policy "car_reactions_select_public"
  on public.car_reactions for select
  using (true);

create policy "car_reactions_insert"
  on public.car_reactions for insert
  to anon, authenticated
  with check (
    (user_id is null and device_id is not null)
    or (user_id = auth.uid() and not public.is_banned(auth.uid()))
  );

create policy "car_reactions_update"
  on public.car_reactions for update
  to anon, authenticated
  using (
    (user_id is null and device_id is not null)
    or (user_id = auth.uid() and not public.is_banned(auth.uid()))
  )
  with check (
    (user_id is null and device_id is not null)
    or (user_id = auth.uid() and not public.is_banned(auth.uid()))
  );


-- ---- email_reminders ----------------------------------------------------
alter table public.email_reminders enable row level security;

-- INSERT: open to anyone (anon signups). The UNIQUE(email) constraint stops
-- duplicate rows; the app handles the conflict gracefully.
create policy "email_reminders_insert_any"
  on public.email_reminders for insert
  to anon, authenticated
  with check (true);

-- SELECT: no policy → only service_role (which bypasses RLS) can read the
-- list. Anon/authenticated clients cannot enumerate subscribers.

-- UPDATE: row "ownership" is by device_id, which RLS cannot verify from a
-- header (see RLS NOTE). We accept the same tradeoff as votes/reactions:
-- updates (e.g. setting unsubscribed_at) are open at the RLS layer and the
-- app scopes the affected row by email/device_id in the query.
create policy "email_reminders_update_owner"
  on public.email_reminders for update
  to anon, authenticated
  using (true)
  with check (true);

-- No DELETE policy on any table here → hard deletes are service_role only.
