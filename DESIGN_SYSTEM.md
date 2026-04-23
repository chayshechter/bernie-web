# BERNIE — Design System

A description of the visual language used across the BERNIE Daily web app, extracted directly from the source (Vite + React 19 + Tailwind CSS v4 + React Router 7). Use this to brief designers or generate mockups for new surfaces (e.g. a comments / community system) that feel native to the existing product.

Reference files:
- `src/index.css` — global shell
- `src/pages/Game.tsx` — route + loading / error state
- `src/components/IntroScreen.tsx` — home / pre-game
- `src/components/GameScreen.tsx` — gameplay (header, car body, result overlay)
- `src/components/ResultsScreen.tsx` — post-game results
- `src/components/LeaderboardScreen.tsx` — standalone leaderboard
- `src/components/LeaderboardModal.tsx` — modal with Daily / Weekly tabs
- `src/components/HowToPlay.tsx` — 5-slide onboarding carousel
- `src/components/HelpMenu.tsx`, `FeedbackModal.tsx`, `ComeBackTomorrow.tsx`, `CountdownTimer.tsx`, `ImageCarousel.tsx`, `PriceSlider.tsx`

---

## 1. Color Palette

The app uses a **GitHub-dark-inspired neutral scale** paired with a single **branded red** for identity and CTA, and three **semantic scoring colors** (green / orange / red). All colors are hard-coded as arbitrary-value Tailwind classes (`bg-[#…]`, `text-[#…]`). There is no Tailwind theme config file — the palette lives implicitly in the components.

### Neutral scale (backgrounds + borders + text)

| Name                    | Hex       | Used as                                                                          | Example sites                                                                                          |
| ----------------------- | --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `bg-base`               | `#0d1117` | Page background (html/body), also used as "inset" card fill                      | `src/index.css:4`, every screen's outer `<div>`, result overlay "Your Guess / Sold For" tiles          |
| `surface-1` (card)      | `#161b22` | Default card / tile / modal-row background                                       | Theme card, spec cards, Bernie Says, breakdown rows, leaderboard rows, feedback chips                  |
| `surface-2` (dim)       | `#161b22/50` | Low-rank leaderboard rows on the standalone leaderboard                       | `LeaderboardScreen.tsx:55`                                                                              |
| `border-soft`           | `#21262d` | Desktop side-rail border on `#root`                                              | `src/index.css:17`                                                                                      |
| `border-default`        | `#30363d` | Default border on inputs, cards, modals, spec tiles                              | Every input, every card                                                                                 |
| `border-hover`          | `#484f58` | Hover border on secondary buttons / help menu items                               | Feedback button, HelpMenu items                                                                         |
| `text-faint`            | `#484f58` | Placeholders, empty-state copy, tertiary meta (e.g. "Skip →", "/ 7", dates)      | Inputs' `placeholder`, `"No scores yet today"`                                                          |
| `text-muted`            | `#8b949e` | Secondary text — labels, meta, inactive tabs, rank number, captions              | "Your Score" label, "Guessed / Sold" line, inactive tab text                                            |
| `text-body`             | `#c9d1d9` | Body copy on **Bernie Says** quote only                                          | `GameScreen.tsx:164`                                                                                    |
| `text-primary`          | `#ffffff` | Primary text — headlines, score numbers, names, active states                    | Everywhere                                                                                              |
| `home-footer-subtext`   | `#b0b8c4` | Subtext inside HowToPlay slide footer                                            | `HowToPlay.tsx:148`                                                                                     |
| `home-footer-bg`        | `#131929` | Dark navy footer strip on HowToPlay slides                                       | `HowToPlay.tsx:146`                                                                                     |
| `nudge-text`            | `#555`    | "Add to home screen" mobile nudge                                                 | `ComeBackTomorrow.tsx:106`                                                                              |
| `nudge-text-hover`      | `#888`    | Nudge close button hover                                                          | `ComeBackTomorrow.tsx:111`                                                                              |
| `carousel-bg`           | `#111`    | Fallback background behind car image before it loads                              | `ImageCarousel.tsx:88, 123`                                                                             |

### Brand

