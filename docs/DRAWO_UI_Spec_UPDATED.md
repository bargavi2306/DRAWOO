🎨  DRAWO
Draw. Guess. Win.
Complete UI Screen Specification
For team handoff · AI agent reference · Implementation phases

| Attribute | Value |
| --- | --- |
| Document type | UI specification — no backend logic |
| Target | Frontend team + AI coding agent |
| Screens | 13 primary + 11 supporting states |
| Aesthetic | Pastel claymorphism / soft 3D |
| Public mode | 8 real humans · 3 rounds · 60 s · Medium · no lobby · temp bot |
| Private mode | 2–15 players · configurable rules · host-controlled |
| Phase order | Design system → Home → Private → Public → Gameplay → Results → End → Edge cases |

# Table of Contents

# 0. Design System Foundation
Every screen in DRAWO must feel immediately recognisable. Establish these tokens before coding any screen.

## 0.1 Colour Palette

| Token | Hex — Usage |
| --- | --- |
| lavender | #7C6FCD — primary brand, headings, CTAs |
| lavendLt | #EDE9FF — card backgrounds, subtle fills |
| pink | #E879A0 — accents, correct-guess states |
| pinkLt | #FFE4EF — secondary highlights |
| peach | #F4956A — warnings, host badges, sub-headings |
| peachLt | #FFF0E8 — warm panel backgrounds |
| cream | #FFF8F0 — global body background |
| mint | #5BB89A — success states, score gains |
| mintLt | #E4F7F1 — toast backgrounds |
| yellow | #F5C842 — timer urgency, crown icons |
| yellowLt | #FFFAE6 — bonus score rows |
| slate | #3D3A5C — body text, labels |
| grayMid | #888699 — secondary text, placeholders |
| grayLt | #F2F0FF — alternating table rows |
| red | #E84040 — errors, kick states |

## 0.2 Typography

| Role | Size / Weight / Colour |
| --- | --- |
| Display (DRAWO logo) | 48–72 px · 900 · lavender |
| H1 (screen title) | 32 px · 700 · lavender |
| H2 (section) | 24 px · 700 · slate |
| H3 (sub-section) | 20 px · 600 · peach |
| Body | 16 px · 400 · slate |
| Caption / label | 13 px · 500 · grayMid |
| Code / monospace | 14 px · 400 · slate · Courier New |
| Button | 16 px · 700 · white (primary) / slate (ghost) |
| Timer (urgent < 10 s) | 24 px · 900 · red · pulsing |

## 0.3 Spacing Scale
Use an 8 px base grid: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
Card padding: 24 px desktop · 16 px mobile. Section gaps: 48 px desktop · 32 px mobile.

## 0.4 Component Tokens

| Component | Specification |
| --- | --- |
| Card border-radius | 20 px desktop · 16 px mobile |
| Button border-radius | 999 px (pill) |
| Input border-radius | 12 px |
| Card shadow | 0 8px 32px rgba(124,111,205,0.18) — soft lavender clay shadow |
| Button shadow (primary) | 0 4px 16px rgba(124,111,205,0.35) |
| Button shadow (hover) | 0 6px 24px rgba(124,111,205,0.50) |
| Hover scale | transform: scale(1.03) — 150 ms ease |
| Touch target minimum | 44 × 44 px (WCAG / iOS HIG) |
| Animation duration | 150–250 ms — never exceed 400 ms for in-game transitions |
| Canvas border | 3 px solid lavendLt with 16 px radius |

## 0.5 Avatar System
12 built-in clay/chibi avatars. Each has a neutral and a "guessed!" variant.
Emoji placeholders during prototype: 🐱 🐶 🐰 🐻 🐼 🦊 🐸 🐵 🐨 🐯 🐷 🦁
ℹ  Replace emoji with actual SVG clay avatars in production. Keep the same 12 IDs so backend avatar index maps correctly.

