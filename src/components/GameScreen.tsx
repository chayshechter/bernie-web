import { useState, useEffect, useRef, useCallback, memo } from 'react'
import type { Car, GuessResult } from '../lib/types'
import { calculateScore, formatPrice, parseSoldPrice } from '../lib/scoring'
import ImageCarousel from './ImageCarousel'
import PriceSlider from './PriceSlider'
import CountdownTimer, { type CountdownTimerHandle } from './CountdownTimer'
import { Analytics } from '../lib/analytics'

interface GameScreenProps {
  cars: Car[]
  themeName: string
  onComplete: (results: GuessResult[]) => void
  onQuit: () => void
}

function parseImages(raw: string[] | string | null): string[] {
  const parsed = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? JSON.parse(raw)
      : []
  return (parsed as string[]).filter((url) => url && url.trim() !== '')
}

function buildImageList(car: Car): string[] {
  const imgs: string[] = []
  // Hero image first (Supabase Storage — reliable on mobile)
  if (car.hero_image_url && car.hero_image_url.trim() !== '') {
    imgs.push(car.hero_image_url)
  }
  // Append remaining images from the images array
  const extra = parseImages(car.images)
  for (const url of extra) {
    if (url !== car.hero_image_url) imgs.push(url)
  }
  return imgs
}

const DOUG_LIMIT = 180

function getPrice(car: Car): number {
  return parseSoldPrice(car.final_price)
}

function getResultLabel(score: number): { text: string; color: string } {
  const color =
    score >= 80 ? 'text-[#22c55e]' :
    score >= 40 ? 'text-[#f97316]' :
    'text-[#e63946]'

  if (score === 100) return { text: 'PSYCHIC! 🔮', color }
  if (score >= 95) return { text: 'UNREAL! 🎯', color }
  if (score >= 80) return { text: 'SO CLOSE! 🔥', color }
  if (score >= 65) return { text: 'NICE EYE! 👀', color }
  if (score >= 50) return { text: 'NOT BAD! 😏', color }
  if (score >= 35) return { text: 'GETTING WARM 🌡️', color }
  if (score >= 20) return { text: 'BIG MISS 😬', color }
  if (score >= 10) return { text: 'OH NO 💸', color }
  return { text: 'WAAAAY OFF 🚀', color }
}

