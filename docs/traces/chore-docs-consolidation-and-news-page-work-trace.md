# Work Trace: feat-docs-consolidation-and-news-page

## 1. Overview
Establish canonical documentation architecture with `PROJECT.md` at repo root, trim bloated AI instruction files (`AGENTS.md`, `GEMINI.md`), reorganize `/docs`, create an unlisted `/news` updates page, and set up automated user-facing changelog syncing.

## 2. Completed Milestones
- [x] Merged PR #170 (Event-Driven State Engine) into `dev`.
- [x] Initialized branch `chore/docs-consolidation-and-news-page`.
- [x] Streamlined `AGENTS.md` and `GEMINI.md` to centralize canonical instructions with zero bloat.
- [x] Updated `README.md` and `CONTRIBUTING.md` to formally document the 3-tier GitFlow Release Train pipeline (SemVer 2.0.0).
- [x] Updated `.github/workflows/auto-version.yml` with `append_to_pre_release_tag: dev` and `staging` support.
- [x] Implemented standalone `NewsComponent` (`/news`), styling, and `news.json` data source.
- [x] Added subtle footer links to `/news` from the Beta version badge and legal navigation column.
- [x] Updated `sitemap.xml` with `/news` entry.
- [x] Added `NewsComponent` unit tests (100% pass rate).
- [x] Added `sync-news.yml` GitHub Actions workflow for production news automation.
- [x] Verified clean frontend build (0 warnings) and 327 Karma tests passed.

## 3. Verification & Quality
- Verify Angular build: `npm run build`
- Verify Karma tests: `npm test`
- Execute `/plan-review`, `/ci-cd-and-automation-slim`, and `/peer-review-with-quality`.
