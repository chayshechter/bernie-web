import { useState, useEffect, useCallback } from 'react'

interface ImageCarouselProps {
  images: string[]
  alt: string
  resetKey?: string | number
  current: number
  onCurrentChange: (index: number) => void
}

export default function ImageCarousel({ images, alt, resetKey, current, onCurrentChange }: ImageCarouselProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [brokenSet, setBrokenSet] = useState<Set<number>>(new Set())

  useEffect(() => {
    onCurrentChange(0)
    setBrokenSet(new Set())
  }, [resetKey])

  const validImages = images?.length ? images : []

  const handleError = useCallback((index: number) => {
    console.warn('[Bernie] Image failed to load at index', index, validImages[index])
    setBrokenSet((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }, [validImages])

  const displayIndex = brokenSet.has(current)
    ? validImages.findIndex((_, i) => !brokenSet.has(i))
    : current

  if (!validImages.length || displayIndex === -1) {
    return (
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#111' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="text-[#484f58] text-lg">No image available</span>
        </div>
      </div>
    )
  }

  const imgSrc = String(validImages[displayIndex] ?? '')

  function goTo(index: number) {
    let target = (index + validImages.length) % validImages.length
    let attempts = 0
    while (brokenSet.has(target) && attempts < validImages.length) {
      target = (target + (index > current ? 1 : -1) + validImages.length) % validImages.length
      attempts++
    }
    onCurrentChange(target)
  }

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientX)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? current + 1 : current - 1)
    }
    setTouchStart(null)
  }

  const workingCount = validImages.length - brokenSet.size

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#111', overflow: 'hidden' }}>
      <img
        src={imgSrc}
        alt={alt}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onError={() => handleError(displayIndex)}
        draggable={false}
      />

      {workingCount > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center active:bg-black/70"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center active:bg-black/70"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}
