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

export interface CarVote {
  carId: string
  userId: string
  vote: 'would' | 'wouldnt'
  createdAt: string
}

export interface DailySet {
  id: string
  date: string
  carIds: string[]
}
