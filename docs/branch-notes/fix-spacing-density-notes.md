# Branch Notes: fix/spacing-density

## 1. Discoveries & Deviations
- Follow merged ai-standards PR #27; local skills checkout predates spacing guidance.
- Plan/design review: change XL from 2.5rem to 2rem, remove duplicate auth/404 gutters and content viewport minima, reduce mobile Home/About/footer spacing, tighten News header spacing. Preserve hero composition and Table/Hand shells.
- Tracking at 0.12-0.15em belongs to uppercase labels/room codes, not mixed-case copy; preserve it (source/template audit plus d1 advisory P=0.991, cost $0.00000234).
- Rendered checker: eight public routes at 1366x768 and 360x800 using isolated empty API fixtures (bundled catalogue/news render normally). News mobile text width 62% -> 75%; About 74% -> 81%; auth form width 294px -> 326px. First-screen headings/actions present on all routes.
- Intentional checker flags: app-shell full viewport on all routes; Games mobile median text width 61% reflects icon/title rows (full-width descriptions remain readable); desktop 404 empty band 224px includes decorative dice and footer boundary. Preserve these compositions; raw strict check is not flag-free.
- Build passes; Karma 484 pass, one existing skip (Playwright Chromium with ChromeHeadlessNoSandbox after system Chrome GPU launch failure); eight existing Home Playwright checks pass. No overflow across seven routes at 360/768/1024/1366/1440px; menu and keyboard 404 return checks pass. Static Sitewright audit passes all ten modified UI files; token/typography tools executed without replacing brand/font choices.

## 2. Blockers & Risks (4a)
- No implementation blockers. UI checks use HTTP fixtures, not a running backend; multiplayer/device hardware behavior is outside this CSS-only change.

## 3. Quick Wins (4b)
- 404 return CTA stays on one line at 360px; responsive card padding leaves room for readable copy.

## 4. Deferred Items (4c)
- Existing News contrast/theme mismatch is outside spacing scope (candidate: align News with shared theme tokens; UI/medium). No palette or typography redesign in this PR.
- Preserve the separate design-concept route; no merge or deployment authorized.
