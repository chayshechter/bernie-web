-- =========================================================================
-- BERNIE Community System
-- =========================================================================
-- Adds profiles, daily_sets, comments, comment_likes, car_votes,
-- comment_reports. Extends user_scores with user_id and daily_set_id.
-- Installs helper functions (today_eastern, get_todays_set_id,
-- is_todays_car, has_played_daily_set) and a profile-stats trigger.
-- All new tables have RLS enabled. Existing user_scores RLS is unchanged.
-- =========================================================================


-- -------------------------------------------------------------------------
-- 1. profiles
-- -------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique
    check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_url text,
  created_at timestamptz not null default now(),
  current_streak int not null default 0,
  longest_streak int not null default 0,
  games_played int not null default 0,
  average_score numeric not null default 0,
  is_banned boolean not null default false
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));


-- -------------------------------------------------------------------------
-- 2. daily_sets  (renamed from daily_sessions — one source of truth)
-- -------------------------------------------------------------------------
-- Existing table carries: id, date (unique), theme_name, car_ids, season_name.
-- Keep those columns as-is. Community code references daily_sets.date,
-- daily_sets.id, and daily_sets.car_ids — no column renames.
alter table public.daily_sessions rename to daily_sets;

-- Defensive: ensure created_at exists (older rows may predate this column).
alter table public.daily_sets
  add column if not exists created_at timestamptz not null default now();

-- Shape guard for car_ids. NOT VALID so existing rows are not re-checked;
-- they may have been inserted manually via the SQL editor and could fail.
-- New rows must be arrays. Run ALTER ... VALIDATE CONSTRAINT after auditing.
alter table public.daily_sets
  add constraint daily_sets_car_ids_is_array
  check (jsonb_typeof(car_ids) = 'array') not valid;

-- date already has a UNIQUE constraint → unique index auto-created.


-- -------------------------------------------------------------------------
-- 3. user_scores  (extend existing table; keep backward compatibility)
-- -------------------------------------------------------------------------
alter table public.user_scores
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists daily_set_id uuid references public.daily_sets(id) on delete set null;

create index if not exists user_scores_user_id_created_at_idx
  on public.user_scores (user_id, created_at desc);

create index if not exists user_scores_session_date_idx
  on public.user_scores (session_date);

create index if not exists user_scores_daily_set_id_idx
  on public.user_scores (daily_set_id);


-- -------------------------------------------------------------------------
-- 4. comments
-- -------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  car_id uuid references public.cars(id) on delete cascade,
  daily_set_id uuid references public.daily_sets(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  is_deleted boolean not null default false,
  author_score_on_car int,
  author_tier_on_car text check (
    author_tier_on_car is null
    or author_tier_on_car in ('perfect', 'strong', 'close', 'miss', 'cold')
  ),
  constraint comments_exactly_one_target
    check ((car_id is not null)::int + (daily_set_id is not null)::int = 1)
);

create index if not exists comments_car_id_created_at_idx
  on public.comments (car_id, created_at desc) where car_id is not null;

create index if not exists comments_daily_set_id_created_at_idx
  on public.comments (daily_set_id, created_at desc) where daily_set_id is not null;

create index if not exists comments_author_id_created_at_idx
  on public.comments (author_id, created_at desc);

create index if not exists comments_parent_comment_id_idx
  on public.comments (parent_comment_id) where parent_comment_id is not null;


-- -------------------------------------------------------------------------
-- 5. comment_likes
-- -------------------------------------------------------------------------
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists comment_likes_comment_id_idx
  on public.comment_likes (comment_id);


-- -------------------------------------------------------------------------
-- 6. car_votes
-- -------------------------------------------------------------------------
create table if not exists public.car_votes (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote text not null check (vote in ('would', 'wouldnt')),
  created_at timestamptz not null default now(),
  unique (car_id, user_id)
);

create index if not exists car_votes_car_id_idx
  on public.car_votes (car_id);


-- -------------------------------------------------------------------------
-- 7. comment_reports
-- -------------------------------------------------------------------------
create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  resolved boolean not null default false
);


-- =========================================================================
-- FUNCTIONS
-- =========================================================================

-- Eastern-time "today" so community gating matches the game's daily boundary.
create or replace function public.today_eastern()
returns date
language sql
stable
set search_path = public
as $$
  select (now() at time zone 'America/New_York')::date;
$$;


create or replace function public.get_todays_set_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select id from public.daily_sets where date = public.today_eastern() limit 1;
$$;


create or replace function public.is_todays_car(car_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.daily_sets
    where date = public.today_eastern()
      and car_ids ? car_uuid::text
  );
$$;


-- Called from RLS policies. SECURITY DEFINER so it can read user_scores
-- regardless of any future RLS on that table.
create or replace function public.has_played_daily_set(user_uuid uuid, set_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_scores
    where user_id = user_uuid and daily_set_id = set_uuid
  );
$$;


-- Ban check for write policies. Returns false for a missing profile (not banned).
create or replace function public.is_banned(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_banned from public.profiles where id = user_uuid),
    false
  );