## 0.6 Component Inventory
Shared components used across screens — build these first in Phase UI-01:
Logo — wordmark + tagline lockup
Avatar — size variants: xs (24 px) / sm (40 px) / md (64 px) / lg (96 px)
PlayerCard — avatar + name + badge (host crown / bot badge / "You" label)
PlayerGrid — responsive grid of PlayerCards with empty-slot placeholders
Leaderboard — rank + avatar + name + turn pts + total pts
Timer — circular countdown, colour-shifts red at < 10 s
RoundIndicator — "Round 2 / 3"
TurnStatus — who is drawing / guessing
WordDisplay — blank underscores + revealed letters (guesser view)
Canvas — draw surface (interactive or read-only via prop)
DrawingToolbar — brush / eraser / undo / clear / palette / size
Chat — scrollable message list + guess input
Toast — bottom-right notification stack, auto-dismiss 3 s
Modal — centred overlay with lavender-tinted backdrop
GameRules — read-only rules summary card
BotBadge — "🤖 BOT" label for DRAWO Bot player

# 1. Primary Screens (13 Total)

| Screen 01  🏠  Home Screen<br>Entry point — player decides what to do. |
| --- |

### Layout (desktop)
Centred single column, max-width 480 px, lavender cream background with scattered cloud and sparkle doodles.
DRAWO logo — large, 72 px, lavender, visually dominant
"Draw. Guess. Win. 🎨" tagline — pink, 28 px, italic
Cute illustration area — 200 × 160 px clay scene placeholder
🎨 PLAY PUBLIC  (primary pill button, lavender background) — "Jump straight into a public game"
🏠 CREATE PRIVATE  (secondary pill button, cream/peach outline)
🔑 JOIN ROOM  (ghost pill button, slate text)
⚙ Settings  (small gear link, bottom)

### Behaviour
PLAY PUBLIC — if no identity set → open Player Setup modal → then matchmaking
CREATE PRIVATE — if no identity set → open Player Setup modal → then create private room → Private Lobby
JOIN ROOM — opens Join Private Room modal (identity check happens after code validation)
ℹ  Home is the only screen reachable from every other screen via the DRAWO logo or a "Back to Home" button.

| Screen 02  👤  Player Setup / Identity Modal<br>Collect nickname + avatar. No login, anonymous. |
| --- |

### Trigger conditions
Player clicks Play Public, Create Private, or Join Room and has no identity set in local session
Renders as a centred modal over the Home screen

### Elements
Title: "Choose your look"
Avatar grid: 4 × 3 grid of clay avatar options, selected avatar shows lavender ring + check
Nickname input: placeholder "Enter your nickname", max 20 chars
Continue → button (disabled until avatar selected + nickname ≥ 1 char)

### Validation states

| State | UI behaviour |
| --- | --- |
| Empty nickname on submit | Input border turns red, "Please enter a nickname" error below |
| Nickname > 20 chars | Input shows character counter in red, submit blocked |
| No avatar selected | "Please pick an avatar" toast, selection grid pulses |
| Valid | Continue button active, lavender, full opacity |

ℹ  Duplicate nicknames are allowed — backend identifies players by unique socket/session ID, not nickname.

| Screen 03  🔑  Join Private Room Modal<br>Enter a room code to join an existing private game. |
| --- |

### Elements
Title: "Join a Private Room"
Subtitle: "Enter your room code"
Room code input — uppercase only, auto-capitalises, 5-char max, monospace font
JOIN ROOM button
"Cancel" text link

### UI states

| State | Visual |
| --- | --- |
| Normal | Lavender border input, JOIN ROOM active lavender button |
| Joining… | Button text becomes "Joining…", spinner icon, input disabled |
| Invalid format | ⚠ "Invalid room code" — red border, red error text below input |
| Room not found | 😕 "Room not found" — peach error banner above button |
| Room full | 🚫 "This room is full" — red banner, JOIN ROOM disabled |
| Network error | ⚠ "Could not connect. Try again." — retry button |

| Screen 04  🏠  Private Lobby<br>Pre-game gathering area. Host controls rules and start. |
| --- |

### Layout
Top bar: ← DRAWO logo · "ROOM: AB7KQ" badge · 📋 copy icon
Subtitle: "Waiting for players…"
Players section — "PLAYERS (4/15)" heading + PlayerGrid (4 per row desktop, 2 mobile)
Divider
Game Rules section — read-only card + EDIT button (host only)
Action row (host): ADD BOT · START GAME buttons

### PlayerCard anatomy

| Element | Condition |
| --- | --- |
| Crown icon above avatar | Host player only |
| "You" label below name | Current player |
| "BOT" badge, 🤖 icon | DRAWO Bot |
| Empty-slot card with "+" icon | Unfilled slots up to 15 |

### Host vs non-host

