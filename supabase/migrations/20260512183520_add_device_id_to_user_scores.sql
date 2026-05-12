-- =========================================================================
-- Add device_id to user_scores
-- =========================================================================
-- Stamps an anonymous, client-generated UUID on each score row so that
-- play history can later be linked back to a user account at sign-up.
-- Nullable to preserve existing rows.
-- =========================================================================

alter table public.user_scores
  add column if not exists device_id uuid;

create index if not exists user_scores_device_id_idx
  on public.user_scores (device_id)
  where device_id is not null;
