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
- Confirm dialog: `AppConfirmComponent` was never mounted, so every confirm fell back to the browser's own box. It is now a `<dialog>` in the layout (bottom sheet on phones); Great Minds' sync token uses it.
- The old navbar component was unused; deleted.
- Dark game screens restyled to the light look: Babble TV, room menu drawer, Clover-Minded (hand, table, word cards), Farkle hand, Great Minds (hand, board, wrapper, rules), Scatterbrain, Deepfake, Four in a Row, Poppycock and Universal Translator rules, room entry. Great Minds cards are flat colours with hard shadows; emoji hearts/stars became icons.
- Universal Translator rules used Tailwind classes, but Tailwind isn't installed, so it rendered unstyled; rewritten with plain markup.
- Great Minds board filled only half the room (its host element wasn't a flex child); Clover-Minded table player list was never styled and showed a connection-id letter instead of the name initial.
- Babble TV grid rows grew past the board with big letters; now `minmax(0, 1fr)`.
- e2e: first full run against a live backend (in-memory DB). Three specs were stale (Babble hand classes, END GAME with the site dialog); updated. 24/24 pass.
- Room creation never started the realtime connection, so "Host" failed on a fresh visit with "Failed to create room"; `createRoom` now connects first.

## 2. Blockers & Risks (4a)
- None yet.

## 3. Quick Wins (4b)
- DiceScene specs stalled in a visible Chrome window (rAF throttled); frames now driven by a timer in tests.

## 4. Deferred Items (4c)
- SonarCloud issues reported on #260 and #261: details need a token (project is private); not reviewed.
- Dice on real phones (feel, performance) not checked; needs a device.
