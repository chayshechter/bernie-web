import { supabase } from './supabase'
import type { ScoreTier } from '../types/community'

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

export async function voteOnCar(carId: string, vote: 'would' | 'wouldnt') {
  const userId = await requireUserId()
  const { error } = await supabase
    .from('car_votes')
    .upsert(
      { car_id: carId, user_id: userId, vote },
      { onConflict: 'car_id,user_id' }
    )
  if (error) throw error
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