| Name                   | Hex                                | Used as                                                                                  | Example sites                                                                              |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `brand-red`            | `#e63946`                          | All primary CTAs, active tabs, "Bernie Says" left border, "DAILY" wordmark, accent dot, progress dot past, BERNIE logo color in header | Play button, Share button, active tab pill, `<h1>BERNIE</h1>` subtitle "Daily" |
| `brand-red-hover`      | `#d62839`                          | Hover state for every red button                                                          | Every `.bg-[#e63946] .hover:bg-[#d62839]`                                                   |
| `brand-red/10`         | `#e63946` @ 10% alpha              | 1st-place leaderboard row tint                                                            | `ResultsScreen.tsx:341`, `LeaderboardScreen.tsx:52`                                         |
| `brand-red/15`         | `#e63946` @ 15% alpha              | "This is you" row tint                                                                    | `ResultsScreen.tsx:339`, `LeaderboardModal.tsx:148`                                          |
| `brand-red/30`         | `#e63946` @ 30% alpha              | Border on 1st-place row; background of "You" pill                                          | `ResultsScreen.tsx:341, 355`                                                                 |
| `brand-red/40`         | `#e63946` @ 40% alpha              | Border on "this is you" row                                                                | Same                                                                                         |
| `brand-red-glow`       | `rgba(230,57,70,0.3)` via box-shadow | Red glow around primary Play / Share CTA                                                  | `IntroScreen.tsx:199`, `ResultsScreen.tsx:254`                                              |

### Semantic — scoring / state

| Name              | Hex       | Meaning                                                          | Example sites                                                                                              |
| ----------------- | --------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `success-green`   | `#22c55e` | Score ≥ 80 (SO CLOSE / UNREAL / PSYCHIC); "Score saved!" status | Result overlay label + `scoreColor`/`scoreBg` tint; `ResultsScreen.tsx:218`                                 |
| `warn-orange`     | `#f97316` | Score 40–79 ("NOT BAD" / "GETTING WARM"); DEV mode badge tint    | `GameScreen.tsx:47, 207`; `IntroScreen.tsx:90`                                                              |
| `danger-red`      | `#e63946` | Score < 40 (miss); error messages; conflict nickname warning      | Reuses brand red — **error and primary CTA share the same color**; `ResultsScreen.tsx:221, 225`              |
| `urgent-orange`   | `orange-400` (Tailwind) | Timer text when ≤ 10s remaining                          | `CountdownTimer.tsx:91`                                                                                     |
| `streak-amber`    | `#f59e0b` | Streak accent — "day streak" label, streak card top border       | `ComeBackTomorrow.tsx:58, 66, 77`; `HowToPlay.tsx:133`                                                      |
| `streak-bg`       | `#1a1200` | Dark-amber fill for the streak / countdown card                   | `ComeBackTomorrow.tsx:58`                                                                                    |

### Overlays

| Name            | Value                  | Used as                                   |
| --------------- | ---------------------- | ----------------------------------------- |
| `scrim`         | `bg-black/85`          | Modal + result-overlay background scrim   |
| `scrim-blur`    | `backdrop-blur-md`     | Always paired with `bg-black/85`          |
| `img-overlay`   | `bg-black/50` → `bg-black/70` on press | Carousel prev/next button background |
| `desktop-shadow`| `0 0 80px rgba(0,0,0,0.5)` | Drop shadow on the 480px "phone" column in desktop views |

---

## 2. Typography

### Font families

- **Sans-serif (default):** inherited from Tailwind / browser default. No custom `font-sans` is declared. No `@font-face`, no `next/font`, no Google Fonts — system UI stack.
- **Monospace:** `font-mono` used for (a) numeric displays that need tabular feel — countdown `:59`, "day streak" countdown — and (b) the HowToPlay Slide 2 mock `$35,000`.
- **Emoji** is treated as a design element (🔥 👑 🏎️ 🎙️ 🔮 🎯 🌡️ 😬 💸 🚀 🏁 🟩 🟨 🟧 🟥).

### Weights in use

| Tailwind class   | Weight | Where                                                       |
| ---------------- | ------ | ----------------------------------------------------------- |
| `font-black`     | 900    | All hero numerals, `BERNIE` wordmark, result labels, streak |
| `font-bold`      | 700    | Buttons, titles, emphasized numbers                         |
| `font-semibold`  | 600    | Section eyebrows ("Daily"), small labels                    |
| `font-medium`    | 500    | Body meta (rank labels, inline text)                        |

### Sizes (actually observed, in Tailwind classes)

