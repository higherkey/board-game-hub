# feat/unified-game-room

Plan: `docs/superpowers/plans/2026-11-24-unified-game-room.md`

## Discoveries
- Every game drew its own header; host controls lived in four places; `hostControlsTemplate` never rendered.
- A phone during play stacked about 200px of chrome; now one 48px game bar.
- Desktop sidebar collapse never worked (the 320px flex basis overrode `is-collapsed`).
- The two Farkle scoring guides disagreed (Table said three 1s = 1000); the server says 300.
- Untimed games got a server round end time, so the bar showed a clock for Farkle.
- A host-ended game kept saying "Guesty's turn"; the room now says "Game over" unless the game ended by its own rules.
- Angular 22 defaults components to OnPush; test hosts that mutate fields need `ChangeDetectionStrategy.Eager`.

## 4a Blockers
- None.

## 4b Quick Wins
- Done: Start is blocked outside a game's player range, with the reason shown.
- Done: role buttons read "Use as Hand" / "Use as Table".

## 4c Deferred
- Move the 13 in-development games onto the shared chrome. They still draw their own headers, and 17 templates use Tailwind classes, which are not installed.
- Compact host settings label the rounds field only "#".
- Server clock offset for countdowns.
- Manual: play one real round of each game on a physical phone plus a TV.
- Room auto-end is opt-in (Babble only) until in-development games with phase timers (Pictophone, Universal Translator) migrate.
