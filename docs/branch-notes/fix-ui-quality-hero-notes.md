# Branch Notes: fix/ui-quality-hero

## 1. Discoveries & Deviations
- Repair confirmed UI/a11y/LCP and Sonar gate findings; refine the shared hero's room scene, phase sequencing and desktop column alignment.
- Isolated worktree preserves active spacing PR #243 and its shared-checkout edits. Reconcile with that PR before delivery.
- Join progress outlasted the relative Play label; explicit phase boundaries now wait for completed animation content. Host shows a waiting room and desktop progress bars align.
- Fix room-code cap submission, native filter keyboard activation, navigation state/focus, contrast and touch targets. Lazy-load GameRoom and preload the actual WOFF2 fonts.
- Restore the mandated unified .NET Sonar scanner and enforce its quality gate; authenticated diagnostics report issue metadata without source or secrets.
- Authenticated diagnostics identified 27 existing dev reliability findings: floating promises, async OnInit and a pointer-only Clover slot. Add rejection handling, synchronous lifecycle subscriptions and a native keyboard control.

## 2. Blockers & Risks (4a)
- Initial PR analysis: reliability A, new coverage 68% (required 80%). Add missing keyboard/focus and failure-path coverage; CI gate must pass before merge.
- Preserve Table/Hand behavior, branded visual direction, hero pause/seek/resize and reduced-motion support.

## 3. Quick Wins (4b)
- Passed: full frontend suite after reliability fixes (509 passed, one existing skip), hosted dev build, 10 hero/accessibility browser tests, six catalogue browser tests and three diagnostic script tests. Focused tests cover rejected controls/redirects, pending startup destruction, native slot controls and tray timer cleanup.
- Axe/responsive checks: Home and Games at 360/768/1024/1440px have no reported violations, overflow or undersized visible targets. Initial main bundle falls from about 955KB to 425KB raw.
- Deployed preview mobile lab medians (360x800, 150ms latency, 1.6Mbps, CPU4x, cold cache, three samples): Home LCP 5124→3988ms (22.2% faster), Games 4828→3700ms (23.4% faster). CLS remains 0.0019/0.0012; lab results are not field p75.

## 4. Deferred Items (4c)
- Physical-device and screen-reader testing are not covered by automated Chrome checks.
