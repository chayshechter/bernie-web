import { useEffect } from 'react'

export type HelpAction = 'how-to-play' | 'feedback' | 'bug'

interface HelpMenuProps {
  onClose: () => void
  onSelect: (action: HelpAction) => void
}

const ITEMS: { action: HelpAction; emoji: string; label: string; subtitle: string }[] = [
  {
    action: 'how-to-play',
    emoji: '📖',
    label: 'How to Play',
    subtitle: 'Learn the rules',
  },
  {
    action: 'feedback',
    emoji: '💬',
    label: 'Send Feedback',
    subtitle: 'Share ideas or suggestions',
  },
  {
    action: 'bug',
    emoji: '🐞',
    label: 'Report a Bug',
    subtitle: 'Something broken? Tell me.',
  },
]

export default function HelpMenu({ onClose, onSelect }: HelpMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-menu-title"
    >
      <div
        className="bg-[#0d1117] border border-[#30363d] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 id="help-menu-title" className="text-white font-bold text-lg">Help</h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 space-y-2">
          {ITEMS.map((item) => (
            <button
              key={item.action}
              onClick={() => onSelect(item.action)}
              className="w-full flex items-center gap-3 bg-[#161b22] border border-[#30363d] hover:border-[#484f58] rounded-xl px-4 py-3 text-left transition-colors"
            >
              <span className="text-2xl shrink-0" aria-hidden>{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-white font-bold text-sm">{item.label}</p>
                <p className="text-[#8b949e] text-xs">{item.subtitle}</p>
              </div>
              <span className="text-[#484f58] text-lg shrink-0" aria-hidden>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