| Class                     | Approx px | Role                                                                          | Example                                                             |
| ------------------------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `text-8xl` (sm:)          | 96        | Score hero on Results (large viewports)                                       | `ResultsScreen.tsx:203`                                             |
| `text-7xl` / `text-[48px]`| 72 / 48   | "Your Score" hero; 🔥 streak emoji block                                       | `ResultsScreen.tsx:203`; `HowToPlay.tsx:131`                        |
| `text-6xl`                | 60        | `BERNIE` on intro (≥ sm)                                                      | `IntroScreen.tsx:103`                                               |
| `text-5xl`                | 48        | `BERNIE` on loading; result-overlay "PSYCHIC!" label; result points number    | `Game.tsx:95`; `GameScreen.tsx:224, 228`                            |
| `text-4xl`                | 36        | Played-today score; streak number; "SO CLOSE!" (HowToPlay)                     | `IntroScreen.tsx:161`; `HowToPlay.tsx:65`                           |
| `text-3xl`                | 30        | HowToPlay mock "$35,000"; streak card 🔥 emoji; countdown on no-streak state  | `HowToPlay.tsx:46`; `ComeBackTomorrow.tsx:64, 93`                   |
| `text-[28px]`             | 28        | PriceSlider input; HowToPlay "How to Play" title                              | `PriceSlider.tsx:35`; `HowToPlay.tsx:208`                           |
| `text-2xl`                | 24        | Theme name; streak countdown; score emojis row; HowToPlay "SO CLOSE!"; timer  | `IntroScreen.tsx:121`; `ComeBackTomorrow.tsx:80`; `CountdownTimer.tsx:87` |
| `text-xl`                 | 20        | Car name; modal close "✕"; theme name (base)                                  | `GameScreen.tsx:122`; `LeaderboardModal.tsx:110`                     |
| `text-lg`                 | 18        | Share button; "Sold For" values; "/ 1000"; header BERNIE wordmark in game     | `ResultsScreen.tsx:204, 254`; `GameScreen.tsx:238, 357`              |
| `text-base`               | 16        | Play / lockin / nav buttons; HowToPlay headlines                              | Many CTAs                                                           |
| `text-sm`                 | 14        | Body copy, row names, most labels                                             | Everywhere                                                           |
| `text-xs`                 | 12        | Meta copy, quit button, date, "View full leaderboard →"                        | Everywhere                                                           |
| `text-[11px]`             | 11        | Mobile add-to-home-screen tip                                                  | `ComeBackTomorrow.tsx:106`                                          |
| `text-[10px]`             | 10        | Eyebrow labels ("TODAY'S THEME", "YOUR GUESS"), DEV badge, "You" pill, "UPDATED AT" | Everywhere — the primary caps-label style                         |
| `text-[9px]`              | 9         | Smallest meta on streak card                                                   | `ComeBackTomorrow.tsx:83, 96`                                       |
| `text-[8px]`              | 8         | Spec-card eyebrow inside HowToPlay slide 1 only                                | `HowToPlay.tsx:24`                                                   |

### Signature display treatments

- **BERNIE wordmark:** `text-5xl` / `text-6xl` / `text-4xl` (context-dependent), `font-black`, `tracking-tighter`, **white**, with a tiny "DAILY" eyebrow directly below in `text-[#e63946] font-semibold tracking-widest uppercase`. Treat this as the app's logotype — never color the wordmark red.
- **Score hero:** `text-7xl sm:text-8xl font-black text-white`, followed by muted `/ 1000` in `text-lg`. The score *number* is pure white; the denominator is `text-[#8b949e]`.
- **Eyebrow labels:** `text-[#8b949e] text-[10px] uppercase tracking-widest mb-*`. This style is used dozens of times — it's the canonical "section header" pattern.
- **Result overlay hero label:** `text-4xl sm:text-5xl font-black tracking-tight` colored by score band (green/orange/red).
- **Monospace numerals** for anything with a live ticking / tabular feel: countdown (`font-mono font-black tabular-nums`), HowToPlay mock dollar input.

---

## 3. Spacing & Layout

### Shell / container

- `#root` is capped at `max-w-[480px]` centered (`src/index.css:7-12`) — the whole app is designed **mobile-first inside a phone-width column**, even on desktop.
- On ≥ `1024px`, `#root` gets a 1px `#21262d` vertical rail on each side plus a soft drop shadow (`0 0 80px rgba(0,0,0,0.5)`), producing a "phone on black" look on wide screens.
- Every screen starts with `min-h-screen bg-[#0d1117] flex flex-col items-center` (or `h-dvh` in gameplay).
- Content widths inside the shell: `max-w-sm` (~24rem) for narrow content (theme card, intro name input), `max-w-md` for modals, `max-w-lg` for leaderboard / breakdown lists, `max-w-[260px]` for the PriceSlider input.

### Spacing scale

All spacing uses Tailwind's default `0.25rem` (4px) scale. The most-used values:

- **Vertical rhythm between sections:** `mb-3`, `mb-4`, `mb-6`, `mb-8`.
- **Inside cards:** `px-4 py-3` (rows) and `px-5 py-5` or `px-6 py-4` (prominent cards).
- **Page padding:** `px-4 py-10` (results / leaderboard), `px-6` (intro — narrower horizontal feel), `px-5` (modals).
- **Gap between tiles:** `gap-2` (spec grid, price comparison), `gap-3` (row content), `gap-1` (tabs, list items).

