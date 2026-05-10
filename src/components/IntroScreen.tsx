import { useState } from 'react'
import type { DailySet } from '../lib/types'
import { DEV_MODE } from '../lib/devmode'
import { getPuzzleNumber, formatIssueDate } from '../lib/date'
import LeaderboardModal from './LeaderboardModal'
import HowToPlay from './HowToPlay'
import ComeBackTomorrow from './ComeBackTomorrow'
import FeedbackModal from './FeedbackModal'
import HelpMenu from './HelpMenu'
import type { HelpAction } from './HelpMenu'

interface IntroScreenProps {
  session: DailySet
  streak: number
  onStart: (nickname: string) => void
  onViewLeaderboard: () => void
}

function getPlayedToday(sessionDate: string): { nickname: string; score: number } | null {
  try {
    const raw = localStorage.getItem('bernie_played')
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.date === sessionDate) return data
  } catch {}
  return null
}

export default function IntroScreen({ session, onStart }: IntroScreenProps) {
  const [nickname, setNickname] = useState(() => {
    try { return localStorage.getItem('bernie_nickname') || '' } catch { return '' }
  })
  const [showModal, setShowModal] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion'>('suggestion')
  const hasSeenHowTo = (() => {
    try { return !!localStorage.getItem('bernie_seen_howtoplay') } catch { return true }
  })()

  const played = DEV_MODE ? null : getPlayedToday(session.date)
  const issueNumber = String(getPuzzleNumber(session.date)).padStart(3, '0')
  const issueDate = formatIssueDate(session.date)

  function handlePlay() {
    if (!nickname.trim()) return
    if (!hasSeenHowTo) {
      setShowHowTo(true)
      return
    }
    startGame()
  }

  function startGame() {
    const name = DEV_MODE ? `DEV_${nickname.trim()}` : nickname.trim()
    if (!DEV_MODE) {
      try { localStorage.setItem('bernie_nickname', nickname.trim()) } catch {}
    }
    onStart(name)
  }

  const ctaShadow = '0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 24px -10px rgba(230,57,70,0.6)'

  return (
    <>
      <div className="min-h-dvh bg-[#0d1117] flex flex-col justify-between px-6 pt-4 sm:pt-10 pb-4 sm:pb-6 relative">
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {DEV_MODE && (
            <span className="text-[10px] font-mono font-bold bg-[#f97316]/20 text-[#f97316] px-2 py-0.5 rounded">
              DEV
            </span>
          )}
          <button
            onClick={() => setShowHelpMenu(true)}
            className="w-7 h-7 rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] text-xs font-bold flex items-center justify-center hover:text-white transition-colors"
            aria-label="Help menu"
          >
            ?
          </button>
        </div>

        {/* TOP GROUP */}
        <div>
          <div className="flex justify-between items-center font-mono text-[10.5px] font-medium tracking-[0.16em] text-[#7a818d] border-b border-white/[0.06] pb-3 pr-10">
            <span>NO. {issueNumber}</span>
            <span>{issueDate}</span>
          </div>

          <h1
            className={`mt-5 sm:mt-7 font-display text-center text-white leading-[0.85] tracking-[-0.02em] ${
              played ? 'text-[44px]' : 'text-[56px]'
            }`}
          >
            BERNIE
          </h1>

          {played ? (
            <>
              <div className="mt-6 sm:mt-9 text-center">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#7a818d] mb-3.5">
                  ALREADY PLAYED — {session.theme_name.toUpperCase()}
                </p>
                <p className="font-display text-white text-[108px] leading-[0.85] tracking-[-0.05em]">
                  {played.score}
                </p>
                <p className="mt-1.5 font-mono text-[13px] tracking-[0.14em] text-[#535862]">
                  OUT OF 1000
                </p>
              </div>

              <div className="mt-7">
                <ComeBackTomorrow />
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-6 sm:mt-9 text-center text-white text-[32px] font-extrabold leading-[1.12] tracking-[-0.02em] text-balance">
                Guess the price.<br />10 cars. Every day.
              </h2>

              <div className="mt-5 sm:mt-7 flex flex-col items-center gap-2.5">
                <span className="text-[10px] font-bold tracking-[0.22em] text-[#7a818d]">
                  TODAY'S SET
                </span>
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-[10px] bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.55)]">
                  <span className="w-2 h-2 bg-[#f59e0b] rounded-[2px]" />
                  <span className="font-display text-base text-white tracking-[0.04em]">
                    {session.theme_name}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* BOTTOM GROUP */}
        {played ? (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-[#e63946] hover:bg-[#d62839] text-white font-bold text-[17px] tracking-[0.01em] py-[18px] rounded-[14px] transition-colors"
            style={{ boxShadow: ctaShadow }}
          >
            View leaderboard
          </button>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#7a818d] mb-2.5">
                YOUR NAME
              </p>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full bg-transparent border border-white/[0.06] rounded-xl px-[18px] py-4 text-white text-base placeholder-[#535862] outline-none focus:border-[#e63946]/60 transition-colors"
              />
            </div>

            <button
              onClick={handlePlay}
              disabled={!nickname.trim()}
              className="w-full bg-[#e63946] hover:bg-[#d62839] disabled:opacity-40 disabled:hover:bg-[#e63946] text-white font-bold text-[17px] tracking-[0.01em] py-[18px] rounded-[14px] transition-colors"
              style={{ boxShadow: ctaShadow }}
            >
              Play today's session
            </button>

            <p className="text-center text-xs text-[#535862]">
              New set every day at midnight
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <LeaderboardModal
          onClose={() => setShowModal(false)}
          currentNickname={played?.nickname}
          currentScore={played?.score}
        />
      )}

      {showHowTo && (
        <HowToPlay onClose={() => {
          setShowHowTo(false)
          try { localStorage.setItem('bernie_seen_howtoplay', '1') } catch {}
          if (!hasSeenHowTo && nickname.trim()) {
            startGame()
          }
        }} />
      )}

      {showHelpMenu && (
        <HelpMenu
          onClose={() => setShowHelpMenu(false)}
          onSelect={(action: HelpAction) => {
            setShowHelpMenu(false)
            if (action === 'how-to-play') {
              setShowHowTo(true)
            } else {
              setFeedbackCategory(action === 'bug' ? 'bug' : 'suggestion')
              setShowFeedback(true)
            }
          }}
        />
      )}

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        initialCategory={feedbackCategory}
      />
    </>
  )
}
