# Unified Game Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every game shares one set of chrome: the game bar, game menu, clock, rules, host controls and the pause and countdown overlays. Each game keeps its own play surface, designed for that game and the space it has.

**Architecture:**
- **Room owns the chrome.** The game room renders a game bar during play (it replaces the room header) and one game menu. The menu holds rules, players, sound, video, undo, invite, host controls and leave, so the phone tab bar and host-controls strip go away during play. The room also owns the round clock, Pause / Resume / End round, round auto-end, and the paused and countdown overlays.
- **Games publish to the chrome.** Each game publishes its status line, progress, rules and scores through `GameChromeService`, which the room provides and the games inject.
- **Games own the surface.** Layout and look come from what each game needs, skinned with scoped `--game-*` custom properties (spec Tier 3). Shared surface primitives (`app-tableau-ring`, `app-action-dock`) are optional. A game uses one only where it suits that game.

**Tech Stack:** Angular 22 (zone.js, standalone, signals), Bootstrap 5.3 + SCSS tokens in `frontend/src/styles.scss`, SignalR, Karma/Jasmine, Playwright.

**Spec:** `docs/game-archetypes-and-spatial-hierarchy.md` and `docs/platform-glossary.md`. The user direction (2026-11-24) is the binding requirement on top of them:
- Shared components such as the game menu and controls are unified.
- Navigation must be easier and less strict than Board Game Arena's.
- Each game gets its own design and uses its space as well as it can.
- Similar games look similar only when that makes the most sense for each game.

## Why (findings from a 390px / 1280px run of the five playable games)

