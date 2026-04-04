import { useState, useEffect } from 'react'
import { formatPrice } from '../lib/scoring'

interface PriceSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  resetKey?: string | number
}

const TIERS = [
  { label: 'Millions', unit: 1_000_000 },
  { label: 'Hundred Thousands', unit: 100_000 },
  { label: 'Ten Thousands', unit: 10_000 },
  { label: 'Thousands', unit: 1_000 },
] as const

export default function PriceSlider({ value, onChange, disabled, resetKey }: PriceSliderProps) {
  const [digits, setDigits] = useState([0, 0, 0, 0])

  useEffect(() => {
    setDigits([0, 0, 0, 0])
  }, [resetKey])

  function handleChange(tierIndex: number, newDigit: number) {
    const newDigits = [...digits]
    newDigits[tierIndex] = newDigit
    setDigits(newDigits)
    const total = newDigits.reduce((sum, d, i) => sum + d * TIERS[i].unit, 0)
    onChange(total)
  }

  return (
    <div className="w-full space-y-5">
      {/* Price display */}
      <div className="text-center">
        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          {formatPrice(value)}
        </span>
      </div>

      {/* Slider rows */}
      <div className="space-y-3">
        {TIERS.map((tier, i) => (
          <div key={tier.label} className="flex items-center gap-3">
            <span className="text-[#8b949e] text-xs font-medium w-28 shrink-0 text-right">
              {tier.label}
            </span>
            <input
              type="range"
              min={0}
              max={9}
              step={1}
              value={digits[i]}
              onChange={(e) => handleChange(i, Number(e.target.value))}
              disabled={disabled}
              className="flex-1 h-1.5 appearance-none bg-[#21262d] rounded-full outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e63946] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(230,57,70,0.4)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:hover:shadow-[0_0_18px_rgba(230,57,70,0.6)]
                [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#e63946] [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_12px_rgba(230,57,70,0.4)] [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-white font-bold text-sm w-5 text-center">{digits[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