$$;


-- =========================================================================
-- RLS: profiles
-- =========================================================================
alter table public.profiles enable row level security;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- =========================================================================
-- RLS: daily_sets
-- =========================================================================
alter table public.daily_sets enable row level security;

create policy "daily_sets_select_public"
  on public.daily_sets for select
  using (true);
-- No insert/update/delete policies → service_role only.


-- =========================================================================
-- RLS: comments
-- =========================================================================
alter table public.comments enable row level security;

-- SELECT: authenticated + not deleted + (not today's content OR played today)
create policy "comments_select_authed_with_gate"
  on public.comments for select
  to authenticated
  using (
    not is_deleted
    and (
      (car_id is not null and not public.is_todays_car(car_id))
      or (daily_set_id is not null and daily_set_id <> public.get_todays_set_id())
      or public.has_played_daily_set(auth.uid(), public.get_todays_set_id())
    )
  );

-- INSERT: author is self AND (not today's content OR played today) AND not banned
create policy "comments_insert_authed_with_gate"
  on public.comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and not public.is_banned(auth.uid())
    and (
      (car_id is not null and not public.is_todays_car(car_id))
      or (daily_set_id is not null and daily_set_id <> public.get_todays_set_id())
      or public.has_played_daily_set(auth.uid(), public.get_todays_set_id())
    )
  );

-- UPDATE (body edit): author-only, within 15 minutes of created_at, not banned.
create policy "comments_update_edit_window"
  on public.comments for update
  to authenticated
  using (
    author_id = auth.uid()
    and not public.is_banned(auth.uid())
    and created_at > now() - interval '15 minutes'
  )
  with check (author_id = auth.uid());

-- UPDATE (soft delete): author-only, any time, but resulting row must be marked deleted.
-- Since UPDATE policies OR together, this permits soft-delete outside the edit window
-- without opening up post-window body edits. Banned users cannot soft-delete either.
create policy "comments_update_soft_delete"
  on public.comments for update
  to authenticated
  using (author_id = auth.uid() and not public.is_banned(auth.uid()))
  with check (author_id = auth.uid() and is_deleted = true);

-- No DELETE policy → hard deletes denied for all roles except service_role.


-- =========================================================================
-- RLS: comment_likes
-- =========================================================================
alter table public.comment_likes enable row level security;

create policy "comment_likes_select_public"
  on public.comment_likes for select
  using (true);

create policy "comment_likes_insert_self"
  on public.comment_likes for insert
  to authenticated
  with check (user_id = auth.uid() and not public.is_banned(auth.uid()));

create policy "comment_likes_delete_self"
  on public.comment_likes for delete
  to authenticated
  using (user_id = auth.uid());


-- =========================================================================
-- RLS: car_votes
-- =========================================================================
alter table public.car_votes enable row level security;

create policy "car_votes_select_public"
  on public.car_votes for select
  using (true);

create policy "car_votes_insert_self"
  on public.car_votes for insert
  to authenticated
  with check (user_id = auth.uid() and not public.is_banned(auth.uid()));

create policy "car_votes_update_self"
  on public.car_votes for update
  to authenticated
  using (user_id = auth.uid() and not public.is_banned(auth.uid()))
  with check (user_id = auth.uid());


-- =========================================================================
-- RLS: comment_reports
-- =========================================================================
alter table public.comment_reports enable row level security;

-- No SELECT policy → service_role only (dashboard reads).
create policy "comment_reports_insert_self"
  on public.comment_reports for insert
  to authenticated
  with check (reporter_id = auth.uid() and not public.is_banned(auth.uid()));


-- =========================================================================
-- TRIGGER: keep profile stats in sync on user_scores insert
-- =========================================================================
create or replace function public.update_profile_stats_on_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_played date;
  prev_streak int;
  new_streak int;
  this_date date;
begin
  -- Legacy anonymous rows → no profile to update.
  if new.user_id is null then
    return new;
  end if;

  this_date := new.session_date::date;

  select max(session_date::date) into last_played
  from public.user_scores
  where user_id = new.user_id and id <> new.id;

  select current_streak into prev_streak
  from public.profiles where id = new.user_id;

  if last_played is null then
    new_streak := 1;
  elsif last_played = this_date then
    new_streak := coalesce(prev_streak, 1);            -- same-day replay: no change
  elsif last_played = this_date - 1 then
    new_streak := coalesce(prev_streak, 0) + 1;         -- consecutive day
  else
    new_streak := 1;                                     -- gap → reset
  end if;

  update public.profiles
  set
    games_played = games_played + 1,
    average_score = coalesce(
      (select avg(total_score) from public.user_scores where user_id = new.user_id),
      0
    ),
    current_streak = new_streak,
    longest_streak = greatest(longest_streak, new_streak)
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists user_scores_update_profile_stats on public.user_scores;

create trigger user_scores_update_profile_stats
  after insert on public.user_scores
  for each row
  execute function public.update_profile_stats_on_score();