| Control | Host |
| --- | --- |
| EDIT button | Visible |
| ADD BOT button | Visible |
| START GAME | Visible, active when ≥ 2 players |
| Rules display | Editable via modal |
| Room code | Visible + copy |

⚠  START GAME is disabled if player count < 2. Show tooltip: "Need at least 2 players to start."

| Screen 05  ⚙  Private Lobby — Edit Rules Modal<br>Host-only modal to configure game settings. |
| --- |

### Rules fields

| Field | Type |
| --- | --- |
| Rounds | Stepper (+ / −) |
| Turn Time | Dropdown |
| Difficulty | Dropdown |
| Custom Words | Toggle |
| Hints | Toggle |
| Mid-game Join | Toggle |

### Custom words sub-panel (visible when Custom Words = ON)
Scrollable chip list of current words — each chip has an × remove button
"+ Add word" input row — press Enter or + to add
Counter: "3 / 50 words"
Words feed into the 3-word choice shown to the drawer each turn
ℹ  Custom words are mixed with system words unless "Custom Only" mode is added later.

### Modal actions
CANCEL — discard changes, close modal
SAVE CHANGES — validate (at least 3 custom words if custom-only mode on), apply, close

| Screen 06  🔄  Public Matchmaking / Connecting<br>Short transition while server finds or creates a public room. |
| --- |

### Flow
Player clicks PLAY PUBLIC on Home (identity check first)
Full-screen transition card appears over cream background

### States

| State | Headline |
| --- | --- |
| Searching (< 3 s) | Finding players… |
| Bot joining (no humans found) | Starting your game… |
| Creating new room (9th+ player) | Creating a new game… |
| Connected | (transitions directly to game) |

⚠  Never show "Waiting for players…" indefinitely. Bot joins within 3 s if no human found.

| Screen 07  🎯  Drawer — Choose Word<br>Drawer selects one of three secret words. Guessers never see this screen. |
| --- |

### Layout
Top bar: DRAWO · Round 1/3 · "Choose your word" · player count
Large centred heading: "YOUR TURN! 🎨"
Sub-heading: "Choose a word to draw"
3 word-choice cards, stacked vertically (desktop: horizontal row also acceptable)

### Word card anatomy
Large emoji/illustration representing the word (64 px)
Word label — 24 px bold slate
Optional difficulty dot (green = easy, yellow = medium, red = hard)
Hover: card lifts 4 px, shadow deepens, scale 1.04
Click/press: immediate full-screen transition to Drawer Active Gameplay

### Timer
A 20-second "choose your word" timer runs. If the drawer does not choose, server auto-selects word 1.
⚠  The three word options are sent only to the drawer’s socket. Guessers receive nothing until word is chosen.

| Screen 08  👀  Guesser — Waiting for Drawer<br>Shown to all guessers while drawer is choosing a word. |
| --- |

### Layout
Top bar: DRAWO · Round 1/3 · "-- s" (no active timer yet)
Large drawing icon (🎨) — 96 px, animated gentle bounce
"[DRAWER NAME] is choosing…" — 24 px bold
"Waiting for [DRAWER NAME] to choose a word" — 18 px grayMid
3-dot loading animation
"Get ready to guess! 👀" — mint, 16 px

### What to NEVER show here
✅  Do not show the 3 word choices
✅  Do not show word length blanks
✅  Do not show any hints
✅  Do not show the guess input — no guessing until round is active

| Screen 09  🎨  Active Gameplay — Drawer View<br>Drawer draws on canvas. Can see guesses but cannot answer. |
| --- |

### Desktop 3-column layout

| Column | Content |
| --- | --- |
| Left | Live leaderboard |
| Centre | Canvas + toolbar |
| Right | Chat panel |

### Top bar (drawer-specific)
"ROUND 1 / 3" left
"YOU ARE DRAWING" centre badge — lavender pill
"🐘 ELEPHANT" — secret word shown only to drawer, 20 px slate bold
Countdown timer — right, yellow/red

### Canvas
Full interactive canvas — mouse/touch drawing enabled
Min size: 480 × 360 px desktop · fills full width mobile
White background, lavender border, 16 px radius

### Drawing toolbar
🖌 Brush — activate pen tool
🧹 Eraser — activate eraser tool
↶ Undo — undo last stroke
🗑 Clear — clear entire canvas (with confirm toast)
Color palette — 16 swatches (primary, pastels, dark tones, white, black)
Brush size — 3 size dots (S / M / L)