1. **Two headers.** Every game draws its own header under the room header. The room header shows "ROUND 1 / 5" for games with no rounds, and "ROUND 1 / 1" beside Yacht's "Turn 1 / 13".
2. **Chrome takes the phone screen.** A phone during play stacks the room header, the game's own header, a "Host controls" strip and a Game/Players tab bar, about 200px of chrome on an 844px screen.
3. **Host controls in four places.** They are in the lobby panel, a desktop intermission bar, a bottom `<details>` sheet, and Babble's in-game toolbar. `hostControlsTemplate` never renders, because `onGameComponentActivate` is never called.
4. **Each game builds its own chrome.** Each has its own clock code, rules toggle (Farkle's `?` dialog, inline toggles in Four in a Row and Yacht) and turn bar.
5. **Games start when they cannot be played.** Clover-Minded started with one Hand and showed "Game Over". Four in a Row stayed in the lobby without saying why.
6. **Role buttons look like badges.** The sidebar's "HAND" / "TABLE" role-switch buttons read as status badges, not actions.
7. **Surfaces don't fit the space.**
   - On a Table, the 350px sidebar stays open during play.
   - The Farkle Table at 390px keeps two columns and clips "Guesty's Turn".
   - Babble's Table side panel runs off the right edge at 1280px.

## Global Constraints

- **Shared chrome is identical in every game.** Games never render their own title, round badge, clock, rules toggle, pause or end controls.
- **Game menu navigation is flat.** One menu button, always in the same corner. Items are in one list grouped under at most three plain headings, with no nested menus. Every item is reachable in at most two taps from the play surface.
- **Play surfaces belong to each game.**
  - Game-specific colour lives on the game's root as `--game-primary`, `--game-accent` and `--game-surface`, falling back to site tokens.
  - A distinctive game look is allowed, but it must still read as part of the site: the site fonts, `--radius-sm` corners, 2px borders, and no coloured rounded accent lines.
- No `!important`. No inline `style="..."`. Use each component's external `.scss`.
- Hand touch targets are ≥ 44×44px, and primary actions sit in the bottom third (spec Heuristic 2).
- Private information is never rendered on a Table (`isScreen === true`) (spec Heuristic 3).
- Spacing stays compact, and every screen works the same at 390px as on desktop.
- Commits use Conventional Commits in the imperative mood and end with the `Co-Authored-By` attribution line.
- Work on branch `feat/unified-game-room`, with branch notes at `docs/branch-notes/feat-unified-game-room.md`.
- Test commands (from `frontend/`): `npx ng test --watch=false --browsers=ChromeHeadless --include=<spec>`; full suite `npx ng test --watch=false --browsers=ChromeHeadless`; build `npx ng build`.

## Out of Scope

- The 13 in-development games, whose 17 Tailwind-class templates render partly unstyled. They will move onto the chrome in a follow-up plan (4c).
- Server-clock offset for countdowns (4c).

## Review Focus

1. **Round auto-end fires exactly once.** It happens once per round on the host only, and never while paused. Test in Task 3.
2. **Chrome resets on game switch.** A game switch mid-session clears the previous game's status, rules and scores, so no stale "Guesty's turn" appears under the new game. Test in Task 1 (`reset`) and Task 3.
3. **Publishing during render.** A game that sets chrome signals in `ngOnChanges` must not raise ExpressionChangedAfterItHasBeenChecked. Covered by Task 3's fixture test with a real published game stub, plus the runtime scan.
4. **Menu on a Table.** A Table may be a TV with no pointer. The menu must work by keyboard: Enter opens it, Escape closes it, and focus returns to the menu button. Test in Task 2.
5. **Table at phone width.** Every Table surface fits 390px with no horizontal scroll. Checked by the Playwright assertion in Task 10.

---

### Task 0: Branch and notes

- [ ] `git switch -c feat/unified-game-room`. Create `docs/branch-notes/feat-unified-game-room.md` (Discoveries = the Why list, 4c = Out of Scope). Commit `docs: add plan and branch notes for unified game room`.

### Task 1: Round clock and chrome service

**Files:**
- Modify: `frontend/src/app/shared/round-timing.ts`, `round-timing.spec.ts`
- Create: `frontend/src/app/features/game-room/services/game-chrome.service.ts`, `.spec.ts`

**Interfaces:**
- Produces:
  - `type ClockState = 'idle' | 'leadIn' | 'running' | 'paused' | 'ended'`
  - `interface RoundClock { state: ClockState; text: string; urgent: boolean }`
  - `roundClock(room, now = Date.now()): RoundClock`
  - `interface TableauEntry { id: string; name: string; score: number | string; active?: boolean; isMe?: boolean }` (exported from `game-chrome.service.ts`)
  - `@Injectable() class GameChromeService` (not root; the room provides it), with:
    - `readonly status = signal('')`, `readonly progress = signal('')`
    - `readonly rules = signal<TemplateRef<unknown> | null>(null)`, `readonly scores = signal<TableauEntry[] | null>(null)`
    - `publish(p: { status?: string; progress?: string; scores?: TableauEntry[] | null }): void` (sets only the keys it is given)
    - `reset(): void`
  - `playersAsEntries(room: Room, activeId?: string, myId?: string): TableauEntry[]`: Hand players only, using `player.score`.

- [ ] **Step 1: Write the failing specs.**
  - `roundClock`, with `now = Date.parse('2026-01-01T00:00:00Z')`:
    - no end time → `{idle,'',false}`
    - start `now+2500` → `{leadIn,'3',false}`
    - paused → `{paused,'Paused',false}`
    - end `now+125000` → `{running,'02:05',false}`
    - end `now+9000` → `{running,'00:09',true}`
    - end `now-1` → `{ended,'00:00',true}`
    - Lobby → idle
  - `GameChromeService`:
    - `publish({status:'A'})` leaves `progress` untouched
    - `reset()` empties all four
    - `playersAsEntries` drops screens and marks the active and me entries
- [ ] **Step 2:** Run both specs and confirm they FAIL.
- [ ] **Step 3:** Implement. `roundClock` checks in this order: not Playing or no end → idle; `secondsUntilPlay > 0` → leadIn; paused; ≤ 0 → ended; otherwise running `mm:ss`, urgent under 10s.
- [ ] **Step 4:** Run both specs and confirm they PASS.
- [ ] **Step 5:** Commit `feat(room): add round clock and game chrome service`.

### Task 2: Game bar, game menu, rules drawer, tableau ring and action dock

**Files:**
- Create in `frontend/src/app/features/game-room/components/`:
  - `game-bar/` and `game-menu/`, each with `.ts`, `.html`, `.scss` and `.spec.ts`
- Create in `frontend/src/app/features/games/shared/components/`:
  - `rules-drawer/`, `tableau-ring/` and `action-dock/`, each with `.ts`, `.html`, `.scss` and `.spec.ts`; `action-dock` has no spec (content projection only)

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - **`GameBarComponent`** (`app-game-bar`):
    - Inputs: `gameName`, `status`, `progress`, `clock: RoundClock | null`, `hasRules`.
    - Outputs: `menuOpen`, `rulesOpen`.
    - Layout: menu button on the left (`aria-haspopup="dialog"`, `aria-label="Game menu"`); status (`role=status`, polite) with game name as a small label; progress and clock (`role=timer`, `.is-urgent`) on the right; a 44px "How to play" icon button when `hasRules`.
  - **`GameMenuComponent`** (`app-game-menu`):
    - Wraps a native `<dialog>`, shown as a left sheet on desktop and full-width on phones; `open()`, `close()`, `@Output() closed`. Focus returns to the opener on close.
    - Inputs: `roomCode`, `isHost`, `canUndo`, `isMuted`, `videoReady`, `scores: TableauEntry[] | null`.
    - Outputs: `rules`, `players`, `toggleSound`, `startVideo`, `undo`, `leave`.
    - Projects host controls through `<ng-content select="[menuHost]">`.
    - Sections (plain headings, flat):
      - "This game": How to play, Scores (inline `app-tableau-ring` when `scores`)
      - "Room": Players, room code with Copy invite link, Sound on/off, Video, Undo
      - "Host" (host only): projected
      - A "Leave room" button at the bottom
  - **`RulesDrawerComponent`** (`app-rules-drawer`): a `<dialog>` sheet; `@Input() rules: TemplateRef<unknown> | null`; `open()`, `close()`.
  - **`TableauRingComponent`** (`app-tableau-ring`): `@Input() entries: TableauEntry[]`, `@Input() label = 'Scores'`.
  - **`ActionDockComponent`** (`app-action-dock`): projects content into a sticky bottom bar on Hands, with min 44px buttons and a gap of `--space-sm`. It is an option for a game, not a requirement.

- [ ] **Step 1: Write the failing specs.**
  - **game-bar:**
    - status inside `[role=status]`; progress shown only when set
    - `[role=timer]` shown only when the clock is not idle, with `is-urgent` when urgent
    - the rules button appears only with `hasRules`
    - clicking the menu button emits `menuOpen`
  - **game-menu:**
    - `open()` sets `dialog.open`
    - Escape closes and focus returns to the opener
    - "Host" heading and `[menuHost]` content appear only when `isHost`
    - "Scores" lists entries when given and is absent when null
    - each button emits its output: Leave → `leave`, Players → `players`, How to play → `rules`
    - Undo is shown only when `canUndo`
    - every item is a `button` or `a`, and there is no nested menu (`dialog [role=menu] [role=menu]` count is 0)
  - **rules-drawer:** after `open()` with a template, the template text is visible; close works.
  - **tableau-ring:** one `li` per entry; the active entry has `aria-current="true"`; me shows "(you)".
- [ ] **Step 2:** Run the specs and confirm they FAIL.
- [ ] **Step 3:** Implement. Bar height is 48px on phones and 52px on desktop. The menu has square corners and a 2px `--primary` border, and uses site tokens only (chrome never takes game colours).
- [ ] **Step 4:** Run the specs and confirm they PASS.
- [ ] **Step 5:** Commit `feat(room): add game bar, game menu and shared surface primitives`.

### Task 3: Room owns the chrome during play

**Files:**
- Modify: `frontend/src/app/features/game-room/game-room.component.{ts,html,scss,spec.ts}`
- Modify: `frontend/src/app/features/game-room/components/mobile-tab-bar/` (hidden during play)

**Interfaces:**
- Consumes: Tasks 1–2; `SignalRService.pauseGame/resumeGame/endRound`; `ConfirmService.confirm`; `TimerType.NotApplicable`.
- Produces, on `GameRoomComponent`:
  - `providers: [GameChromeService]`
  - `readonly chrome = inject(GameChromeService)`
  - `clock = signal<RoundClock | null>(null)`
  - `get isTimedGame(): boolean`
  - `pauseRound()`, `resumeRound()`, `endRoundEarly(e?: MouseEvent): Promise<void>`
  - `openPlayers(): void`: on phones sets `mobileView = 'players'`; on desktop expands the sidebar
  - `private autoEndedRound: number | null`

- [ ] **Step 1: Write the failing specs** in `game-room.component.spec.ts`:
  - **Lobby:** `app-room-header` is shown and `app-game-bar` is not.
  - **Playing:** `app-game-bar` is shown; there is no `app-room-header`, no `app-mobile-tab-bar`, no `.host-controls-bar` and no `.intermission-bar`; there is exactly one `app-host-settings`, inside `app-game-menu [menuHost]`.
  - **Publishing:** a stub game component that publishes `status: 'Your turn'` in `ngOnChanges` shows "Your turn" in the bar. Switching `gameType` calls `chrome.reset()`.
  - **Timed game, host, Playing:** the menu's host section has "Pause round" (calls `pauseGame`); when paused it has "Resume round" (calls `resumeGame`) and `.room-overlay` shows "Paused". "End round" confirms first, then calls `endRound` once.
  - **Untimed game:** no pause or end-round controls.
  - **Auto-end:** a host with an ended clock in round 2 calls `endRound` once across 3 ticks; a non-host never does; a paused room never does.
  - **Lead-in:** `roundStartTime` 3s ahead → `.room-overlay` shows `3`.
  - **Table client:** the sidebar collapses when the game starts.
  - Delete the specs for `onGameComponentActivate` / `activeGameComponent`.
- [ ] **Step 2:** Run the spec and confirm it FAILS.
- [ ] **Step 3: Implement.**
  - **Template:**
    - Lobby keeps `app-room-header`. During play, `app-game-bar` takes its place, fed from `chrome.*()` and `clock()`.
    - `app-game-menu` takes the room actions (`leaveRoom`, `toggleSound`, `videoChat?.joinVideo()`, `requestUndo`, `openPlayers`, rules → `rulesDrawer.open()`).
    - The host section holds a `.round-controls` row plus the compact `app-host-settings` (switch game / next round / end game).
    - `app-rules-drawer [rules]="chrome.rules()"`.
    - The paused and lead-in `.room-overlay` covers only the game outlet.
    - Delete the intermission bar, the `<details class="host-controls">` strip and the `hostControlsTemplate` outlet.
    - Hide `app-mobile-tab-bar` during play; when the players panel is open on a phone, show a "Back to game" button.
  - **TS:**
    - A 500ms interval sets `clock` while Playing and runs auto-end: host + timed + `ended` + `autoEndedRound !== roundNumber` → set the guard, then call `endRound()`.
    - Reset chrome when `gameType` changes.
    - Remove the dead `activeGameComponent` code.
- [ ] **Step 4:** Run the spec and confirm it PASSES. Then run `room-header`, `mobile-tab-bar` and `host-settings` specs and fix any expectations the move broke.
- [ ] **Step 5:** Commit `refactor(room): move in-game chrome and host controls into one game bar and menu`.

### Task 4: Start gate and role buttons

**Files:**
- Modify: `host-settings.component.{ts,html,spec.ts}`, `room-sidebar.component.{html,spec.ts}` (under `features/game-room/components/`)

**Interfaces:** Produces `HostSettingsComponent.startBlocker: string | null`.

- [ ] **Step 1: Write failing specs.**
  - **host-settings (Four in a Row, min 2, max 2):**
    - 1 Hand → `'Four in a Row needs 2 players. 1 has joined.'`
    - 3 Hands → `'Four in a Row takes at most 2 players. 3 have joined.'`
    - 2 Hands → `null`
    - with a blocker, Start is disabled and described by `#start-blocker`
    - during intermission → `null`
  - **room-sidebar:** the button on a Table row reads "Use as Hand" with `aria-label="Use TV as a Hand"`; the button on a player row reads "Use as Table".
- [ ] **Step 2:** Run the specs and confirm they FAIL.
- [ ] **Step 3:** Implement. Count Hands only (`!isScreen`).
- [ ] **Step 4:** Run the specs and confirm they PASS.
- [ ] **Step 5:** Commit `feat(room): block start outside a game's player range and label role buttons`.

### Tasks 5–9: Move each playable game onto the chrome

Every game task follows the same five steps. The design notes are per game and come from what that game needs, not from a shared template.

- **Step 1: Write failing specs.**
  - With the published-chrome spy, the game publishes the listed `status`, `progress` and `scores`, and sets `rules` to a template.
  - The game no longer renders the listed own-chrome selectors.
  - Add any game-specific assertions listed.
  - Provide `GameChromeService` in each spec's `providers`.
- **Step 2:** Run the specs and confirm they FAIL.
- **Step 3:** Implement.
  - Inject `GameChromeService` and publish in `ngOnChanges`.
  - Put the rules in `<ng-template #rules>` and publish it in `ngAfterViewInit`.
  - Delete the own-chrome markup and its SCSS.
  - Redesign the surface per the notes, using `--game-*` properties on the root.
- **Step 4:** Run the specs and confirm they PASS. Then screenshot Hand 390 and Table 1280 + 390 with the scan script, and look at them.
- **Step 5:** Commit `refactor(<game>): publish to shared chrome and fit the surface to the game`.

#### Task 5: Farkle (push-your-luck dice, turn-based, 2–8)
- **Publishes:**
  - `status`: `'Your turn'` / `'Guesty’s turn'` / `'Guesty wins'`
  - `progress`: `'Turn score 350'`
  - `scores`: by `totalScore`, with the active player flagged
- **Removes:** `.status-bar`, `.rules-btn`, `.scoring-aid-overlay` (its list moves into `#rules`), and the Table's own "Scoreboard" heading.
- **Surface:**
  - The dice tray is the hero on both devices.
  - The Table keeps a dark felt identity through `--game-surface`, with a score ring beside the tray at ≥ 768px container width and below it under that. Fix the 390px clipping.
  - The Hand puts Roll and Bank in `app-action-dock`, with selected-dice score feedback just above it.

#### Task 6: Babble (real-time word grid, timed rounds, 1–8)
- **Publishes:**
  - `status`: `'Find words'` / `'Round results'` / `'Final results'`
  - `progress`: `'Round 2 of 5'`
  - `scores`: from `room.players`
- **Removes:** `.host-toolbar`, `.babble-header`, `.babble-mobile-header`, `.hand-header`, `.timer-card`, `.countdown-overlay` and `hostControlsTemplate`, plus both components' timer intervals, `handleTimerEnd` and the pause/end handlers. Delete `games/shared/components/end-round-button/`.
- **Keeps:** the grid blur from `isBlurred` during lead-in and pause.
- **Surface:**
  - On the Table, the grid takes the full height on the left and the words/results panel sits beside it within the viewport (fixes the 1280px overflow).
  - On the Hand, the grid sits as high as possible and the word entry is in `app-action-dock`.

#### Task 7: Yacht (dice + scorecard, turn-based, 1–8)
- **Publishes:**
  - `status`: `'Your turn'` / `'Guesty’s turn'` / `'Guesty wins'` / `'Guesty and Hosty tie'`
  - `progress`: `'Turn 1 of 13'`
  - `scores`: grand totals
- **Removes:** `.yacht-header`, `.eyebrow`, `h1`, the inline rules and the duplicate turn-status heading.
- **Surface:**
  - The scorecard is the hero. On the Table, the tray and scorecard sit side by side at ≥ 992px.
  - On the Hand, the dice sit above the card. Roll is in `app-action-dock`, and scoring happens by tapping a scorecard row, so there is no separate picker panel when the card is visible.
  - The Table never renders a category picker.

#### Task 8: Clover-Minded (co-op deduction, phases, 3–6)
- **Publishes:**
  - `status` by phase and role, for example `'Write your four clues'` (Spectator Hand during clues), `'Waiting for clues'`, `'Place the cards'`
  - `progress`: `'Round 2 of 5'`
  - `scores`: none
- **Removes:** the 🍀 title row and the phase pill.
- **Keeps:** the Table privacy assertion (no secret keyword text in the Table DOM).
- **Surface:**
  - On the Table, the clover board is centred and as large as the height allows, with Center Cards beside it on wide screens and below on narrow ones.
  - On the Hand, the clue inputs and confirm action sit in the bottom third.

#### Task 9: Four in a Row (abstract grid, turn-based, exactly 2)
- **Publishes:**
  - `status`: the existing `status` getter
  - `progress`: none
  - `scores`: `Red · Hosty`, `Yellow · Guesty`, with the current player flagged
- **Removes:** the `header` with its `h2`, the rules toggle (rules go into `#rules`), the `.players` row and `.end-hint`.
- **Surface:**
  - The board is the hero and fills the smaller viewport dimension on the Table.
  - On the Hand, column buttons are aligned under the board's columns in the thumb zone.

### Task 10: Runtime verification, design review and docs

- [ ] **Step 1:** Run the full unit suite and confirm everything passes (605 before this work, plus the new specs).
- [ ] **Step 2:** Run `npx ng build` and confirm it succeeds.
- [ ] **Step 3:** Start the API (port 5109) and `ng serve` (port 4300), then run the Playwright scan.
  - Clients: host Hand 390×844, guest Hands at 390 and 1280, Table at 1280×720 and 390×844.
  - States: lobby, mid-turn, paused (Babble), game over.
  - Assert on every page:
    - `scrollWidth <= innerWidth`
    - during play there is exactly one `app-game-bar`, with no `app-room-header` or `app-mobile-tab-bar`
    - the menu opens with Enter and closes with Escape, and focus returns to the menu button
    - no `pageerror` and no `NG0100` console error
  - Look at every screenshot.
- [ ] **Step 4:** Run the `board-game-hub:design-review` skill. Fix findings.
- [ ] **Step 5:** Update `docs/game-archetypes-and-spatial-hierarchy.md` §4 (which primitives exist, chrome vs surface ownership, the flat-menu rule), the `platform-glossary.md` registry key names, and the branch notes. Commit `docs: record shared game chrome and per-game surfaces`.

### Manual steps

- Play one real round of each game on a physical phone and a TV/laptop Table: check thumb reach, readability from across the room, and whether each game's surface feels like that game.
