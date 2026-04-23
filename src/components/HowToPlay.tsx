import { useState, useEffect } from 'react'

interface HowToPlayProps {
  onClose: () => void
}

function Slide1() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <img
          src="https://hnglhenkacpriovyvhuu.supabase.co/storage/v1/object/public/car-images/listings/bat-1996-porsche-911-turbo-203-0.jpeg"
          alt="1996 Porsche 911 Turbo"
          className="w-full rounded-xl object-cover aspect-[16/10] mb-3"
        />
        <p className="text-white font-bold text-base mb-2">1996 Porsche 911 Turbo</p>
        <div className="flex gap-2 w-full">
          {[
            { label: 'Engine', value: 'Twin-Turbo 3.6L Flat-Six' },
            { label: 'Mileage', value: '67k Miles' },
            { label: 'Transmission', value: '6-Speed Manual' },
          ].map((s) => (
            <div key={s.label} className="flex-1 bg-[#161b22] rounded-lg px-2 py-2 text-center">
              <p className="text-[#8b949e] text-[8px] uppercase tracking-wider">{s.label}</p>
              <p className="text-white text-[10px] font-semibold leading-tight mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
      <SlideFooter
        headline="Study the car"
        subtext="Specs, mileage, and Bernie's take. 60 seconds on the clock."
      />
    </>
  )
}

function Slide2() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-xs space-y-3">
          <div className="w-full bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-4 text-center">
            <p className="text-[#484f58] text-[10px] uppercase tracking-widest mb-1">Your Guess</p>
            <p className="text-white text-3xl font-black font-mono">$35,000</p>
          </div>
          <div className="w-full bg-[#e63946] text-white font-bold text-base uppercase tracking-wide py-3.5 rounded-xl text-center">
            Lock It In
          </div>
        </div>
      </div>
      <SlideFooter
        headline="Name your price"
        subtext="Type what you think it sold for. One shot — make it count."
      />
    </>
  )
}

function Slide3() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-xs space-y-3">
          <p className="text-[#22c55e] text-2xl font-black text-center">SO CLOSE! 🔥</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#161b22] rounded-xl px-3 py-3 text-center">
              <p className="text-[#8b949e] text-[9px] uppercase tracking-wider">Your Guess</p>
              <p className="text-white text-lg font-bold mt-0.5">$35,000</p>
            </div>
            <div className="bg-[#161b22] rounded-xl px-3 py-3 text-center">
              <p className="text-[#8b949e] text-[9px] uppercase tracking-wider">Sold For</p>
              <p className="text-white text-lg font-bold mt-0.5">$37,000</p>
            </div>
          </div>
          <p className="text-white text-3xl font-black text-center">94 pts</p>
        </div>
      </div>
      <SlideFooter
        headline="See how close you were"
        subtext="The tighter the guess, the more points you earn."
      />
    </>
  )
}

function Slide4() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-xs space-y-1">
          <div className="flex items-center justify-between px-4 py-3 bg-[#e63946]/10 border border-[#e63946]/30 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm">👑</span>
              <span className="text-white text-sm font-medium">Sheffdog</span>
            </div>
            <span className="text-white text-sm font-bold">840 pts</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-[#8b949e] text-sm font-bold">#2</span>
              <span className="text-white text-sm font-medium">fancylamp</span>
            </div>
            <span className="text-white text-sm font-bold">804 pts</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[#e63946]/15 border border-[#e63946]/40 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-[#8b949e] text-sm font-bold">#3</span>
              <span className="text-white text-sm font-bold">You</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e63946]/30 text-[#e63946] px-1.5 py-0.5 rounded">You</span>
              <span className="text-white text-sm font-bold">588 pts</span>
            </div>
          </div>
        </div>
      </div>
      <SlideFooter
        headline="Climb the leaderboard"
        subtext="Every day has its own ranking. Where do you stack up?"
      />
    </>
  )
}

function Slide5() {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="text-center">
          <div className="text-7xl mb-2">🔥</div>
          <p className="text-4xl font-black text-white">3</p>
          <p className="text-[#f59e0b] text-sm font-semibold mt-1">day streak</p>
        </div>
      </div>
      <SlideFooter
        headline="One game a day"
        subtext="New cars, new theme, every midnight. Don't break your streak."
      />
    </>
  )
}

function SlideFooter({ headline, subtext }: { headline: string; subtext: string }) {
  return (
    <div className="bg-[#131929] rounded-t-xl px-6 py-5 text-center shrink-0">
      <p className="text-[#e63946] text-2xl font-black mb-1.5">{headline}</p>
      <p className="text-[#b0b8c4] text-sm leading-relaxed">{subtext}</p>
    </div>
  )
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5]

export default function HowToPlay({ onClose }: HowToPlayProps) {
  const [current, setCurrent] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 2000)
    return () => clearTimeout(t)
  }, [])

  function next() {
    if (current < SLIDES.length - 1) setCurrent(current + 1)
    else onClose()
  }

  function prev() {
    if (current > 0) setCurrent(current - 1)
  }

  function goPrev() {
    setShowHint(false)
    if (current > 0) setCurrent(current - 1)
  }

  function goNext() {
    setShowHint(false)
    if (current < SLIDES.length - 1) setCurrent(current + 1)
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      setShowHint(false)
      if (diff > 0) next()
      else prev()
    }
    setTouchStart(null)
  }

  const SlideComponent = SLIDES[current]

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1117] flex flex-col">
      <div className="max-w-[480px] w-full mx-auto flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="w-10" />
          <div className="text-center">
            <p className="text-white text-[28px] font-black leading-tight">How to Play</p>
            <div className="mt-1.5 mx-auto w-12 h-0.5 bg-[#e63946] rounded-full" />
          </div>
          <p className="text-[#484f58] text-xs font-medium w-10 text-right">{current + 1} / {SLIDES.length}</p>
        </div>

        {/* Slide */}
        <div
          className="flex-1 min-h-0 flex flex-col relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <SlideComponent />
          {/* Tap zones */}
          <button
            type="button"
            aria-label="Previous card"
            onClick={goPrev}
            className="absolute inset-y-0 left-0 w-[42.5%] cursor-[w-resize] bg-transparent"
          />
          <button
            type="button"
            aria-label="Next card"
            onClick={goNext}
            className="absolute inset-y-0 right-0 w-[42.5%] cursor-[e-resize] bg-transparent"
          />
          {/* Chevron hints */}
          <div
            className={`pointer-events-none absolute inset-0 flex items-center justify-between px-6 transition-opacity duration-500 ${
              showHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-white/20 text-[48px] leading-none font-light select-none">‹</span>
            <span className="text-white/20 text-[48px] leading-none font-light select-none">›</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-8 pt-4 shrink-0 space-y-3">
          <div className="flex justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'bg-[#e63946] w-6' : 'bg-[#30363d] w-1.5'
                }`}
              />
            ))}
          </div>
          {current < SLIDES.length - 1 ? (
            <button
              onClick={onClose}
              className="text-[#484f58] text-sm w-full text-center"
            >
              Skip →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-[#e63946] hover:bg-[#d62839] text-white font-bold text-base py-4 rounded-xl transition-all"
            >
              Got it — Let's Play! 🏁
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
