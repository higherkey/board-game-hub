# Branch Notes: chore/cleanup-branch-notes-main

> Base: `dev` · Delivery: PR into `dev` · Issue: #220

## 1. Discoveries & Deviations
- #216 removed `cleanup-traces.yml`, which had pruned branch notes on `main` and `dev`; nothing replaced it.
- Deviation: the first approach pruned on push to `main`. Rejected because the bot commit exists only on `main`, so `main` diverges from `staging`/`dev` and needs back-merges. The release train is `dev` → `staging` → `main`, and `main` must stay an ancestor of `dev`.
- Final: `cleanup-branch-notes.yml` prunes `docs/branch-notes/` (except `.gitkeep`) on every push to `dev`. A `refs/heads/dev` guard and a hardcoded `origin dev` push stop a manual dispatch from pruning other branches. Notes stay readable in each PR's diff.
- Hotfix branches merge straight into `main`, bypassing `dev`; policy (`CONTRIBUTING.md` §6, `AGENTS.md`) says to remove their notes before merging.
- `feature-tracking` skill says notes are "Cleared from `main` automatically via GitHub Actions cleanup"; dev-side pruning meets that outcome, but the wording invites a main-side workflow.
- Verified: parsed the workflow and ran its real step scripts against a throwaway remote. Notes were pruned on `dev`, `.gitkeep` was kept, `dev` → `staging` → `main` fast-forwarded, and `main` had 0 commits missing from `dev`. No app code changed, so backend tests and the frontend build don't apply.

## 2. Blockers & Risks (4a)
- None. Risk: if `dev` has branch protection that requires PRs, the bot push fails; earlier bot pushes from `cleanup-traces.yml` (e.g. `333caf3`) suggest it does not.

## 3. Quick Wins (4b)
- `[skip ci]` on the bot commit; `workflow_dispatch` for manual runs; `touch .gitkeep` keeps the directory tracked.

## 4. Deferred Items (4c)
- CI check that fails PRs into `main` that add files under `docs/branch-notes/` (enforces the hotfix rule).
- Reword the `feature-tracking` skill's Persistence line in `higherkey/ai-standards` to "pruned on `dev`, never reaches `staging`/`main`".
- Manual: watch the first `Cleanup Branch Notes on Dev` run after merge; it should delete this file.
- Manual: #220 auto-closes only on promotion to `main`; close it by hand if wanted sooner.
