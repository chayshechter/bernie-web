import { useState, useEffect } from 'react'

interface PriceSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  resetKey?: string | number
}

export default function PriceSlider({ onChange, disabled, resetKey }: PriceSliderProps) {
  const [rawInput, setRawInput] = useState('')

  useEffect(() => {
    setRawInput('')
  }, [resetKey])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const stripped = e.target.value.replace(/[^0-9]/g, '')
    setRawInput(stripped)
    onChange(stripped === '' ? 0 : parseInt(stripped, 10))
  }

  const displayValue = rawInput === '' ? '' : '$' + parseInt(rawInput, 10).toLocaleString()

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[260px]">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="$ your guess"
          className="w-full text-center text-[28px] font-bold text-white bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 outline-none focus:border-[#e63946] transition-colors placeholder:text-[#484f58] disabled:opacity-40"
        />
      </div>
    </div>
  )
}