### Chat panel (drawer)
Scrollable message list — shows all player guesses
System message on correct guess: "🟢 [NAME] guessed the word!" — NEVER reveal the word
Drawer has NO guess input — they cannot guess their own drawing
⚠  Never leak the secret word in chat. Server should strip or refuse messages containing the answer.

| Screen 10  👀  Active Gameplay — Guesser View<br>Read-only canvas + guess input. No drawing toolbar. |
| --- |

### Key differences from Drawer View

| Element | Drawer |
| --- | --- |
| Top bar word | "🐘 ELEPHANT" visible |
| Canvas | Interactive, toolbar shown |
| Guess input | Hidden (drawer can't guess) |
| Correct guess feedback | "🟢 [NAME] guessed!" |

### Word display (guesser)
One underscore per letter, separated by spaces
Correct letters revealed as hints arrive from server
Example: "E _ E _ _ _ _ _" for ELEPHANT after one hint

### Guess input
Placeholder: "Guess the word…"
Send button: ➤ (lavender, pill shape)
On submit: message appears in chat as "You: [guess]"
On correct guess: input becomes read-only, shows "✅ You got it!" overlay on input
Correct guesser can still chat but cannot score again this turn
ℹ  Server compares guesses case-insensitively, trims whitespace, collapses internal spaces.

| Screen 11  ⏰  Turn Ending / Word Reveal<br>Short full-screen transition state after a turn ends. |
| --- |

### Scenarios

| Scenario | Icon |
| --- | --- |
| Timer ran out | ⏰ |
| All guessers answered | 🎉 |
| Drawer disconnected | ⚠ |

### Turn flow (critical rule)
One player guessing DOES NOT immediately end the turn. The timer continues running.
Player A guesses → locked from scoring again → other players still have time
Turn ends when: (a) all eligible guessers have guessed, OR (b) timer = 0

### Screen duration
Show for 3 seconds, then auto-advance to Turn Results (Screen 12).

| Screen 12  🏆  Turn Results / Leaderboard<br>Per-turn results. Shown after every drawing turn. NOT the final leaderboard. |
| --- |

### Layout
"🎉 ROUND COMPLETE!" heading
"The word was [WORD] [emoji]" — 24 px, centred

### Results table columns

| Column | Content |
| --- | --- |
| Rank | 🥇 🥈 🥉 or number |
| Avatar (sm) | 40 px avatar |
| Name | Nickname |
| Turn points | +850 / +0 — with breakdown on hover/tap |
| Score breakdown | Base +1000 · Time bonus +42 (collapsible) |
| Cumulative total | 2,450 pts |

### Score formula (UI must accommodate)
Base: 1000 · Time bonus: +remaining seconds · Drawer bonus: awarded if ≥ 1 guesser got it.
ℹ  Authoritative calculation lives on server. UI receives final values and breakdown object.

### Bottom countdown
"Next turn: 🎨 [NAME] is drawing next"
"Starting in 3… 2… 1…" — countdown auto-advances to Drawer Word Selection (Screen 07) or Guesser Waiting (Screen 08)

| Screen 13  👑  Final Game Over / Overall Leaderboard<br>Shown once after all rounds complete. Includes winner spotlight. |
| --- |

### Layout
"🎉 GAME OVER! 🎉" heading — 40 px confetti burst animation
"HERE ARE THE RESULTS" subtitle
Winner spotlight card: large avatar (lg) + crown + name + total points — confetti particles
Full leaderboard table — same columns as Turn Results but cumulative only
Victory / consolation message
PLAY AGAIN · BACK TO HOME buttons

### Victory messages

| Condition | Message |
| --- | --- |
| Current player is #1 | 🏆 VICTORY! Incredible drawing skills! |
| Current player is #2–3 | 🥈 So close! Great game! |
| Current player is #4+ | 💜 Better luck next time! That was fun! |
| Bot is winner (unusual) | 🤖 The bot wins this round… Practice makes perfect! |

### Play Again behaviour

| Mode | Play Again action |
| --- | --- |
| Private | Return to Private Lobby with same room code and players |
| Public | Restart matchmaking (Screen 06) |

# 2. Supporting States & Overlays (11 Total)
These are not separate pages but they must be designed and built as proper states, not afterthoughts.

## 2.1 Toast Notification System
All transient events surface as toasts — bottom-right stack, auto-dismiss after 3 s, max 3 visible.

| Event | Icon |
| --- | --- |
| Player joined | 👋 |
| Player left | 🚪 |
| Bot joined | 🤖 |
| Bot left (room full) | 🎉 |
| Host transferred | 👑 |
| Reconnected | 💚 |
| Correct guess (others) | 🟢 |

## 2.2 Disconnection / Reconnect Screen
Triggered when WebSocket connection drops. Overlays the current game screen.
Icon: 📡 animated pulse
Headline: "CONNECTION LOST"
Body: "Trying to reconnect… Your game is still running."
3-dot pulse animation
On reconnect: toast "💚 Reconnected!" overlay fades, game resumes
ℹ  Server holds player's slot for 30 seconds before treating them as disconnected.

## 2.3 Room Full Screen
Shown when a player attempts to join a room that has hit capacity.
Icon: 🚫 72 px
Headline: "ROOM IS FULL"
Body: "This room has reached its player limit."
Button: HOME

## 2.4 Kicked Screen
Shown to a player who has been removed by the host.
Icon: 🚫 72 px
Headline: "You were removed from the room."
No harsh language — neutral, factual.
Button: HOME

## 2.5 Leave Confirmation Modal
Triggered by any navigation away from an active game.
Headline: "Leave game?"
Body: "Your current progress may not be recoverable."
STAY button (primary, lavender) · LEAVE button (ghost, slate)
⚠  LEAVE ends the player's session. For public games they lose all score. For private games host may assign a bot.

## 2.6 Error / Invalid States

| Error | Screen |
| --- | --- |
| Network error on matchmaking | Screen 06 |
| Room code invalid | Screen 03 |
| Room not found | Screen 03 |
| Room full on join attempt | Screen 03 |
| Session expired | Any |

# 3. UI State Machine
Complete navigation flow. Use this as the authoritative routing reference.

## 3.1 Main Navigation Flow

| From State | Trigger / Action | To State |
| --- | --- | --- |
| Home | Click "Play Public" | Player Setup (if no identity) → Screen 06 |
| Home | Click "Create Private" | Player Setup (if no identity) → Screen 04 |
| Home | Click "Join Room" | Screen 03 (Join Room modal) |
| Screen 03 (Join) | Valid code + success | Screen 04 (Private Lobby) |
| Screen 06 (Matchmaking) | Room found / bot joined | Screen 07 or 08 (role-dependent) |
| Screen 04 (Private Lobby) | Host clicks START | Screen 07 or 08 (role-dependent) |
| Screen 07 (Choose Word) | Word selected | Screen 09 (Drawer Active) |
| Screen 08 (Guesser Wait) | Drawer picks word | Screen 10 (Guesser Active) |
| Screen 09 or 10 | Turn timer ends / all guessed | Screen 11 (Word Reveal) |
| Screen 11 (Word Reveal) | Auto-advance 3 s | Screen 12 (Turn Results) |
| Screen 12 (Turn Results) | More drawers this round | Screen 07 or 08 |
| Screen 12 (Turn Results) | End of all rounds | Screen 13 (Game Over) |
| Screen 13 (Game Over) | "Play Again" | Screen 04 (private) or 06 (public) |
| Screen 13 (Game Over) | "Back to Home" | Home |

## 3.2 Bot-Specific Flow (Public Mode)
Public games follow a special bot lifecycle:
1 human clicks Play Public → matchmaking → no humans found within 3 s → DRAWO Bot joins → game starts
As more humans join mid-game: Bot participates normally alongside humans
When human count reaches 8: Bot gracefully leaves, toast shown, leaderboard shows humans only
9th human → new public room → starts with Bot again

### Bot drawing turn (guesser sees)
"🤖 DRAWO Bot is choosing a word…" — guesser waiting screen with bot avatar
Bot auto-selects word after 2 s
"🤖 DRAWO Bot is drawing" in top bar
Human sees word blanks, can guess normally
⚠  The bot's word must never be visible to humans before turn ends — same secrecy rules as human drawer.

## 3.3 Player Rotation
One round = every eligible active player gets exactly one drawing turn.
Public: 8 humans × 3 rounds = 24 drawing turns total. Rotation is fixed at round start.

# 4. Responsive / Mobile Layout
Build mobile-first. Responsive breakpoints: mobile < 768 px · tablet 768–1024 px · desktop > 1024 px.

## 4.1 Mobile Drawer Layout (Screen 09)
Vertical stack — top bar → word display → canvas → toolbar → chat.
Top bar: DRAWO · R1/3 · timer — single row, compact
"YOU ARE DRAWING / 🐘 ELEPHANT" — second row below top bar
Canvas: full width, 65 vh max height
Toolbar: horizontal scroll row of tool icons + palette dots
Chat: collapsible panel, 120 px default, expands on tap
ℹ  Chat must never cover the drawing toolbar. Use a floating collapsed tab.

## 4.2 Mobile Guesser Layout (Screen 10)
Same vertical stack but no drawing toolbar.
Top bar: DRAWO · R1/3 · timer
"🎨 [NAME] IS DRAWING" + word blanks
Canvas: full width, read-only
Chat: scrollable, always visible
Guess input: pinned to bottom, [ Guess the word… ] [ ➤ ]

## 4.3 Touch Targets
All interactive elements ≥ 44 × 44 px (WCAG 2.5.5). Drawing toolbar icons ≥ 48 × 48 px on mobile.

# 5. Implementation Phases (Agent Guidance)
Build in this order. Complete each phase before starting the next.

| Phase | Deliverables |
| --- | --- |
| UI-01: Design system | CSS variables, global styles, all shared components listed in §0.6 |
| UI-02: Home flow | Screens 01 · 02 · 03 — home, identity, join room |
| UI-03: Private lobby | Screens 04 · 05 — lobby, edit rules, custom words, host/non-host |
| UI-04: Public matchmaking | Screen 06 — all 4 sub-states including bot join |
| UI-05: Gameplay foundation | Screens 09 · 10 — canvas, toolbar, chat, leaderboard, timer |
| UI-06: Gameplay states | Screens 07 · 08 — word select, guesser wait; plus in-game events |
| UI-07: Results | Screens 11 · 12 — word reveal, turn results, score breakdown |
| UI-08: Final | Screen 13 — game over, winner, consolation, play again |
| UI-09: Edge cases | All 11 supporting states — toasts, disconnect, kicked, full, etc. |

### Agent-specific notes
Each phase produces a working, visually complete set of screens. No skeleton/placeholder UIs.
Use mock data (static JSON) for all dynamic values — no real sockets yet.
Canvas in UI phase uses a simple draw-on-click placeholder; real Socket.IO sync comes later.
All components accept a "role" prop: "drawer" | "guesser" — never duplicate components for each role.
Timer component accepts: seconds (number), urgent threshold (default 10), onExpire callback.
Leaderboard component accepts: players array, showDrawer boolean (drawer not ranked during their turn).
ℹ  Do not merge Drawer and Guesser into conditional rendering within one giant component. Use separate view components that share sub-components.

# 6. Recommended File Structure

## 6.1 Source layout
src/
├── pages/
│   ├── Home/           → Screens 01-03
│   ├── PrivateLobby/   → Screens 04-05
│   ├── PublicMatch/    → Screen 06
│   ├── Game/           → Screens 07-12 (role-driven)
│   └── GameOver/       → Screen 13
│
├── components/
│   ├── Logo/
│   ├── Avatar/         → xs | sm | md | lg sizes
│   ├── PlayerCard/     → human | host | bot variants
│   ├── PlayerGrid/     → + empty slot placeholders
│   ├── Leaderboard/
│   ├── GameRules/      → read-only + editable variants
│   ├── WordChoice/     → 3-card picker
│   ├── Canvas/         → interactive prop
│   ├── DrawingToolbar/
│   ├── Chat/
│   ├── Timer/
│   ├── RoundIndicator/
│   ├── TurnStatus/
│   ├── WordDisplay/    → blank underscores + hints
│   ├── ResultsTable/
│   ├── BotBadge/
│   ├── Toast/          → stack system
│   └── Modal/
│
└── styles/
├── variables.css   → all design tokens
├── global.css
├── clay.css        → shadow + card mixins
└── responsive.css  → breakpoint utilities

## 6.2 Naming conventions
Components: PascalCase · Files: ComponentName/index.jsx + ComponentName.module.css
CSS custom properties: --drawo-[token] e.g. --drawo-lavender, --drawo-shadow-card
Mock data: src/mocks/[screen].mock.js
Story files (if Storybook): ComponentName.stories.jsx

# 7. Quick Reference — Screen Checklist

| # | Screen / State |
| --- | --- |
| 01 | Home Screen |
| 02 | Player Setup Modal |
| 03 | Join Private Room Modal |
| 04 | Private Lobby |
| 05 | Private Edit Rules Modal |
| 06 | Public Matchmaking |
| 07 | Drawer — Choose Word |
| 08 | Guesser — Waiting for Drawer |
| 09 | Active Gameplay — Drawer |
| 10 | Active Gameplay — Guesser |
| 11 | Turn Ending / Word Reveal |
| 12 | Turn Results / Leaderboard |
| 13 | Final Game Over |
| S1 | Toast system |
| S2 | Disconnect overlay |
| S3 | Room Full screen |
| S4 | Kicked screen |
| S5 | Leave Confirmation modal |
| S6–S11 | Error states |

— End of DRAWO UI Specification —
🎨 Draw. Guess. Win.

8. V1 UI Requirement Amendments & Clarifications
IMPORTANT — These amendments are part of the authoritative UI specification. Where this section conflicts with an earlier UI example, this section takes precedence.
8.1 Private Room Capacity — Host Configurable
• Add a Maximum Players / Player Capacity control to the Private Lobby Edit Rules modal.
• Allowed values: 2 through 15 players.
• The host controls this value before the game starts.
• The lobby player counter must be dynamic: e.g. PLAYERS (4/8), PLAYERS (4/12), or PLAYERS (4/15), based on the selected capacity.
• The PlayerGrid must render only the required number of capacity slots; do not always display 15 slots when a smaller capacity is selected.
• A DRAWO Bot occupies one player slot in a Private Room.
• The server will later enforce capacity authoritatively; this UI specification defines the required visual states.
8.2 Private Room Bot — Maximum One Bot
• A Private Room may contain at most ONE DRAWO Bot.
• When no bot exists, the host sees an active ADD BOT button.
• When the host clicks ADD BOT, show an immediate Adding… state, then display the DRAWO Bot PlayerCard in the PlayerGrid.
• Show a toast: “🤖 DRAWO Bot joined!” after the bot appears.
• Once one bot is present, ADD BOT must become disabled, hidden, or change to a non-action state such as BOT ADDED ✓.
• The UI must never allow or imply multiple bots in the same Private Room.
8.3 Private Add Bot — Immediate UI State
• ADD BOT is a real UI state transition, not a decorative button.
• Before the action: [ ADD BOT ].
• During the action: [ Adding… ] with a spinner and disabled controls.
• After success: DRAWO Bot appears immediately as a player with avatar, BOT badge, and normal PlayerCard styling.
• If the room is already at capacity, show an appropriate room-capacity error instead of adding the bot.
• If a bot is already present, do not create a second bot.
8.4 Drawer / Guesser Role Separation — Mandatory
• The current drawer is NEVER a guesser during their own drawing turn.
• The current drawer cannot submit guesses, cannot use the guess input, and cannot receive guesser points.
• All other eligible active players in the turn are guessers.
• Drawer and Guesser remain separate visual views that share reusable sub-components; do not create one giant gameplay UI that merely hides random controls.
• Screen 09 is the Drawer Active Gameplay view. Screen 10 is the Guesser Active Gameplay view.
• The role-dependent state must be obvious visually through TurnStatus and available controls.
8.5 Bot Participation in Rotation
• While DRAWO Bot is present in a Public Room, the bot participates as an eligible player in the drawer/guesser rotation.
• The bot can have a drawing turn and a guessing turn while it remains in the room.
• During a bot drawing turn, human guessers see the Guesser Waiting state while the bot is choosing, followed by the normal Guesser Active Gameplay view.
• The bot’s secret word must never be shown to human guessers before the turn ends.
• When Public human count reaches 8, the bot leaves gracefully and is removed from all future rotation slots.
• A new Public Room created for a 9th human starts with that human plus a temporary DRAWO Bot.
• The statement “Public: 8 humans × 3 rounds = 24 drawing turns” refers specifically to the 8 real-human drawing turns per round. Bot turns are additional while the bot is present.
8.6 Turn Ending Timing
• Screen 11 — Turn Ending / Word Reveal: display for approximately 2 seconds.
• Screen 12 — Turn Results / Leaderboard: display for approximately 3 seconds.
• After the Turn Results countdown finishes, proceed to the next drawer’s role-dependent Screen 07 or Screen 08.
• At the end of the final turn of the final round, do not start another turn; proceed to Screen 13 Final Game Over.
• The exact backend timing will later be server-authoritative; these durations define the intended UI presentation.
8.7 Public Capacity and Matchmaking Display
• Public capacity is exactly 8 REAL HUMAN PLAYERS per public room.
• The temporary DRAWO Bot does not count as one of the 8 human capacity positions.
• Public matchmaking must never visually imply that the bot consumes a human slot.
• When the room reaches 8 real humans, display a Bot Left toast and remove the bot from the PlayerGrid, leaderboard, and remaining rotation.
• The next real human selecting PLAY PUBLIC after the room is full must be represented as entering a newly created public room with a DRAWO Bot.
8.8 Dynamic Private Player Counter
• All Private Lobby player counters must use the configured maximum: PLAYERS (current/maximum).
• Do not hard-code PLAYERS (4/15) in production UI.
• Examples: PLAYERS (2/4), PLAYERS (4/8), PLAYERS (10/15).
• If the host changes capacity, the rules card and player-slot presentation update consistently.
8.9 Settings Entry
• The Home screen includes a Settings entry, but the original 13-screen list does not define its contents.
• For V1 UI, implement Settings as a lightweight modal/overlay rather than counting it as a new primary screen.
• Minimum UI controls: Sound ON/OFF and Music ON/OFF.
• Use the existing Modal component and DRAWO claymorphism design system.
• If Settings is not required in the implementation build, the agent may temporarily hide the Home Settings entry rather than creating an undefined or empty page.
8.10 UI-Only Mock Data Boundary
• Static/mock data is permitted ONLY for this UI-only implementation phase.
• Mock data must be isolated from reusable UI components and placed under the documented src/mocks/ area.
• Do not build a fake local gameplay engine, fake matchmaking engine, or offline gameplay fallback as part of the UI phase.
• The UI must be structured so mock values can later be replaced by real server-authoritative Socket.IO state without redesigning the screens.
• The final integrated game must use the real Node.js/Socket.IO server as the source of truth.
8.11 Authoritative Screen Checklist After Amendments

| # | Primary Screen / State | Required UI clarification |
| --- | --- | --- |
| 01 | Home | Public direct entry; Create Private; Join Room; Settings modal |
| 02 | Player Setup | Nickname + avatar; no login |
| 03 | Join Private Room | Code validation and error states |
| 04 | Private Lobby | 2–15 configurable capacity; maximum one bot; host controls |
| 05 | Private Edit Rules | Rounds, turn time, difficulty, capacity, custom words, hints, mid-game join |
| 06 | Public Matchmaking | 8 real-human capacity; temporary bot; no lobby; new room after full |
| 07 | Drawer — Choose Word | Exactly 3 choices; drawer only; 20s selection state |
| 08 | Guesser — Waiting for Drawer | Named drawer; no choices/blanks/hints/input before word selection |
| 09 | Active Gameplay — Drawer | Interactive canvas; secret word; no guess input |
| 10 | Active Gameplay — Guesser | Read-only canvas; blanks/hints; guess input; no toolbar |
| 11 | Turn Ending / Word Reveal | ~2s reveal; timer/all-guessed/disconnect variants |
| 12 | Turn Results / Leaderboard | Per-turn scores; cumulative totals; ~3s countdown |
| 13 | Final Game Over | Overall ranking; winner/consolation; Play Again/Home |

8.12 Final UI Flow Reference
HOME → PLAYER SETUP (if needed) → PUBLIC MATCHMAKING → DRAWER CHOOSE WORD or GUESSER WAITING → ACTIVE DRAWER/GUESSER GAMEPLAY → TURN REVEAL (~2s) → TURN RESULTS (~3s) → NEXT DRAWER → repeat for all eligible turns and rounds → FINAL GAME OVER.
Private: HOME → PLAYER SETUP → PRIVATE LOBBY → EDIT RULES (host) → START → same gameplay flow.
Public with no other human: HOME → PLAYER SETUP → MATCHMAKING → HUMAN + BOT → gameplay. Public reaches 8 humans: BOT LEAVES → 8 humans continue. Next Public human after the room is full: NEW PUBLIC ROOM + BOT.
