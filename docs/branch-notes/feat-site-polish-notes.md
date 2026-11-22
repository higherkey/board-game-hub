# Branch Notes: feat/site-polish

Finish the redesign follow-ups: work found uncommitted after the game-pages merge, plus the deferred items from the game-pages and dice-tray branches.

## 1. Discoveries & Deviations
- Rescued: this work was uncommitted on the merged `feat/game-pages` branch. It was saved as one commit and rebased onto `dev`.
- Accent stripes removed: the colored one-side borders on rounded or boxed elements (phone nav menu, game page scoring note, room sidebar ready rows, Babble "mine" rows, Yacht confirm box, Farkle/Deepfake active player) are gone or replaced with a full outline or tint.
- Shelf on phones: the Filters button is an icon beside the search box instead of its own row; filter options are 44px and the three length options fit one row.
- Page scroll: `html, body { overflow-x: hidden }` made body its own scroll box, so the window never scrolled. Opening a game from the Shelf kept the Shelf's scroll position, and the header's `window:scroll` shrink never fired. Now `overflow-x: clip`, and the router resets scroll (`scrollPositionRestoration: 'enabled'`).
- Host controls in a game: END GAME is always there. Mid-round it ends the game and shows final scores; between rounds or after the game it returns everyone to the lobby. START no longer shows mid-round. The game picker is no longer locked between rounds, and switching games asks first. Desktop hosts get the same bar mid-round; before, they had no in-game controls.
- Game switching: `GameTypeChanged` now moves the client to the lobby with the type, so the new game's component never renders on the old game's data (this threw in FarkleTable when switching from Babble). Typing a game name and pressing Enter selects the top match.
- Corners and hairlines, site-wide: `--radius-md`/`--radius-lg` and Bootstrap's `--bs-border-radius*` resolve to `--radius-sm` (4px). About 150 soft radii flattened to 4px, about 100 hairlines removed or made 2px ink, pill classes dropped. Kept on purpose: true circles (avatars, dots, swatches, round icon buttons, game pieces, dice pips), dice art, scrollbars, progress bars, row/section dividers, toggle switches, and the home hero illustration.
- Room creation never started the realtime connection, so "Host" failed on a fresh visit with "Failed to create room"; `createRoom` now connects first.

## 2. Blockers & Risks (4a)
- None yet.

## 3. Quick Wins (4b)

## 4. Deferred Items (4c)
