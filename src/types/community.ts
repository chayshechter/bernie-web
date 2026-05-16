export type ScoreTier = 'perfect' | 'strong' | 'close' | 'miss' | 'cold'

export interface Profile {
  id: string
  username: string
  avatarUrl: string | null
  createdAt: string
  currentStreak: number
  longestStreak: number
  gamesPlayed: number
  averageScore: number
}

export interface Comment {
  id: string
  authorId: string
  author: Profile
  carId?: string
  dailySetId?: string
  body: string
  createdAt: string
  editedAt?: string
  isDeleted: boolean
  authorScoreOnCar?: number
  authorTierOnCar?: ScoreTier
  likeCount: number
  liked: boolean
  replies?: Comment[]
}

export type ReactionKind = 'fire' | 'skull' | 'heart_eyes' | 'thinking'

export interface CarVote {
  carId: string
  // Exactly one of userId / deviceId is set (anon vs. authed player).
  userId?: string
  deviceId?: string
  vote: 'would' | 'wouldnt'
  createdAt: string
}

export interface CarReaction {
  id: string
  carId: string
  // Exactly one of userId / deviceId is set (anon vs. authed player).
  userId?: string
  deviceId?: string
  reaction: ReactionKind
  createdAt: string
}

export interface EmailReminder {
  id: string
  email: string
  deviceId?: string
  confirmed: boolean
  createdAt: string
  unsubscribedAt?: string
}

export interface DailySet {
  id: string
  date: string
  carIds: string[]
}
