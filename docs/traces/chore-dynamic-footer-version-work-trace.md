# Work Trace: chore-dynamic-footer-version

## 1. Overview
Dynamically display application version in the site footer chip and bind to target release environments, replacing hardcoded static version text.

## 2. Discoveries & Deviations
- Added `version` property to `src/environments/environment*.ts` configuration files (`v0.29.0-dev` on dev, `v0.29.0-rc` on staging, `v0.25.0` on prod, `v0.29.0-local` on local).
- Injected `environment.version` in `LayoutComponent` to expose `version = environment.version`.
- Updated `LayoutComponent` template and unit test to verify version rendering in the footer chip.

## 3. Verified Gates
- Frontend Unit Tests: LayoutComponent spec updated and passing.
- Frontend Build: Succeeded for development, staging, and production configurations.

## 4. Associated Issue
N/A (Chore)
