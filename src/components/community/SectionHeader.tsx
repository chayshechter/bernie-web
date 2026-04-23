interface SectionHeaderProps {
  label?: string
  count?: number
  rightText?: string
}

export default function SectionHeader({
  label = "TODAY'S SET",
  count,
  rightText,
}: SectionHeaderProps) {
  const right = rightText ?? (typeof count === 'number' ? String(count) : null)

  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-muted text-[10px] uppercase tracking-widest font-semibold">
        {label}
      </p>
      {right !== null && (
        <p className="text-faint text-[10px] uppercase tracking-widest">{right}</p>
      )}
    </div>
  )
}
