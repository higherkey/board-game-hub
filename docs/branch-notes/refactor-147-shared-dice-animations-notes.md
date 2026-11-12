# Branch Notes: refactor/147-shared-dice-animations

## 1. Discoveries & Deviations
- #147 baseline production build: Hand optimized CSS 9,311 bytes. Moving roll keyframes alone cannot achieve the requested 8 kB target; component-local Sass imports still duplicate emitted CSS.
- Load namespaced `bgh-dice-roll` once from `styles/_dice-animations.scss`; load unchanged shared dice geometry once under `:where(app-farkle-hand, app-farkle-table)`. Local geometry overrides retain higher specificity, and unrelated games stay outside the host scope.
- Production build passes: optimized Hand CSS 6,914 bytes (25.7% smaller), Table 5,367 bytes. Emitted component animation references the unscoped global name; exactly one global keyframe definition exists.
- Review open PRs #224 (Yacht), #190 (dependencies), local/remote branches; no overlapping dice abstraction or dependency/configuration change. Keep Four in a Row and unrelated active fixes outside this branch.

## 2. Blockers & Risks (4a)
- Standard full Karma run compiles but Chromium cannot launch (`socket() failed: Operation not permitted`); browser suite, visual animation/mobile rendering and SonarCloud remain unverified here.
- Auxiliary Node/Jasmine/jsdom execution passes all 11 existing Farkle Hand/Table specs with actual templates and compiled component Sass. The harness restores constructor metadata omitted by esbuild; it is supplemental and does not validate browser layout.

## 3. Quick Wins (4b)
- Reuse the existing shared dice partial instead of adding a component or duplicating dice styles. Preserve global reduced-motion handling, keyframe transforms/timing, focus styling and all markup.

## 4. Deferred Items (4c)
- No new issue candidates. Require real-browser animation/reduced-motion and Table/Hand rendering checks before merge.
