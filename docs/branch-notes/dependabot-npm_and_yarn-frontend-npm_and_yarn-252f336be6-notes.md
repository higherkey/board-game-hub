# Branch Notes: dependabot/npm_and_yarn/frontend/npm_and_yarn-252f336be6

## 1. Discoveries & Deviations
- **Peer Dependency Conflict:** Dependabot grouped update attempted to bump `@angular-devkit/build-angular` to `22.1.3` while core Angular packages remained on `21.2.x`, triggering `npm error ERESOLVE: Conflicting peer dependency`.
- **SonarCloud Action Deprecation:** GitHub Actions deprecated `SonarSource/sonarcloud-github-action@master` in favor of `SonarSource/sonarqube-scan-action@v5`.

## 2. Blockers & Risks (4a)
- None. All peer dependency conflicts resolved and pipeline actions updated.

## 3. Quick Low-Complexity Opportunities (4b)
- [x] Aligned `@angular/*` dependencies to `^21.2.5` and `@angular-devkit/build-angular` to `^21.2.0`.
- [x] Regenerated clean `frontend/package-lock.json`.
- [x] Replaced deprecated `sonarcloud-github-action` with `SonarSource/sonarqube-scan-action@v5` in `.github/workflows/sonar.yml`.

## 4. High-Complexity / Breaking Deferred Opportunities (4c)
- None.
