# Branch Notes: feat/unified-game-room

Plan: `docs/superpowers/plans/2026-11-24-unified-game-room.md`

## 1. Discoveries & Deviations
- Every game drew its own header; host controls lived in four places; `hostControlsTemplate` never rendered.
- A phone during play stacked about 200px of chrome; now one 48px game bar.
- Desktop sidebar collapse never worked (the 320px flex basis overrode `is-collapsed`).
- The two Farkle scoring guides disagreed (Table said three 1s = 1000); the server says 300.
- Untimed games got a server round end time, so the bar showed a clock for Farkle.
- A host-ended game kept saying "Guesty's turn"; the room now says "Game over" unless the game ended by its own rules.
- Round numbers restart in every game, so round auto-end is keyed on the round's end time.
- Pictophone and Universal Translator use the round timer per phase, so room auto-end is opt-in (Babble only).
- Angular 22 defaults components to OnPush; test hosts that mutate fields need `ChangeDetectionStrategy.Eager`.

## 2. Blockers & Risks (4a)
- None.

## 3. Quick Wins (4b)
- Done: Start is blocked outside a game's player range, with the reason shown ("1 player" / "3 players").
- Done: role buttons read "Use as Hand" / "Use as Table", with an accessible name that matches the visible text.
- Done: the room clock runs outside Angular and redraws only when the clock changes.
- Done: the paused overlay tells the host to resume from the game menu.
- Done: the Yacht score confirmation moved into the bottom dock, in place of Roll.
- Done: the menu's Sound button states its state once, in the label.
- Done: compact host settings label "Seconds" and "Rounds" in words, with 44px controls and no inline style.

## 4. Deferred Items (4c)
- Move the 13 in-development games onto the shared chrome. They still draw their own headers, and 17 templates use Tailwind classes, which are not installed. Room auto-end stays opt-in until they move.
- Server clock offset for countdowns.
- Manual: play one real round of each game on a physical phone plus a TV.
