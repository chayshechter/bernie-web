export interface Car {
  id: string
  make: string
  model: string
  year: number
  final_price: string
  images: string[] | string | null
  hero_image_url: string | null
  specs: {
    Engine?: string
    Mileage?: string
    Transmission?: string
  } | null
  dougs_take: string | null
}

export interface DailySession {
  id: string
  date: string
  theme_name: string
  car_ids: string[]
  season_name: string | null
}

export interface GuessResult {
  car_id: string
  guess: number
  actual: number
  score: number
}

export interface UserScore {
  id: string
  session_date: string
  nickname: string
  guesses: GuessResult[]
  total_score: number
  created_at: string
}