### Border radii — conventions

| Radius         | Used for                                                                            |
| -------------- | ----------------------------------------------------------------------------------- |
| `rounded-full` | Avatars / icons (e.g. 28 × 28 "?" help button); carousel arrow buttons; progress pills |
| `rounded-lg`   | Tab pills inside intro / modal                                                      |
| `rounded-xl`   | **Default** — buttons, inputs, cards, leaderboard rows, spec tiles                  |
| `rounded-2xl`  | Larger hero cards (theme card, streak card, modal body, HelpMenu)                   |
| `rounded-3xl`  | The mid-game result overlay card                                                    |
| `rounded-r-xl` | "Bernie Says" quote (with left red border flag)                                      |
| `rounded-t-2xl sm:rounded-2xl` | Modals — bottom-sheet corners on mobile, full pill on desktop      |

### Border conventions

- Card border default: `border border-[#30363d]`.
- Selected / "me" state: `border border-[#e63946]/30` or `/40` over a `bg-[#e63946]/10` or `/15` fill.
- Primary CTA has **no border**; it's a solid `bg-[#e63946]` block.
- Secondary CTA: `bg-[#161b22] border border-[#30363d] hover:border-[#484f58]`.
- `border-l-[3px] border-l-[#e63946]` — left flag on the "Bernie Says" quote. This is the **only place a colored left-border is used** and is a signature treatment.
- Streak card uses `borderTop: '3px solid #f59e0b'` (inline style, not Tailwind).

### Shadow conventions

There are really only **two** shadows in the entire app:

1. `shadow-[0_0_30px_rgba(230,57,70,0.3)]` — a red glow around the two primary CTAs (intro Play, results Share). Use sparingly — this is the *"this is the action"* signal.
2. Root column shadow on desktop (CSS, not Tailwind): `0 0 80px rgba(0, 0, 0, 0.5)`.

No generic `shadow-md` / `shadow-lg` usage — the design relies on contrast, not elevation.

### Animation

One global keyframe, `fade-in` (0.4s ease-out, 8px upward translate), applied via `.animate-fade-in`. Used on every modal / overlay entrance. Paired with two press-feedback utilities that appear inline: `active:scale-[0.98]` (buttons) and `hover:scale-105 active:scale-95` (the intro Play CTA specifically). Progress dots and the HowToPlay pagination dots use `transition-all`.

---

## 4. Component Inventory

### 4.1 Primary button (brand CTA)

**What:** the bold red action button (Play, Share, Lock It In, Next Car).

**Canonical classes:**
```
bg-[#e63946] hover:bg-[#d62839] active:scale-[0.98]
text-white font-bold text-base uppercase tracking-wide
px-* py-3|py-4 rounded-xl transition-all
```
Variants add `shadow-[0_0_30px_rgba(230,57,70,0.3)]` to emphasize the "hero" CTAs (Play, Share My Score). The intro Play button also does `hover:scale-105 active:scale-95`.

**Disabled state:** `disabled:opacity-40` plus `disabled:hover:bg-[#e63946]` so it doesn't darken on hover.

**Used at:** `IntroScreen.tsx:199`, `ResultsScreen.tsx:254`, `GameScreen.tsx:256, 385`, `FeedbackModal.tsx:150, 219`, `HowToPlay.tsx:267`.

### 4.2 Secondary button

**What:** the ghost-on-dark button (Send Feedback, HelpMenu rows, "View full leaderboard →").

**Canonical classes:**
```
bg-[#161b22] border border-[#30363d] hover:border-[#484f58]
text-[#8b949e] hover:text-white
font-semibold text-sm py-3 rounded-xl transition-colors
```
Sometimes borderless variant for text-only nav links: `text-[#8b949e] text-xs hover:text-white`.

**Used at:** `ResultsScreen.tsx:263, 414`, `HelpMenu.tsx:68`.

### 4.3 Generic Card

**What:** a dark surface tile. Every content block uses this shape.

**Canonical classes:**
```
bg-[#161b22] border border-[#30363d] rounded-xl (or 2xl)
px-4 py-3 (rows)  |  px-6 py-4 (hero card)
```
When "inset" inside a card — e.g. the Your Guess / Sold For tiles on the result overlay — the inner tile flips to `bg-[#0d1117] rounded-xl` with no border, creating a "carved" look against the `#161b22` overlay.

