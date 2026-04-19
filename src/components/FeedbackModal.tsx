import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

declare const __APP_VERSION__: string

type Category = 'bug' | 'suggestion' | 'car_data' | 'other'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  context?: Record<string, unknown>
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'car_data', label: 'Car Data' },
  { value: 'other', label: 'Other' },
]

const MAX_MESSAGE = 2000
const FEEDBACK_EMAIL = 'hayshe123@gmail.com'
const MAILTO_HREF = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('BERNIE Feedback')}&body=`

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getStoredPlayerName(): string | null {
  try {
    const nickname = localStorage.getItem('bernie_nickname')
    if (nickname && nickname.trim()) return nickname.trim()
    const played = localStorage.getItem('bernie_played')
    if (played) {
      const data = JSON.parse(played)
      if (data?.nickname) return String(data.nickname)
    }
  } catch {}
  return null
}

function getAppVersion(): string {
  const envVersion = import.meta.env.VITE_APP_VERSION
  if (typeof envVersion === 'string' && envVersion) return envVersion
  try {
    return __APP_VERSION__
  } catch {
    return 'unknown'
  }
}

export default function FeedbackModal({ isOpen, onClose, context }: FeedbackModalProps) {
  const [category, setCategory] = useState<Category>('suggestion')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setCategory('suggestion')
      setMessage('')
      setEmail('')
      setSubmitting(false)
      setSubmitted(false)
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const trimmedMessage = message.trim()
  const trimmedEmail = email.trim()
  const emailInvalid = trimmedEmail.length > 0 && !isValidEmail(trimmedEmail)
  const canSubmit =
    trimmedMessage.length > 0 &&
    trimmedMessage.length <= MAX_MESSAGE &&
    !emailInvalid &&
    !submitting

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const playerName = getStoredPlayerName()
    const { error: insertError } = await supabase.from('feedback').insert({
      category,
      message: trimmedMessage,
      email: trimmedEmail || null,
      player_name: playerName,
      app_version: getAppVersion(),
      platform: 'web',
      context: context ?? null,
    })

    setSubmitting(false)
    if (insertError) {
      setError("Couldn't send — try again, or use the email link below.")
      return
    }
    setSubmitted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="bg-[#0d1117] border border-[#30363d] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 id="feedback-modal-title" className="text-white font-bold text-lg">
            {submitted ? 'Thanks!' : 'Send Feedback'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="px-5 pb-6 flex flex-col items-center text-center gap-4">
            <p className="text-white text-sm">Thanks — got it. I read every one.</p>
            <button
              onClick={onClose}
              className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold text-sm px-8 py-3 rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            <div>
              <p className="text-[#8b949e] text-[10px] uppercase tracking-widest mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        active
                          ? 'bg-[#e63946] border-[#e63946] text-white'
                          : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#8b949e] text-[10px] uppercase tracking-widest">Message</p>
                <p className="text-[#484f58] text-[10px]">
                  {trimmedMessage.length}/{MAX_MESSAGE}
                </p>
              </div>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                placeholder="What's on your mind?"
                rows={5}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white text-sm placeholder-[#484f58] outline-none focus:border-[#e63946] transition-colors resize-none"
              />
            </div>

            <div>
              <p className="text-[#8b949e] text-[10px] uppercase tracking-widest mb-2">
                Email <span className="text-[#484f58] normal-case tracking-normal">(optional)</span>
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-[#0d1117] border rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#484f58] outline-none transition-colors ${
                  emailInvalid ? 'border-[#e63946]' : 'border-[#30363d] focus:border-[#e63946]'
                }`}
              />
              {emailInvalid && (
                <p className="text-[#e63946] text-xs mt-1">Enter a valid email or leave blank.</p>
              )}
            </div>

            {error && <p className="text-[#e63946] text-xs">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full bg-[#e63946] hover:bg-[#d62839] disabled:opacity-40 disabled:hover:bg-[#e63946] text-white font-bold text-sm px-8 py-3 rounded-xl transition-all"
            >
              {submitting ? 'Sending...' : 'Send'}
            </button>

            <div className="text-center pt-1">
              <a
                href={MAILTO_HREF}
                className="text-[#8b949e] text-xs hover:text-white transition-colors"
              >
                Or email me directly
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
