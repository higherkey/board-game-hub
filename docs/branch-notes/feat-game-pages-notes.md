# Branch Notes: feat/game-pages

Give every game a readable page at `/shelf/<game>`, redesign that page, move the lead-in countdown to the server, restyle the game room for phones (Babble as the example), and tighten spacing across the redesigned pages.

## 1. Discoveries & Deviations
- Routes: the Shelf is now `/shelf` and each game `/shelf/<slug>` (`clover-minded`, `four-in-a-row`). `/games` and `/games/<Id>` redirect, so old links and bookmarks keep working. The tab title is the game's name (`gameTitleResolver`).
- Game page: box, status, facts, tags, Host / Try it early, Join with a code; then how it plays, scoring and similar games. Guides for the five playable games come from the backend services (FarkleService, YachtGameService, BabbleService, CloverMindedGameService, FourInARowGameService); other games show the generic game-night steps. The old page's invented stats ("Best score 120", "45% win rate") and news posts are gone.
- Countdown: the server now owns it. `Room.RoundStartTime` is broadcast, saved and restored with the room; `IGameService.RoundLeadInSeconds` (Babble: 3) delays play and the round end by the lead-in, so it no longer eats play time. Pausing during the lead-in shifts the start on resume. The Table and Hand screens show only what is left of it, so a refresh no longer replays it. Clients compare against their own clock, as the round timer already did.
- Game room on phones: light room header and tab bar, slim host-controls bar, Babble Hand restyled to the approved Hand look (letters hidden instead of blurred before play). Result cards no longer nest buttons inside a button.
- Spacing: Shelf filters fold behind a Filters button on phones and the search hint is shorter; Shelf, game page and About gaps and paddings reduced, with phone-specific values.
- Found and fixed: game slugs mangled "FourInARow" until a second split rule was added.

## 2. Blockers & Risks (4a)
- None. Realtime multiplayer e2e specs need the backend running and were not run locally.

## 3. Quick Wins (4b)
- Included: unique, checked slugs for all 25 games; Babble result cards made keyboard-valid; tab bar `aria-current`.

## 4. Deferred Items (4c)
- Babble Table (TV) screen and the room menu drawer still use the old dark style.
- Other games' Hand screens still need the same restyle as Babble.
- Clients trust their own clock for round timing; a server time offset would make countdowns exact on badly set devices.
- Unused `core/components/navbar` could be deleted.
