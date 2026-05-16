import { supabase } from './supabase'
import type { ScoreTier, ReactionKind } from '../types/community'

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  const id = data.user?.id
  if (!id) throw new Error('Not authenticated')
  return id
}

// v1: most engagement is anonymous, so the user may legitimately be absent.
async function getOptionalUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

const COMMENT_SELECT = `
  id,
  author_id,
  car_id,
  daily_set_id,
  parent_comment_id,
  body,
  created_at,
  edited_at,
  is_deleted,
  author_score_on_car,
  author_tier_on_car,
  author:profiles!comments_author_id_fkey (
    id, username, avatar_url, created_at,
    current_streak, longest_streak, games_played, average_score
  ),
  like_count:comment_likes(count)
`

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getCommentsForCar(carId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('car_id', carId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getCommentsForDailySet(setId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('daily_set_id', setId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export interface PostCommentInput {
  carId?: string
  dailySetId?: string
  parentCommentId?: string
  body: string
  authorScoreOnCar?: number
  authorTierOnCar?: ScoreTier
}

export async function postComment(input: PostCommentInput) {
  const userId = await requireUserId()

  const hasCar = !!input.carId
  const hasSet = !!input.dailySetId
  if (hasCar === hasSet) {
    throw new Error('postComment: provide exactly one of carId or dailySetId')
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      author_id: userId,
      car_id: input.carId ?? null,
      daily_set_id: input.dailySetId ?? null,
      parent_comment_id: input.parentCommentId ?? null,
      body: input.body,
      author_score_on_car: input.authorScoreOnCar ?? null,
      author_tier_on_car: input.authorTierOnCar ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleCommentLike(commentId: string): Promise<boolean> {
  const userId = await requireUserId()

  const { data: existing, error: lookupError } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle()
  if (lookupError) throw lookupError

  if (existing) {
    const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id)
    if (error) throw error
    return false
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: userId })
  if (error) throw error
  return true
}

// ---------------------------------------------------------------------------
// Car votes
// ---------------------------------------------------------------------------

type Vote = 'would' | 'wouldnt'

// Actor scoping: an authenticated user always wins; otherwise fall back to
// the anon device_id. We do an explicit lookup → update/insert instead of
// upsert because the uniqueness is enforced by *partial* unique indexes,
// which PostgREST's on_conflict cannot target reliably.
function actorMatch(
  carId: string,
  userId: string | null,
  deviceId?: string,
): Record<string, string> {
  if (userId) return { car_id: carId, user_id: userId }
  if (deviceId) return { car_id: carId, device_id: deviceId }
  throw new Error('Need an authenticated user or a deviceId')
}

export async function voteOnCar(
  carId: string,
  vote: Vote,
  deviceId?: string,
) {
  const userId = await getOptionalUserId()
  const match = actorMatch(carId, userId, deviceId)

  const { data: existing, error: lookupError } = await supabase
    .from('car_votes')
    .select('id')
    .match(match)
    .maybeSingle()
  if (lookupError) throw lookupError

  if (existing) {
    const { error } = await supabase
      .from('car_votes')
      .update({ vote })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('car_votes').insert({
    car_id: carId,
    user_id: userId,
    device_id: userId ? null : deviceId,
    vote,
  })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Car reactions
// ---------------------------------------------------------------------------

export async function reactOnCar(
  carId: string,
  reaction: ReactionKind,
  deviceId?: string,
) {
  const userId = await getOptionalUserId()
  const match = actorMatch(carId, userId, deviceId)

  const { data: existing, error: lookupError } = await supabase
    .from('car_reactions')
    .select('id')
    .match(match)
    .maybeSingle()
  if (lookupError) throw lookupError

  if (existing) {
    const { error } = await supabase
      .from('car_reactions')
      .update({ reaction })
      .eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('car_reactions').insert({
    car_id: carId,
    user_id: userId,
    device_id: userId ? null : deviceId,
    reaction,
  })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Combined engagement read
// ---------------------------------------------------------------------------

export interface CarEngagement {
  votes: { would: number; wouldnt: number }
  reactions: Record<ReactionKind, number>
  userVote: Vote | null
  userReaction: ReactionKind | null
}

const REACTION_KINDS: ReactionKind[] = ['fire', 'skull', 'heart_eyes', 'thinking']

// `deviceId` is optional and only used to resolve the current anon player's
// own vote/reaction; aggregate counts never depend on it. Calling
// getCarEngagement(carId) with no deviceId still returns correct totals
// (and resolves userVote/userReaction for authenticated players).
export async function getCarEngagement(
  carId: string,
  deviceId?: string,
): Promise<CarEngagement> {
  const userId = await getOptionalUserId()

  const [votesRes, reactionsRes] = await Promise.all([
    supabase.from('car_votes').select('vote, user_id, device_id').eq('car_id', carId),
    supabase
      .from('car_reactions')
      .select('reaction, user_id, device_id')
      .eq('car_id', carId),
  ])
  if (votesRes.error) throw votesRes.error
  if (reactionsRes.error) throw reactionsRes.error

  const voteRows = votesRes.data ?? []
  const reactionRows = reactionsRes.data ?? []

  const reactions = REACTION_KINDS.reduce(
    (acc, k) => ({ ...acc, [k]: 0 }),
    {} as Record<ReactionKind, number>,
  )
  for (const r of reactionRows) {
    if (r.reaction in reactions) reactions[r.reaction as ReactionKind] += 1
  }

  const isMine = (row: { user_id: string | null; device_id: string | null }) =>
    userId ? row.user_id === userId : !!deviceId && row.device_id === deviceId

  const myVote = voteRows.find(isMine)
  const myReaction = reactionRows.find(isMine)

  return {
    votes: {
      would: voteRows.filter((r) => r.vote === 'would').length,
      wouldnt: voteRows.filter((r) => r.vote === 'wouldnt').length,
    },
    reactions,
    userVote: (myVote?.vote as Vote) ?? null,
    userReaction: (myReaction?.reaction as ReactionKind) ?? null,
  }
}

// ---------------------------------------------------------------------------
// Email retention
// ---------------------------------------------------------------------------

// Re-subscribing with an already-known email is a no-op (handled gracefully
// rather than surfacing the UNIQUE violation to the user).
export async function subscribeEmail(email: string, deviceId?: string) {
  const normalized = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    throw new Error('subscribeEmail: invalid email address')
  }

  const { error } = await supabase
    .from('email_reminders')
    .insert({ email: normalized, device_id: deviceId ?? null })

  // 23505 = unique_violation → already subscribed, treat as success.
  if (error && error.code !== '23505') throw error
}

export interface CarVoteCounts {
  would: number
  wouldnt: number
  total: number
  wouldPct: number
  wouldntPct: number
}

export async function getCarVoteCounts(carId: string): Promise<CarVoteCounts> {
  const { data, error } = await supabase
    .from('car_votes')
    .select('vote')
    .eq('car_id', carId)
  if (error) throw error

  const would = data?.filter((r) => r.vote === 'would').length ?? 0
  const wouldnt = data?.filter((r) => r.vote === 'wouldnt').length ?? 0
  const total = would + wouldnt
  const wouldPct = total === 0 ? 0 : Math.round((would / total) * 100)
  const wouldntPct = total === 0 ? 0 : 100 - wouldPct
  return { would, wouldnt, total, wouldPct, wouldntPct }
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getProfile(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle()
  if (error) throw error
  return data
}

export type ProfileUpdates = Partial<{
  username: string
  avatar_url: string | null
}>

export async function updateProfile(updates: ProfileUpdates) {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle()
  if (error) throw error
  return data
}
