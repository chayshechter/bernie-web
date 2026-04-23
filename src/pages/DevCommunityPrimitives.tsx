import type { ScoreTier } from '../types/community'
import ScoreBadge from '../components/community/ScoreBadge'
import CredentialBadge from '../components/community/CredentialBadge'
import StatsStrip from '../components/community/StatsStrip'
import SectionHeader from '../components/community/SectionHeader'
import VoteBar from '../components/community/VoteBar'
import BernieSaysQuote from '../components/community/BernieSaysQuote'
import CommentCard from '../components/community/CommentCard'
import CarCard from '../components/community/CarCard'

const ALL_TIERS: ScoreTier[] = ['perfect', 'strong', 'close', 'miss', 'cold']

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-white text-sm font-bold uppercase tracking-widest mb-1">{title}</h2>
      <div className="h-px bg-default mb-4" />
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export default function DevCommunityPrimitives() {
  return (
    <div className="min-h-screen bg-base px-4 py-8">
      <header className="mb-8">
        <p className="text-brand text-[10px] font-bold uppercase tracking-widest mb-1">Dev Preview</p>
        <h1 className="text-white text-2xl font-black tracking-tight">Community Primitives</h1>
        <p className="text-muted text-sm mt-1">
          Static preview of every component in{' '}
          <code className="text-body">src/components/community/</code> with default props.
        </p>
      </header>

      <Section title="ScoreBadge — all tiers">
        <div className="flex flex-wrap gap-2">
          {ALL_TIERS.map((tier) => (
            <ScoreBadge key={tier} tier={tier} />
          ))}
        </div>
      </Section>

      <Section title="CredentialBadge">
        <CredentialBadge />
        <CredentialBadge username="sheffdog" scoreTier="perfect" streak={9} />
        <CredentialBadge username="fancylamp" scoreTier="miss" streak={0} />
      </Section>

      <Section title="StatsStrip">
        <StatsStrip />
        <StatsStrip yourGuess={42000} soldFor={41500} points={99} />
        <StatsStrip yourGuess={20000} soldFor={55000} points={36} />
      </Section>

      <Section title="SectionHeader">
        <SectionHeader />
        <SectionHeader label="GARAGE" count={12} />
        <SectionHeader label="DISCUSSION" rightText="24 replies" />
      </Section>

      <Section title="VoteBar — pre-vote">
        <VoteBar userVote={null} />
      </Section>

      <Section title="VoteBar — post-vote (would)">
        <VoteBar userVote="would" wouldPct={72} wouldntPct={28} totalVotes={1340} />
      </Section>

      <Section title="VoteBar — post-vote (wouldn't)">
        <VoteBar userVote="wouldnt" wouldPct={34} wouldntPct={66} totalVotes={876} />
      </Section>

      <Section title="BernieSaysQuote">
        <BernieSaysQuote />
        <BernieSaysQuote
          body="Long quote variant — imagine this running past the clip length so the Read more affordance actually matters."
          onReadMore={() => {}}
        />
      </Section>

      <Section title="CommentCard — default">
        <CommentCard />
      </Section>

      <Section title="CommentCard — liked + multiple replies">
        <CommentCard liked likeCount={12} replyCount={4} />
      </Section>

      <Section title="CommentCard — isSelf (red left-flag)">
        <CommentCard
          isSelf
          username="you"
          scoreTier="perfect"
          streak={14}
          body="This is how your own comment renders — the red flag carries the Bernie voice styling over to self."
        />
      </Section>

      <Section title="CommentCard — read-only (canInteract=false)">
        <CommentCard canInteract={false} />
      </Section>

      <Section title="CarCard — default">
        <CarCard />
      </Section>

      <Section title="CarCard — no comments yet">
        <CarCard commentCount={0} topComment={null} />
      </Section>
    </div>
  )
}
