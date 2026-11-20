# Branch Notes: feat/play-connected-hero

Bring the approved brand design into the live site: the "Play Connected." Home hero with the Host → Join → Play animation in the hard-edged parchment style, art-led game boxes, the Shelf (formerly Games), the expanded About page, and removal of glassmorphism.

## 1. Discoveries & Deviations
- Kept the existing GSAP choreography (cursor picks a game, room code and QR appear, phones scan and type, cards fly to the table); only markup order, copy and styles changed.
- Hand cards no longer tilt: side cards sit lower and muted, matching the "no off-kilter elements" rule.
- Site background (`assets/background-poly.svg`): crisp tangram pieces in navy, teal and pink that step down in three hard bands toward the centre. `body::before` sizes it `100% 100%` so the side bands and 160px tile keep their real size.
- Design review: the headline sizes to its own column above 992px, the pause link drops the global `.btn` shadow, and background triangles are light enough to keep body text at APCA Lc 75+.
- `GameBoxComponent` (`shared/components/game-box`): drawn covers for Farkle, Yacht, Babble, Clover-Minded, Four in a Row, Warships, Pictophone and Nom de Code; every other game gets a stable seven-piece tangram cover in one of eight colours, chosen from a hash of its id. Colours live in `src/styles/_game-themes.scss`, applied by class, so no inline styles. Replaces the emoji icons on Home and the Shelf.
- Shelf: search covers names, descriptions and tags; filters for player count and length; playlists derive from existing tags and player ranges. "Most played", "Newest" and "Where?" from the canvas are left out because no data backs them yet. The URL stays `/games`; the nav label and page title change to "Shelf" / "The shelf".
- Toast flood root cause: `ToastService.show` stacked a new toast per failed request. It now skips a toast whose message and type are already showing.
- Router now has `anchorScrolling: 'enabled'` so Home's "How it works" lands on `/about#how-it-works`.

## 2. Blockers & Risks (4a)
- None. Realtime multiplayer e2e specs need the backend running and were not run locally; they don't touch the changed pages.

## 3. Quick Wins (4b)
- Included: headline overlap fix, pause-link shadow, background contrast tune, phone caption size (0.9375rem), "Playable now" colour darkened to Lc 84 on parchment.
- Included from review: toast de-duplication, blur removed from host settings, Farkle overlay, News cards and social sidebar.

## 4. Deferred Items (4c)
- News page still uses its dark slate card theme (now solid, no blur); a full brand restyle is separate work.
- Game detail page (`/games/:id`) still uses the old layout and emoji icon; the canvas has a GameDetail design.
- Unused `core/components/navbar` still says "Games"; it isn't rendered anywhere and could be deleted.
