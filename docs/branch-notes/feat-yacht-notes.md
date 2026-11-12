# feat/yacht

## Discoveries & Deviations
- Review the 81 currently open issues and the open PR list. Several older “Complete” issues already have services/components; new-game issues #30–#37 remain concept-only. Select #36 (Yacht) as a bounded new game with a complete rules spec and an existing dice-game integration pattern. No explicit ordering or priority is attached to these issues.
- Implement the README’s 13-category rules, including repeat Yacht and Joker handling, rather than a simplified eight-category Yacht variant.
- Use one role-aware component registered for both Table and Hand; respect IsScreen and gate actions on both client and server.
- Persist TotalRounds in backend GameSettings (the frontend already sends it), and give untimed games no deadline. Yacht manages 13 turns inside one platform round.
- Add an awaitable SignalR action method while preserving the existing fire-and-forget API for other games.

## Blockers & Risks (4a)
- Browser-backed frontend tests cannot launch Chromium in this executor (process singleton socket denied). The 8 Yacht interaction specs pass with an auxiliary Node/Jasmine/jsdom runner, which verifies DOM behavior but not layout in a browser.
- Existing dependency warnings include SignalR.Common vulnerability NU1903; dependency upgrades are outside this game slice.
- Leave the game in Testing until multiplayer browser playtesting confirms layout and interactions on physical Table/Hand devices.

## Quick Wins (4b)
- Explicit zero-score confirmation, server-authoritative previews, accessible die labels/pressed states, touch-sized controls, and tied winners.
- Include a catalog-only EF migration and snapshot alignment so existing databases expose the game.

## Deferred Items (4c)
- AFK timers/removal policies remain #134; disconnected players retain their turn until reconnecting.
- Optional audio, physical dice animation, and broader shared spatial primitives remain platform work (#133/#135/#187).
