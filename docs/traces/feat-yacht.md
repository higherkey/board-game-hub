# Yacht implementation trace

Issue: #36 (Work on Yacht). Base: dev. Branch: feat/yacht.

## Scope
Review open issues and the repository implementation; create a playable new backlog game. Implement Yacht from its existing design with authoritative dice/scoring, Table/Hand views, full-game completion, catalog registration, persistence/reconnect support, tests, and documentation.

## Decisions
- Select Yacht among the concept-only backlog entries; current open PRs do not implement it.
- Exclude Table devices from the stable 1–8 participant order.
- Keep all 13 category turns inside one untimed platform round, ending only when all scorecards are complete.
- Preserve existing enum values; append Yacht as 18.
- Mark catalog status Testing through a reversible data-only migration.

## Validation
- Full backend suite: 423 passed, including 51 Yacht scoring/action/persistence cases and one room integration test.
- Production frontend build: pass, including final frontend edits after restoring dependencies with npm ci.
- EF pending-model check: no changes after EnableYacht migration.
- Yacht frontend interaction specs: 8 passed in an auxiliary Node/Jasmine/jsdom runner using the actual component/template.
- Browser Karma attempt: blocked by executor Chromium launch restrictions. The jsdom launcher cannot execute Angular module scripts, so the supplemental runner bundles the specs with esbuild, inlines their component resources, and runs Jasmine directly; no runner dependencies or package-lock changes are committed. Retain the standard Karma specs for CI Chrome.

## Review limits
No production database migration, merge, or production deployment is part of this feature branch. Physical multi-device playtesting remains necessary before promotion from Testing.

## Peer review follow-up (uncommitted)
- Apply the explicitly requested ai-standards peer-review-with-quality workflow, domain audits, and independent adversarial review.
- Fix three confirmed integration bugs: stale socket IDs after reconnect/undo, null category keys from merge patches, and invalid player counts mutating room startup. Restore player scores during undo.
- Add regression coverage: full local backend suite now passes 426 cases; new frontend null-tombstone spec compiles but local Chrome execution is blocked.
- Published head dd4cc29: all CI workflows pass; 423 backend tests, 419 Chrome tests, 1 skipped baseline test; Sonar gate passes with 93% new-code coverage, 0% duplication, 0 security hotspots, 5 accessibility annotations.
- Prepare native semantic markup for Sonar findings; retain keyboard focus on scrollable score region intentionally. Updated Sonar analysis, breakpoint/keyboard visual checks and LCP traces remain unverified. No strict quality sign-off.
- File deferred warning debt as #225 under the invoked workflow.
- Receive explicit user approval to publish and merge into dev. Proposed commit: fix(yacht): Preserve playable state across reconnects and room updates.

## Feature-tracking readiness check
- Read higherkey/ai-standards skills/feature-tracking/SKILL.md and reconcile the actual unstaged diff with all four numbered branch-note sections.
- Move locally completed review fixes into 4b; preserve unresolved browser/manual/Sonar gates in 4a and existing issue references with labels/sizes in 4c.
- User approves commit/push and dev merge. Run remote CI after publication and preserve Testing status and documented visual/playtesting limits.

## Approved publication
- Integrate origin/dev (including #227 bounded UndoHistory) before publication; remap snapshots through its public Clear/Push interface, preserving newest-first order and capacity.
- User explicitly authorizes PR publication and merge into dev; retain Testing status and release/playtesting limitations.
