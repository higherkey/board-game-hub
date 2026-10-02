# Branch Notes: chore/139-update-angular-v22

- Issue: #139 (build: Update to Angular v22)
- Target: Upgrade frontend Angular framework and CLI dependencies from v21 to v22.

## Discoveries
- Ran `npx @angular/cli@22 update @angular/core@22 @angular/cli@22`, migrating all core Angular packages and dev tools to `22.2.1` and TypeScript to `~6.0.3`.
- Automated schematics applied clean migrations:
  - Added `withXhr()` to `provideHttpClient()` calls.
  - Safe navigation template syntax handling.
  - Added `istanbul-lib-instrument` for Karma coverage instrumentation.
  - Extended diagnostic settings in `tsconfig.app.json` and `tsconfig.spec.json`.
- Angular v22 CLI requires Node.js >= 22.22.3; updated `sonar.yml` to use `node-version: '22'` matching `deploy-frontend-cloudflare.yml`.
- Full build (`npm run build`) succeeded in 21s with zero errors or warnings.
- Frontend test suite (`npm test -- --watch=false --browsers=ChromeHeadless`) passed 384/384 tests.
- Backend test suite (`dotnet test backend/BoardGameHub.sln`) passed 352/352 tests.

## 4a: Blockers
- None.

## 4b: Quick Wins
- Zero manual migration regressions; schematics handled all deprecations cleanly.
- Resolved peer dependency mismatch from Dependabot's previous `@angular-devkit/build-angular` upgrade attempt.

## 4c: Deferred Items
- Optional migrations (`use-application-builder` and `migrate-karma-to-vitest`) deferred to separate future architectural spikes.