// Memoized car body — will NOT re-render on timer ticks
const CarBody = memo(function CarBody({
  car,
  imageList,
  imageIndex,
  onImageChange,
  currentIndex,
  totalCars,
  guess,
  onGuessChange,
  disabled,
}: {
  car: Car
  imageList: string[]
  imageIndex: number
  onImageChange: (i: number) => void
  currentIndex: number
  totalCars: number
  guess: number
  onGuessChange: (v: number) => void
  disabled: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const specs = car.specs
  const hasSpecs = specs?.Engine || specs?.Mileage || specs?.Transmission

  useEffect(() => { setExpanded(false) }, [currentIndex])

  return (
    <>
      {/* Sub-header: prompt + car progress dots */}
      <div className="flex items-center justify-center gap-3 pb-1 px-4">
        <span className="text-[#8b949e] text-xs">What did it sell for?</span>
        <div className="flex gap-1">
          {Array.from({ length: totalCars }, (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < currentIndex
                  ? 'bg-[#e63946]'
                  : i === currentIndex
                    ? 'bg-white'
                    : 'bg-[#30363d]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Car image with overlaid arrows */}
      <ImageCarousel
        images={imageList}
        alt={`${car.year} ${car.make} ${car.model}`}
        resetKey={currentIndex}
        current={imageIndex}
        onCurrentChange={onImageChange}
      />

      {/* Car content */}
      <div className="flex flex-col px-3 pt-2 gap-2">
        <h2 className="text-xl font-bold text-white text-center">
          {car.year} {car.make} {car.model}
        </h2>

        {/* Spec cards */}
        {hasSpecs && (
          <div className="grid grid-cols-3 gap-2">
            {specs?.Engine && (
              <div className="bg-[#161b22] rounded-xl px-2 py-2 text-center">
                <p className="text-[#8b949e] text-[10px] uppercase tracking-wider mb-0.5">Engine</p>
                <p className="text-white text-xs font-semibold">{specs.Engine}</p>
              </div>
            )}
            {specs?.Mileage && (
              <div className="bg-[#161b22] rounded-xl px-2 py-2 text-center">
                <p className="text-[#8b949e] text-[10px] uppercase tracking-wider mb-0.5">Mileage</p>
                <p className="text-white text-xs font-semibold">{specs.Mileage}</p>
              </div>
            )}
            {specs?.Transmission && (
              <div className="bg-[#161b22] rounded-xl px-2 py-2 text-center">
                <p className="text-[#8b949e] text-[10px] uppercase tracking-wider mb-0.5">Transmission</p>
                <p className="text-white text-xs font-semibold">{specs.Transmission}</p>
              </div>
            )}
          </div>
        )}

        {/* Doug's Take */}
        {car.dougs_take && (() => {
          const isLong = car.dougs_take.length > DOUG_LIMIT
          const displayText = expanded || !isLong
            ? car.dougs_take
            : car.dougs_take.slice(0, DOUG_LIMIT) + '...'
          return (
            <div className="bg-[#161b22] border-l-[3px] border-l-[#e63946] rounded-r-xl px-3 py-2">
              <p className="text-[#e63946] text-[10px] font-bold uppercase tracking-widest mb-1">
                🎙️ Doug Says
              </p>
              <p className="text-[#c9d1d9] text-sm leading-relaxed italic">
                "{displayText}"
                {isLong && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-[#e63946] text-xs font-semibold ml-1 not-italic"
                  >
                    {expanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </p>
            </div>
          )
        })()}

        {/* Price + sliders */}
        <PriceSlider value={guess} onChange={onGuessChange} disabled={disabled} resetKey={currentIndex} />
      </div>
    </>
  )
})

// Result overlay component
function ResultOverlay({
  guess,
  price,
  score,
  isLast,
  onNext,
}: {
  guess: number
  price: number
  score: number
  isLast: boolean
  onNext: () => void
}) {
  const label = getResultLabel(score)
  const diff = guess - price
  const diffAbs = Math.abs(diff)
  const diffDirection = diff > 0 ? '↑' : diff < 0 ? '↓' : ''
  const scoreColor =
    score >= 80 ? 'text-[#22c55e]' :
    score >= 40 ? 'text-[#f97316]' :
    'text-[#e63946]'
  const scoreBg =
    score >= 80 ? 'bg-[#22c55e]/10' :
    score >= 40 ? 'bg-[#f97316]/10' :
    'bg-[#e63946]/10'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center px-5 animate-fade-in"
      onClick={onNext}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-3xl max-w-sm w-full text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero label */}
        <div className={`${scoreBg} px-6 pt-8 pb-6`}>
          <p className={`text-4xl sm:text-5xl font-black tracking-tight ${label.color}`}>
            {label.text}
          </p>
          <div className={`inline-flex items-baseline gap-1 mt-3 ${scoreColor}`}>
            <span className="text-5xl font-black">{score}</span>
            <span className="text-lg font-bold opacity-60">pts</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-4">
          {/* Price comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1117] rounded-xl px-3 py-3">
              <p className="text-[#8b949e] text-[10px] uppercase tracking-wider mb-1">Your Guess</p>
              <p className="text-white text-lg font-bold">{formatPrice(guess)}</p>
            </div>
            <div className="bg-[#0d1117] rounded-xl px-3 py-3">
              <p className="text-[#8b949e] text-[10px] uppercase tracking-wider mb-1">Sold For</p>
              <p className="text-white text-lg font-bold">{formatPrice(price)}</p>
            </div>
          </div>

          {/* Diff line */}
          {diffAbs > 0 && (
            <p className="text-[#484f58] text-xs">
              {diffDirection} {formatPrice(diffAbs)} off
            </p>
          )}

          {/* CTA */}
          <button
            onClick={onNext}
            className="w-full bg-[#e63946] hover:bg-[#d62839] active:scale-[0.98] text-white font-bold text-base uppercase tracking-wide py-4 rounded-xl transition-all"
          >
            {isLast ? 'See Results' : 'Next Car →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GameScreen({ cars, themeName, onComplete, onQuit }: GameScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [guess, setGuess] = useState(0)
  const [results, setResults] = useState<GuessResult[]>([])
  const [revealed, setRevealed] = useState(false)
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [imageIndex, setImageIndex] = useState(0)
  const timerRef = useRef<CountdownTimerHandle>(null)
  const lockedInRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Track game start on mount
  const didTrackStart = useRef(false)
  if (!didTrackStart.current) {
    didTrackStart.current = true
    Analytics.gameStarted(themeName)
  }

  const car = cars[currentIndex]
  const price = getPrice(car)
  const imageList = buildImageList(car)
  const isLast = currentIndex + 1 >= cars.length

  const advanceToNext = useCallback((newResults: GuessResult[]) => {
    if (currentIndex + 1 < cars.length) {
      setCurrentIndex(currentIndex + 1)
      setGuess(0)
      setRevealed(false)
      setCurrentScore(null)
      setImageIndex(0)
      lockedInRef.current = false
      timerRef.current?.reset()
      scrollRef.current?.scrollTo(0, 0)
    } else {
      onComplete(newResults)
    }
  }, [currentIndex, cars.length, onComplete])

  const handleLockIn = useCallback(() => {
    if (lockedInRef.current) return
    lockedInRef.current = true

    const timeLeft = timerRef.current?.getTimeLeft() ?? 0
    timerRef.current?.stop()

    const score = calculateScore(guess, price)
    Analytics.carLockedIn(currentIndex, score, timeLeft)
    setCurrentScore(score)
    setRevealed(true)

    const result: GuessResult = {
      car_id: car.id,
      guess,
      actual: price,
      score,
    }

    const newResults = [...results, result]
    setResults(newResults)
  }, [guess, price, car.id, results])

  const handleOverlayNext = useCallback(() => {
    const latestResults = [...results]
    // Results already includes the current one from handleLockIn
    advanceToNext(latestResults)
  }, [results, advanceToNext])

  const handleLockInClick = useCallback(() => {
    handleLockIn()
  }, [handleLockIn])

  const handleTimerExpire = useCallback(() => {
    handleLockIn()
  }, [handleLockIn])

  return (
    <div ref={scrollRef} className="h-dvh bg-[#0d1117] flex flex-col overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[#8b949e] text-xs font-medium">
            {currentIndex + 1}/{cars.length}
          </span>
          <button
            onClick={() => { Analytics.gameQuit(currentIndex, themeName); onQuit() }}
            className="text-[#8b949e] text-xs font-medium hover:text-white transition-colors"
          >
            x QUIT
          </button>
        </div>
        <span className="text-[#e63946] font-black text-lg tracking-tight">
          BERNIE
        </span>
        <CountdownTimer
          key={currentIndex}
          ref={timerRef}
          onExpire={handleTimerExpire}
          revealed={revealed}
        />
      </div>

      {/* Memoized car body */}
      <CarBody
        car={car}
        imageList={imageList}
        imageIndex={imageIndex}
        onImageChange={setImageIndex}
        currentIndex={currentIndex}
        totalCars={cars.length}
        guess={guess}
        onGuessChange={setGuess}
        disabled={revealed}
      />

      {/* Lock in button */}
      {!revealed && (
        <div className="px-4 py-2 shrink-0">
          <button
            onClick={handleLockInClick}
            className="w-full bg-[#e63946] hover:bg-[#d62839] active:scale-[0.98] text-white font-bold text-base uppercase tracking-wide py-3 rounded-xl transition-all"
          >
            Lock It In
          </button>
        </div>
      )}

      {/* Result overlay */}
      {revealed && currentScore !== null && (
        <ResultOverlay
          guess={guess}
          price={price}
          score={currentScore}
          isLast={isLast}
          onNext={handleOverlayNext}
        />
      )}
    </div>
  )
}
