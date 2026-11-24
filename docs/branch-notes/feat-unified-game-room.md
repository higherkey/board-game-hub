# feat/unified-game-room

Plan: `docs/superpowers/plans/2026-11-24-unified-game-room.md`

## Discoveries
- Each game drew its own header under the room header; the room header showed "ROUND 1 / 5" even for games without rounds.
- A phone in play stacked about 200px of chrome: the room header, the game header, a host-controls strip and a tab bar.
- Host controls lived in four places; `hostControlsTemplate` never rendered (`onGameComponentActivate` was never called).
- Clocks, rules toggles and turn bars were reimplemented in each game.
- Clover-Minded could start with one Hand; Four in a Row refused to start without saying why.
- The sidebar role buttons ("HAND" / "TABLE") read as badges.
- Tables kept the 350px sidebar open during play; the Farkle Table clipped at 390px; the Babble Table overflowed at 1280px.

## 4a Blockers

## 4b Quick Wins

## 4c Deferred
- Move the 13 in-development games onto the shared chrome; 17 of their templates use Tailwind classes, which are not installed.
- Server clock offset for countdowns.
