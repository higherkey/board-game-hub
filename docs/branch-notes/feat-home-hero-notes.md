# Branch Notes: feat/home-hero

## 1. Discoveries & Deviations
- Promote PR #223's hero and the uncommitted polish in `Z:/Programming/board-game-hub-hero-polish`; leave that worktree untouched. No matching tracking issue exists.
- Extract `HomeHeroComponent` for Home and `/design-concept`; preserve Home's room-code validation, Table/Hand explanation, featured games and concept-route alias.
- Verification: production build passes; frontend 453 tests pass (1 existing skip), with coverage; backend 467/467 tests pass; Chromium 8/8 tests pass at 360/768/1024/1440px, including in-flight hit testing, live/static reduced motion, keyboard navigation, Home room entry and preserved lower sections. Independent adversarial review passes.
- Keep the polished cursor layering/measured glide, slower Host sequence, card-game selection and borderless responsive `cqi` panels; use existing Bootstrap icons.
- Preserve the existing brand tokens and fonts. Sitewright markup audits pass; compiled/minified hero CSS is 9.35 KB and Home CSS 7.20 KB, above its generic 6 KB ceiling but below this repository's 35 KB warning/45 KB error component budget. Do not split an existing coherent scene merely to satisfy a per-file audit.

## 2. Blockers & Risks (4a)
- Anonymous SonarCloud API returns "Project doesn't exist" for the workflow's project key; no local Sonar token is available. Inspect authenticated PR CI before claiming server verification.
- One pre-existing frontend unit test is skipped; no failures in the full suite.

## 3. Quick Wins (4b)
- Remove superseded Home animation markup/CSS and share all scene/playback code with the concept route.
- Fix clipping during Hand-to-Table card flight; add browser regression that hit-tests the card between devices.
- Handle live reduced-motion changes, observer/frame/timer cleanup, pause preservation and resize recovery; cover lifecycle in unit/browser tests.
- Improve narrow-screen room entry, focus/error accessibility, reduced-motion CTA behavior and inactive step-number contrast.

## 4. Deferred Items (4c)
- None. No new packages, migrations, or manual setup required.
