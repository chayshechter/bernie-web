import type { ScoreTier } from '../../types/community'

interface ScoreBadgeProps {
  tier?: ScoreTier
}

interface TierStyle {
  label: string
  text: string
  bg: string
  border: string
}

const TIER_STYLES: Record<ScoreTier, TierStyle> = {
  perfect: {
    label: 'PERFECT 🎯',
    text: 'text-success',
    bg: 'bg-success/15',
    border: 'border-success/40',
  },
  strong: {
    label: 'STRONG',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
  },
  close: {
    label: 'CLOSE',
    text: 'text-warn',
    bg: 'bg-warn/10',
    border: 'border-warn/30',
  },
  miss: {
    label: 'MISS',
    text: 'text-warn',
    bg: 'bg-warn/10',
    border: 'border-warn/30',
  },
  cold: {
    label: 'COLD',
    text: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/30',
  },
}

export default function ScoreBadge({ tier = 'strong' }: ScoreBadgeProps) {
  const style = TIER_STYLES[tier]
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${style.text} ${style.bg} ${style.border}`}
    >
      {style.label}
    </span>
  )
}

export { TIER_STYLES }
