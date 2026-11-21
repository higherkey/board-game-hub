# Branch Notes: feat/dice-tray

Add a reusable physics dice tray (`<app-dice-tray>`) and use it for Farkle (table and hand) and Yacht.

## 1. Discoveries & Deviations
- The server already decided every roll; what was missing was the throw. Farkle and Yacht now send `RollId`, which goes up on every server roll. The tray throws only when it changes, so a refresh or late join shows the dice at rest and never replays a throw.
- The throw is simulated off-screen with cannon-es, seeded from the roll id (same tumble on every screen), then each die's faces are turned inside its body so the server's value lands on top. Held dice are fixed bodies that thrown dice bounce off.
- Reusable inputs: any number of dice; `held` (out of the throw), `selected` (player's pick), `locked` (cannot tap); `motion` full / short / none; text faces instead of pips; tray and per-die colours; tray aspect; `gather` (slide into a row after a throw, on by default when dice are tappable). Outputs: `dieToggle`, `settled`.
- Phones get a table sized to the dice (about 40px dice on a 360px screen) and a gentler toss; the shared table keeps the full 16-die-wide tray.
- Tapping uses real buttons laid over each landed die (44px minimum), so touch, mouse and keyboard all work. Reduced motion, `motion="none"` or no WebGL show flat dice instead, with the same buttons.
- three.js and cannon-es are npm dependencies loaded in a lazy chunk (123 KB gzipped) only when a tray is on screen. The scene draws only while something moves.
- Yacht's dice were Unicode die characters; Farkle's were CSS cubes with a canned spin. Both replaced; the old dice styles and `_dice-animations.scss` are deleted.

## 2. Blockers & Risks (4a)
- None. Realtime multiplayer e2e specs need the backend and were not run locally. 3D throws were checked in Chromium with software rendering; real devices render faster.

## 3. Quick Wins (4b)
- Included: removed the Unicode dice in Yacht (no-emoji rule), deleted dead dice CSS.

## 4. Deferred Items (4c)
- Each screen renders its own tray, so very old phones pay for one WebGL context per tray on screen; fine for one tray per screen today.
- Dice values arriving while a throw is still in the air are shown when it lands, not re-thrown.
