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