**Used at:** theme card `IntroScreen.tsx:119`, played-today card `:158`, breakdown rows `ResultsScreen.tsx:282`, spec tiles, Bernie Says, etc.

### 4.4 Spec tile (car attributes)

**What:** the 3-up `Engine / Mileage / Transmission` grid shown beneath the car image.

**Structure:**
```
<div className="grid grid-cols-3 gap-2">
  <div className="bg-[#161b22] rounded-xl px-2 py-2 text-center">
    <p className="text-[#8b949e] text-[10px] uppercase tracking-wider mb-0.5">Engine</p>
    <p className="text-white text-xs font-semibold">Twin-Turbo 3.6L Flat-Six</p>
  </div>
  …
</div>
```
Eyebrow in muted 10px uppercase; value in `text-xs font-semibold` white. Note: **no border** on the inner tiles here — pure fill-only.

**Used at:** `GameScreen.tsx:128`.

### 4.5 "Bernie Says" quote block

**What:** the red-flagged quote showing the expert commentary. **Signature brand element.**

**Structure:**
```
<div className="bg-[#161b22] border-l-[3px] border-l-[#e63946] rounded-r-xl px-3 py-2">
  <p className="text-[#e63946] text-[10px] font-bold uppercase tracking-widest mb-1">
    🎙️ Bernie Says
  </p>
  <p className="text-[#c9d1d9] text-sm leading-relaxed italic">
    "{quote}"
    <button className="text-[#e63946] text-xs font-semibold ml-1 not-italic">Read more</button>
  </p>
</div>
```
Body copy is **italic and `#c9d1d9`** — the only place that exact body-text color is used. The inline "Read more" pill flips back to `not-italic` and uses brand red.

**Used at:** `GameScreen.tsx:160`.

### 4.6 Price input ("slider" — now a number field)

**What:** named `PriceSlider` for legacy reasons; today it's a big centered numeric input.

**Canonical classes:**
```
w-full text-center text-[28px] font-bold text-white
bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3
outline-none focus:border-[#e63946] transition-colors
placeholder:text-[#484f58] disabled:opacity-40
```
Formatted live as `$1,234` via `toLocaleString()`. Wrapper constrains width to `max-w-[260px]` so the input never feels wide on larger screens.

**Used at:** `PriceSlider.tsx:35` (gameplay) and mirrored visually in `HowToPlay.tsx:46`.

### 4.7 Text input (nickname / email / feedback)

**Canonical classes:**
```
bg-[#0d1117] border border-[#30363d] rounded-xl
px-4 py-2.5|3 text-white text-sm placeholder-[#484f58]
outline-none focus:border-[#e63946] transition-colors
```
Inputs flip to `#0d1117` background (one level darker than cards) — an **inverse** treatment from surface-1 cards. Focus ring is color-only: border swaps to `#e63946`. Invalid state swaps the border to `#e63946` at rest.

**Used at:** `IntroScreen.tsx:192`, `ResultsScreen.tsx:236`, `FeedbackModal.tsx:194, 207`.

### 4.8 Score badge / pill

**"You" pill:**
```
text-[10px] font-bold uppercase tracking-wider
bg-[#e63946]/30 text-[#e63946] px-1.5 py-0.5 rounded
```
**DEV pill:** same geometry but `bg-[#f97316]/20 text-[#f97316]`.

**Score chip in result-overlay hero:** `inline-flex items-baseline gap-1`, number in `text-5xl font-black`, "pts" in `text-lg font-bold opacity-60`.

### 4.9 Tab pills (Daily / Weekly)

**Canonical classes:**
```
flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
active   → bg-[#e63946] text-white
inactive → bg-[#161b22] text-[#8b949e]
```
Two tabs live inside a `flex gap-1` container. **No underline** style — selection is purely the red fill.

**Used at:** `LeaderboardModal.tsx:114`, `ResultsScreen.tsx:305`.

### 4.10 Leaderboard row

**What:** a single player row on the leaderboard. Tap-to-expand reveals the emoji grid for their 10 guesses.

**Structure:**
```
<button className="w-full flex items-center justify-between
                    px-4 py-3 rounded-xl text-left
                    <state bg / border>">
  <div className="flex items-center gap-3">
    <span className="text-[#8b949e] font-bold text-sm w-6 text-right">
      {i === 0 ? '👑' : `#${i + 1}`}
    </span>
    <span className="text-white text-sm font-medium|font-bold">{nickname}</span>
  </div>
  <div className="flex items-center gap-2">
    {isMe && <span className="…you pill…">You</span>}
    <span className="text-white font-bold text-sm">{score}</span>
  </div>
