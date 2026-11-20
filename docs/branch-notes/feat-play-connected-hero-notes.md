# Branch Notes: feat/play-connected-hero

Restyle the Home hero to the approved brand design: "Play Connected." headline, one-sentence intro with Host and Join beside it, and the existing Host → Join → Play animation redrawn in the hard-edged parchment style. Remove glassmorphism from the site header.

## 1. Discoveries & Deviations
- Kept the existing GSAP choreography (cursor picks a game, room code and QR appear, phones scan and type, cards fly to the table); only markup order, copy and styles changed.
- Hand cards no longer tilt: side cards sit lower and muted, matching the "no off-kilter elements" rule.
- Header blur (`backdrop-filter`) removed; header is a solid surface at rest and when scrolled.
- Site background (`assets/background-poly.svg`): the near-invisible side triangles are now crisp tangram pieces in navy, teal and pink that step down in three hard bands toward the centre; parchment and grain unchanged. `body::before` now sizes it `100% 100%` so the side bands and 160px tile keep their real size.
- Design review: the headline now sizes to its own column on screens wider than 992px (container units), so "CONNECTED." no longer runs under the intro between 993 and 1300px. Pause link drops the global .btn offset shadow. Teal background triangles lightened so body text stays at or above APCA Lc 75 over the texture.

## 2. Blockers & Risks (4a)
- None.

## 3. Quick Wins (4b)
- Included: headline overlap fix at 993–1300px, pause-link shadow removal, background contrast tune (see Discoveries).

## 4. Deferred Items (4c)
- Remaining glassmorphism outside Home: `backdrop-filter` in `host-settings.component.scss` (dialog backdrop), `farkle-hand.scss` (overlay), `news.component.scss` (dark translucent cards that need a restyle, not just blur removal) and `social-sidebar.component.scss`.
- Step caption descriptions drop to 0.85rem below 992px; they pass contrast but read small. Consider 0.9rem if the captions have room.
- With no backend running, Home stacks dozens of "A server error occurred" toasts (toast flood). Needs de-duplication in the error interceptor or toast service.
- Rest of Home (Table vs Hand cards, Featured Games) still uses the old card style; the approved design replaces them with the game-box shelf and a "How it works" band.
- Shelf page, art-led game boxes and About expansion from the design canvas are not built yet.
