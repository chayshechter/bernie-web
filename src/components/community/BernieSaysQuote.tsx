interface BernieSaysQuoteProps {
  eyebrow?: string
  body?: string
  onReadMore?: () => void
}

export default function BernieSaysQuote({
  eyebrow = '🎙️ Bernie Says',
  body = 'Clean example of a low-mileage garage queen — rare color, documented service, and the kind of spec sheet auction buyers love. Watch the reserve.',
  onReadMore,
}: BernieSaysQuoteProps) {
  return (
    <div className="bg-surface-1 border-l-[3px] border-l-brand rounded-r-xl px-3 py-2">
      <p className="text-brand text-[10px] font-bold uppercase tracking-widest mb-1">
        {eyebrow}
      </p>
      <p className="text-body text-sm leading-relaxed italic">
        &ldquo;{body}&rdquo;
        {onReadMore && (
          <button
            onClick={onReadMore}
            className="text-brand text-xs font-semibold ml-1 not-italic"
          >
            Read more
          </button>
        )}
      </p>
    </div>
  )
}
