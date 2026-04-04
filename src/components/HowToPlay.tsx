import { useState } from 'react'

interface HowToPlayProps {
  onClose: () => void
}

function Slide1() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
        {/* Car image placeholder */}
        <div className="w-full max-w-xs bg-[#161b22] rounded-xl h-32 flex items-center justify-center">
          <span className="text-5xl">🚗</span>
        </div>
        {/* Title */}
        <p className="text-white font-bold text-xl">2011 BMW 1M</p>
        {/* Spec badges */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
          <div className="bg-[#161b22] rounded-lg px-2 py-2 text-center">
            <p className="text-[#8b949e] text-[9px] uppercase tracking-wider">Engine</p>
            <p className="text-white text-[11px] font-semibold">3.0L I6</p>
          </div>
          <div className="bg-[#161b22] rounded-lg px-2 py-2 text-center">
            <p className="text-[#8b949e] text-[9px] uppercase tracking-wider">Mileage</p>
            <p className="text-white text-[11px] font-semibold">24,300</p>
          </div>
          <div className="bg-[#161b22] rounded-lg px-2 py-2 text-center">
            <p className="text-[#8b949e] text-[9px] uppercase tracking-wider">Transmission</p>
            <p className="text-white text-[11px] font-semibold">Manual</p>
          </div>
        </div>
        {/* Doug Says */}
        <div className="w-full max-w-xs bg-[#161b22] border-l-[3px] border-l-[#e63946] rounded-r-lg px-3 py-2">
          <p className="text-[#e63946] text-[9px] font-bold uppercase tracking-widest mb-0.5">🎙️ Doug Says</p>
          <p className="text-[#c9d1d9] text-xs italic leading-relaxed">
            "The BMW 1M is incredibly rare, with less than 1,000 units sold in North America."
          </p>
        </div>
      </div>
      <div className="px-8 pb-4 text-center">
        <p className="text-[#e63946] text-4xl font-black">1</p>
        <p className="text-white text-xl font-bold">Study the car</p>
        <p className="text-[#8b949e] text-sm mt-1">Check the specs and read Doug's take before you guess.</p>
      </div>
    </div>
  )
}

function Slide2() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        {/* Price */}
        <p className="text-white text-4xl font-black">$37,000</p>
        {/* Sliders */}
        <div className="w-full max-w-xs space-y-2.5">
          {[
            { label: 'Millions', value: 0, pct: 0 },
            { label: 'Hundred Thousands', value: 0, pct: 0 },
            { label: 'Ten Thousands', value: 3, pct: 33 },
            { label: 'Thousands', value: 7, pct: 78 },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-[#8b949e] text-[10px] w-24 text-right shrink-0">{s.label}</span>
              <div className="flex-1 h-1.5 bg-[#21262d] rounded-full relative">
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#e63946] shadow-[0_0_8px_rgba(230,57,70,0.4)]"
                  style={{ left: `calc(${s.pct}% - 10px)` }}
                />
              </div>
              <span className="text-white font-bold text-xs w-4 text-center">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-8 pb-4 text-center">
        <p className="text-[#e63946] text-4xl font-black">2</p>
        <p className="text-white text-xl font-bold">Set your price</p>
        <p className="text-[#8b949e] text-sm mt-1">Use the 4 sliders to dial in your guess. Millions → Thousands.</p>
      </div>
    </div>
  )
}

function Slide3() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
        {/* Header mockup */}
        <div className="w-full max-w-xs flex items-center justify-between px-3 py-2 bg-[#161b22] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e] text-[10px]">1/10</span>
            <span className="text-[#8b949e] text-[10px]">x QUIT</span>
          </div>
          <span className="text-[#e63946] font-black text-sm">BERNIE</span>
          <span className="text-white font-mono font-black text-xl">:47</span>
        </div>
        {/* Hint */}
        <p className="text-[#8b949e] text-xs text-center">Tap when you're ready — or the clock decides for you</p>
        {/* Lock in button mockup */}
        <div className="w-full max-w-xs bg-[#e63946] text-white font-bold text-base uppercase tracking-wide py-3.5 rounded-xl text-center">
          Lock It In
        </div>
      </div>
      <div className="px-8 pb-4 text-center">
        <p className="text-[#e63946] text-4xl font-black">3</p>
        <p className="text-white text-xl font-bold">Beat the clock</p>
        <p className="text-[#8b949e] text-sm mt-1">You have 60 seconds per car. Lock in early for a calmer guess.</p>
      </div>
    </div>
  )
}

function Slide4() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
        {/* Result card mockup */}
        <div className="w-full max-w-xs bg-[#161b22] border border-[#30363d] rounded-2xl p-5 text-center space-y-3">
          <p className="text-[#22c55e] text-xl font-black">SO CLOSE! 🔥</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0d1117] rounded-lg px-2 py-2">
              <p className="text-[#8b949e] text-[9px] uppercase">Your Guess</p>
              <p className="text-white text-sm font-bold">$35,000</p>
            </div>
            <div className="bg-[#0d1117] rounded-lg px-2 py-2">
              <p className="text-[#8b949e] text-[9px] uppercase">Sold For</p>
              <p className="text-white text-sm font-bold">$37,000</p>
            </div>
          </div>
          <p className="text-white text-2xl font-black">94 pts</p>
        </div>
        {/* Mini leaderboard */}
        <div className="w-full max-w-xs space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#e63946]/10 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs">👑</span>
              <span className="text-white text-xs font-medium">Cooper</span>
            </div>
            <span className="text-white text-xs font-bold">923</span>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#e63946]/15 border border-[#e63946]/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[#8b949e] text-xs font-bold">#2</span>
              <span className="text-white text-xs font-bold">You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-[#e63946]/30 text-[#e63946] px-1 py-0.5 rounded">You</span>
              <span className="text-white text-xs font-bold">847</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[#8b949e] text-xs font-bold">#3</span>
              <span className="text-white text-xs font-medium">Dror</span>
            </div>
            <span className="text-white text-xs font-bold">581</span>
          </div>
        </div>
      </div>
      <div className="px-8 pb-4 text-center">
        <p className="text-[#e63946] text-4xl font-black">4</p>
        <p className="text-white text-xl font-bold">Score & climb</p>
        <p className="text-[#8b949e] text-sm mt-1">The closer your guess, the higher your score. One shot per day.</p>
      </div>
    </div>
  )
}

const SLIDES = [Slide1, Slide2, Slide3, Slide4]

export default function HowToPlay({ onClose }: HowToPlayProps) {
  const [current, setCurrent] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  function next() {
    if (current < SLIDES.length - 1) setCurrent(current + 1)
    else onClose()
  }

  function prev() {
    if (current > 0) setCurrent(current - 1)
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
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
        <div className="flex items-center justify-between px-4 pt-4 shrink-0">
          <div className="w-8" />
          <p className="text-[#8b949e] text-xs uppercase tracking-widest font-semibold">How to Play</p>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white text-xl w-8 h-8 flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Slide */}
        <div
          className="flex-1 min-h-0"
          onClick={next}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <SlideComponent />
        </div>

        {/* Navigation */}
        <div className="px-6 pb-8 shrink-0">
          {current < SLIDES.length - 1 ? (
            <div className="flex justify-center gap-2">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? 'bg-white w-6' : 'bg-[#30363d]'
                  }`}
                />
              ))}
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
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
