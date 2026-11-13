# Branch Notes: fix/ui-quality-hero

## 1. Discoveries & Deviations
- Repair confirmed UI/a11y/LCP and Sonar gate findings; refine the shared hero's room scene, phase sequencing and desktop column alignment.
- Isolated worktree preserves active spacing PR #243 and its shared-checkout edits. Reconcile with that PR before delivery.
- Join progress outlasted the relative Play label; explicit phase boundaries now wait for completed animation content. Host shows a waiting room and desktop progress bars align.
- Fix room-code cap submission, native filter keyboard activation, navigation state/focus, contrast and touch targets. Lazy-load GameRoom and preload the actual WOFF2 fonts.
- Restore the mandated unified .NET Sonar scanner and enforce its quality gate; authenticated diagnostics report issue metadata without source or secrets.

## 2. Blockers & Risks (4a)
- Sonar dev gate reports new-code reliability C; CI diagnostics and the enforced quality gate must pass before merge.
- Preserve Table/Hand behavior, branded visual direction, hero pause/seek/resize and reduced-motion support.

## 3. Quick Wins (4b)
- Passed: full frontend suite (488 passed, one existing skip), hosted dev build, 10 hero/accessibility browser tests, six catalogue browser tests and three diagnostic script tests.
- Axe/responsive checks: Home and Games at 360/768/1024/1440px have no reported violations, overflow or undersized visible targets. Initial main bundle falls from about 955KB to 425KB raw.
- Before/after deployed mobile LCP measurement remains pending the PR preview; local uncompressed delivery is not a fair comparison.

## 4. Deferred Items (4c)
- Physical-device and screen-reader testing are not covered by automated Chrome checks.