</button>
```

**State colors (in priority order):**
1. `isMe` → `bg-[#e63946]/15 border border-[#e63946]/40`
2. 1st place → `bg-[#e63946]/10 border border-[#e63946]/30`
3. default → `bg-[#161b22] border border-transparent`

Weekly rows additionally show `{daysPlayed}/7` in `text-[#8b949e] text-xs` before the score.

**Used at:** `ResultsScreen.tsx:335`, `LeaderboardModal.tsx:143`, `LeaderboardScreen.tsx:48`.

### 4.11 Result overlay (mid-game)

**What:** full-screen modal that appears after every Lock-It-In, showing the outcome for that one car.

**Structure:**
- `fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-fade-in` scrim (clickable to advance).
- Inner card: `bg-[#161b22] border border-[#30363d] rounded-3xl max-w-sm`.
- Top section: tinted band (`bg-[#22c55e]/10`, `bg-[#f97316]/10`, or `bg-[#e63946]/10` by score band) holding the hero label ("SO CLOSE! 🔥") + points chip.
- Body: 2-column grid of "Your Guess" / "Sold For" tiles on `bg-[#0d1117]`, a small diff line `"↑ $2,000 off"`, and the red primary CTA ("Next Car →" or "See Results").

**Used at:** `GameScreen.tsx:187`.

### 4.12 Score-emoji strip

Row of 10 emoji squares under the hero score. Mapping (`src/lib/scoring.ts:10`):
- `≥ 80` → 🟩
- `≥ 60` → 🟨
- `≥ 40` → 🟧
- `<  40` → 🟥

Displayed as `flex justify-center gap-1 ... text-2xl`. Also reused inline (`text-lg tracking-wider`) in expanded leaderboard rows, and concatenated into the shareable text.

### 4.13 Share card (text, not image)

There is **no rendered image share card**. "Share" copies the following plain text via `navigator.share` / clipboard (`src/lib/scoring.ts:29`):

```
🏎️ Bernie Daily — {themeName}
📅 {date}

🟩🟨🟩🟧🟥🟩🟨🟩🟩🟨

🏆 {totalScore}/1000

Can you beat me? → https://bernie-web.vercel.app
```
This is what propagates the brand virally; the "visual language" of BERNIE in external feeds is literally the 10 colored emoji squares + the 🏎️ 🏆 emojis.

### 4.14 Streak / Countdown card ("ComeBackTomorrow")

**What:** a split amber-on-near-black strip with two halves: 🔥 streak on the left, a monospace `HH:MM:SS` countdown on the right, plus a muted "Next up — {theme}" preview. When no streak, becomes a single centered countdown.

**Classes / structure (signature block):**
```
<div
  className="w-full max-w-lg rounded-2xl overflow-hidden"
  style={{ background: '#1a1200', borderTop: '3px solid #f59e0b' }}
>
  <div className="flex items-center px-4 py-5">
    <div className="flex-1 text-center">
      <div className="text-3xl">🔥</div>
      <div className="text-4xl font-black text-white">{streak}</div>
      <p className="text-[#f59e0b] text-xs">day streak</p>
    </div>
    <div className="w-px self-stretch bg-[#f59e0b]/20 mx-3" />
    <div className="flex-1 text-center">
      <p className="text-[#f59e0b] text-[9px] font-bold uppercase tracking-widest">Next game in</p>
      <p className="text-white text-2xl font-black font-mono tracking-wider">{countdown}</p>
      <p className="text-[#8b949e] text-[9px] uppercase tracking-widest">Next up — {theme}</p>
    </div>
  </div>
</div>
```
This is the only place amber / dark-amber is used as a *surface*, and one of only two uses of **inline CSS `style={{}}`** in the codebase. Reserve this palette exclusively for streak / come-back moments.

**Used at:** `ComeBackTomorrow.tsx:54`.

### 4.15 Modal shell (sheet-on-mobile, dialog-on-desktop)

**Scrim + container pattern** (reused by LeaderboardModal, HelpMenu, FeedbackModal):
```
<div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md
                flex items-end sm:items-center justify-center
                animate-fade-in">
  <div className="bg-[#0d1117] border border-[#30363d]
                  rounded-t-2xl sm:rounded-2xl
                  w-full sm:max-w-md max-h-[85dvh] flex flex-col">
    …
  </div>
</div>
```
Note: modal body background is **`#0d1117` (page color)** — not `#161b22`. Modals feel like "more page", not elevated panels. Inside cells then use `#161b22` so you keep the card-on-page contrast.

Header format: `flex items-center justify-between px-5 pt-5 pb-3` with an `h2` bold white title (`text-lg`) and a `text-[#8b949e] hover:text-white text-xl leading-none ✕` close button.

### 4.16 Progress dots (current-car indicator)

```
<div className="flex gap-1">
  {dots.map(…)}
  <div className="w-1.5 h-1.5 rounded-full
                  bg-[#e63946]    ← completed
                  bg-white        ← current
                  bg-[#30363d]    ← upcoming" />
</div>
```
**Used at:** `GameScreen.tsx:95`. A variant — `h-1.5 rounded-full bg-[#e63946] w-6` vs `bg-[#30363d] w-1.5` — is used as the HowToPlay slide-pagination indicator.

### 4.17 Help button (floating "?")

Top-right 28 × 28 circle on the intro screen:
```
w-7 h-7 rounded-full bg-[#161b22] border border-[#30363d]
text-[#8b949e] text-xs font-bold flex items-center justify-center
hover:text-white
```
**Used at:** `IntroScreen.tsx:94`.

### 4.18 Car image (ImageCarousel)

- `aspect-ratio: 16/9`, `object-fit: cover`, `background: #111`.
- Full-bleed inside the phone column (no rounded corners in gameplay) — **one of the only un-rounded elements**, intentionally reading as "photo area".
- Prev/next overlay buttons: `absolute … w-10 h-10 rounded-full bg-black/50 text-white text-xl`, pressed `bg-black/70`.
- Auto-advances every 5 s.

### 4.19 Countdown timer (gameplay header)

```
font-mono font-black text-2xl tabular-nums
revealed → text-[#484f58]
≤10s     → text-orange-400
default  → text-white
```
Renders as `:59`, `:09`, or `:--` (stopped). **Only Tailwind-keyword color** in the system (`orange-400`); everywhere else colors are hex arbitraries.

### 4.20 HowToPlay slide footer

The dark-navy strip pinned to the bottom of each onboarding slide:
```
bg-[#131929] rounded-t-xl px-6 py-5 text-center
  <p className="text-[#e63946] text-2xl font-black mb-1.5">{headline}</p>
  <p className="text-[#b0b8c4] text-sm leading-relaxed">{subtext}</p>
```
`#131929` and `#b0b8c4` appear **nowhere else** — they are onboarding-only accents. Use them if you want to echo the onboarding voice.

---

## 5. The Results Screen — Detailed Structure

File: `src/components/ResultsScreen.tsx`.

Container: `min-h-screen bg-[#0d1117] flex flex-col items-center px-4 py-10`.

Top-to-bottom, the user sees:

1. **Score hero (`mb-6`, centered).**
   - Eyebrow: `YOUR SCORE` in `text-[#8b949e] text-xs uppercase tracking-widest mb-2`.
   - Number: `text-7xl sm:text-8xl font-black text-white` (e.g. `840`).
   - Denominator: `text-[#8b949e] text-lg mt-1` → `/ 1000`.
   - Emoji strip: 10 squares from `getScoreEmoji(result.score)`, `text-2xl gap-1`, `mt-4`.

2. **Save status (`mb-4`, centered).**
   - `saving` → muted grey "Saving your score..."
   - `saved` → `text-[#22c55e]` "Score saved!"
   - `error` → red "Failed to save score."
   - `conflict` → red warning + a new nickname input + small red Save button (the same primary CTA, sized `px-6 py-3`).

3. **Primary CTA — Share (`mb-3`, full-width `max-w-lg`).**
   - Full-width red button with the red glow shadow: `🏎️ Share My Score` → `✓ Copied!` on success.
   - Uses `navigator.share` on mobile, falls back to clipboard.

4. **Secondary CTA — Send Feedback (`mb-8`, full-width).**
   - Ghost button, opens FeedbackModal.

5. **Streak / countdown card (`<ComeBackTomorrow/>`).**
   - The amber split card (§4.14). Sometimes followed by an "Add to home screen" tip on mobile.

6. **Breakdown (`mt-8 mb-8`, full-width `max-w-lg`).**
   - Eyebrow: `BREAKDOWN` centered.
   - 10 rows, each a `bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3`, two columns:
     - Left: emoji + `{year} {make} {model}` + `Guessed $X · Sold $Y` meta.
     - Right: `{score} pts` in white bold.

7. **Leaderboard block (full-width `max-w-lg`).**
   - Two tab pills (Daily / Weekly) — see §4.9.
   - List of leaderboard rows (§4.10). On Daily, tapping a row expands a single-line emoji-grid re-showing that player's 10-result pattern. On Weekly, expanding shows each day's date + emoji grid.
   - Empty states: muted text centered (e.g. "No scores yet today").
   - Below the list: `View full leaderboard →` in muted — opens `LeaderboardModal`.

8. **Full-leaderboard modal (`LeaderboardModal`, lazy — only when clicked).**
9. **FeedbackModal (lazy — only when clicked).**

The order is **deliberate "game-show" sequencing**: tell the user their score → celebrate / confirm save → give them a share path → hit them with the streak hook → only then surface analytics (breakdown + rankings).

---

## 6. Voice & Copy Tone

Voice is **casual, playful, and a little cocky** — like a friend who's been obsessing over car auctions. Heavy use of emoji and ALL-CAPS bravado on key moments. No formal explanations, no marketing speak. Short and punchy.

### Five representative strings

1. *"🏎️ Share My Score"* — primary CTA. Emoji-as-logo; no formal verb.
2. *"PSYCHIC! 🔮"* / *"WAAAAY OFF 🚀"* / *"OH NO 💸"* — `GameScreen.tsx:51-59`. ALL-CAPS, expressive, emotionally honest about both wins and losses. The elongation (WAAAAY) is intentional.
3. *"A new session drops every day at midnight"* — `IntroScreen.tsx:205`. Sneaker-drop/mixtape phrasing, not "available daily at 00:00".
4. *"Thanks — got it. I read every one."* — `FeedbackModal.tsx:148`. First-person singular, direct. The dev is speaking *as themselves*, not as a company.
5. *"No scores yet today — be the first! 🏁"* — `IntroScreen.tsx:146`. Empty states are invitations, not apologies.

### Voice characterization

- **First-person, human.** "I read every one." The author is audibly present.
- **Competitive / bragging rights.** "Can you beat me?", "Climb the leaderboard", "Don't break your streak."
- **Emoji-forward** but curated — 🔥 🏎️ 🏁 👑 🎙️ 🔮 🎯 show up repeatedly and carry meaning (streak, brand, go, rank, Bernie's voice, great score, direct hit).
- **Short imperative titles.** "Study the car.", "Name your price.", "See how close you were." Verbs, not noun-phrases.
- **Caps for emotion, never for headers.** ALL-CAPS is reserved for reaction words ("UNREAL!", "SO CLOSE!", "BIG MISS"). Section labels use small-caps style (tracking-widest uppercase 10-12px) — visually capped, but tonally quiet.
- **No jargon for auto enthusiasts.** "Guessed $35,000 · Sold $37,000" — plain English. Specs are labeled in plain words (Engine / Mileage / Transmission), not codes.

---

## 7. Visual Principles

Five principles that seem to guide the existing design, inferred from consistent patterns:

1. **One red, one dark, nothing else.** The entire identity rests on `#e63946` brand red against the `#0d1117` / `#161b22` two-step dark. Green / orange / amber only appear as *information* (score band, streak). A new feature should default to this same binary and only reach for a semantic color when it's actually communicating state.

2. **Numbers are the hero.** Whenever the user cares about a value — the score, the streak, the countdown, their guess — it's rendered enormous (`text-4xl` to `text-8xl`), `font-black`, and white. Labels shrink to `text-[10px] uppercase tracking-widest` to get out of the way.

3. **Mobile-first, capped at 480px forever.** The whole app lives in a phone-width column even on desktop. Lay out new surfaces as if there is no wider canvas — use `max-w-sm` / `max-w-lg` and stacked vertical rhythm. Never build a two-column desktop layout.

4. **Cards on page, not panels in space.** Shadows are absent. Depth comes from a three-level color contrast (`#0d1117` page → `#161b22` card → `#0d1117` inset tiles inside cards) plus `#30363d` borders. Modals drop the card color and flip *back* to `#0d1117` — so even overlays feel like a deeper view of the page, not a floating dialog.

5. **Express emotion through copy + color bands, not illustration.** There are no icons, no illustrations, no custom graphics. Feedback is carried by (a) a tinted background slab in the result overlay (green/orange/red 10%-alpha fill), (b) emoji, and (c) ALL-CAPS reaction text. If you add a new surface, reach for these same three levers before adding imagery.

**Bonus — two signature moves** worth preserving anywhere "BERNIE personality" should come through:

- The **red left-flag quote** (`border-l-[3px] border-l-[#e63946]` + italic `#c9d1d9` body + red eyebrow with 🎙️). Use it for anything "voice-of-Bernie": community highlights, pinned comments, weekly recap.
- The **amber-on-near-black streak strip** (`bg: #1a1200`, `borderTop: 3px solid #f59e0b`). This is the only warm surface in the app and is tied to retention / habit. Don't reuse it casually — reserve it for streak / come-back / habit moments.
