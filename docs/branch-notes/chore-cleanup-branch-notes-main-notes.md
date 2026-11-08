# Branch Notes: chore/cleanup-branch-notes-main

> **Branch:** `chore/cleanup-branch-notes-main`  
> **Base Branch:** `dev`  
> **Delivery Target:** Pull Request into `dev`  
> **Issue:** Fixes #220  

---

## 1. Discoveries & Architectural Context
- PR #216 (`chore(ci): Remove legacy trace workflows and documentation`) removed `.github/workflows/cleanup-traces.yml`, which previously pruned both traces and branch notes on `main` and `dev`.
- Branch notes are mandatory on prefixed branches (`feat/`, `fix/`, `chore/`) but should never reach `main`.
- First approach pruned on push to `main`. Rejected: the bot commit exists only on `main`, so `main` diverges from `staging` and `dev` and needs back-merges. The release train is `dev` → `staging` → `main`, and `main` must stay an ancestor of `dev`.
- Final approach: `.github/workflows/cleanup-branch-notes.yml` prunes `docs/branch-notes/` (except `.gitkeep`) on every push to `dev`, matching how the old `cleanup-traces.yml` pruned `dev`. Notes are already gone when `dev` is promoted, so `main` never gets a bot commit.
- Guard `if: github.ref == 'refs/heads/dev'` and a hardcoded `origin dev` push target keep a manual `workflow_dispatch` from pruning any other branch.
- `touch docs/branch-notes/.gitkeep` keeps the directory tracked even if `.gitkeep` was missing.
- Hotfix branches merge straight into `main`, bypassing `dev`; policy says to remove their notes before merging.
- Documented the lifecycle policy in `CONTRIBUTING.md` §6 and `AGENTS.md`.

---

## 2. 4a Blockers
- None.

---

## 3. 4b Quick Wins
- Added `[skip ci]` to the automated cleanup commit to prevent unnecessary CI triggering on `dev`.
- Added `workflow_dispatch` to `.github/workflows/cleanup-branch-notes.yml` for manual execution when needed.
- Pruned obsolete untracked branch notes from prior merged branches in the working tree.

---

## 4. 4c Deferred Items
- #219: `refactor(rooms): Split Finished into between-rounds and game-over states`.
- #218: `fix(auth): Revisit auth token storage and refresh`.
- #215: Render dev database connection update and active room persistence (pending manual dashboard configuration).
- Manual: Watch the first `Cleanup Branch Notes on Dev` run after this PR merges to confirm the bot push to `dev` succeeds and this file is removed.
- Manual: #220 closes on promotion to `main` (GitHub ignores `fixes #220` on `dev`); close it manually if needed sooner.

---

## 5. Verification
- Validated `.github/workflows/cleanup-branch-notes.yml` syntax via `js-yaml`.
- Executed the prune commands against a throwaway git repo (top-level and nested notes plus `.gitkeep`): notes and the empty subfolder were deleted, `.gitkeep` was kept, and `git status --porcelain` reported only the deletions.
- Not yet verified on GitHub: the bot push to `dev` happens only after merge; prior bot pushes from the removed `cleanup-traces.yml` (e.g. `333caf3`) show the token can push. See the 4c item for the first-run check.
- Backend tests and the frontend build are unaffected by this change (no app code touched).
- Checked documentation links and formatting.
