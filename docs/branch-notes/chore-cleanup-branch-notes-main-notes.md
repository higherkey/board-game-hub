# Branch Notes: chore/cleanup-branch-notes-main

> **Branch:** `chore/cleanup-branch-notes-main`  
> **Base Branch:** `dev`  
> **Delivery Target:** Pull Request into `dev`  
> **Issue:** Fixes #220  

---

## 1. Discoveries & Architectural Context
- PR #216 (`chore(ci): Remove legacy trace workflows and documentation`) removed `.github/workflows/cleanup-traces.yml`, which previously pruned both traces and branch notes on `main` and `dev`.
- While branch notes at `docs/branch-notes/*.md` are mandatory during feature development on prefixed branches (`feat/`, `fix/`, `chore/`) and provide valuable context on `dev`, they should not accumulate indefinitely on `main` following milestone promotions.
- Untracked local notes accumulated in developer environments because there was no unified policy or dedicated automation for `main`.
- Created `.github/workflows/cleanup-branch-notes.yml` to automatically remove all files in `docs/branch-notes/` except `.gitkeep` on `push` to `main`.
- Documented the branch notes lifecycle policy in `CONTRIBUTING.md` and `AGENTS.md`.
- Added branch guard `if: github.ref == 'refs/heads/main'` and hardcoded push target `origin main` to prevent accidental manual `workflow_dispatch` triggers on `dev` or feature branches from deleting non-main branch notes.
- Added explicit `touch docs/branch-notes/.gitkeep` prior to staging to ensure directory tracking is never lost even if `.gitkeep` was missing.

---

## 2. 4a Blockers
- None.

---

## 3. 4b Quick Wins
- Added `[skip ci]` to the automated cleanup commit to prevent unnecessary CI triggering on `main`.
- Added `workflow_dispatch` to `.github/workflows/cleanup-branch-notes.yml` for manual execution when needed.
- Pruned obsolete untracked branch notes from prior merged branches in the working tree.

---

## 4. 4c Deferred Items
- #219: `refactor(rooms): Split Finished into between-rounds and game-over states`.
- #218: `fix(auth): Revisit auth token storage and refresh`.
- #215: Render dev database connection update and active room persistence (pending manual dashboard configuration).
- Manual: Watch the first `Cleanup Branch Notes on Main` run after the next `dev` → `main` promotion to confirm the bot push succeeds; then back-merge `main` into `dev`.
- Manual: #220 closes on promotion to `main` (GitHub ignores `fixes #220` on `dev`); close it manually if needed sooner.

---

## 5. Verification
- Validated `.github/workflows/cleanup-branch-notes.yml` syntax via `js-yaml`.
- Executed the prune commands against a throwaway git repo (top-level and nested notes plus `.gitkeep`): notes and the empty subfolder were deleted, `.gitkeep` was kept, and `git status --porcelain` reported only the deletions.
- Not yet verified: the full workflow (bot commit + push to `main`) runs only on `main`; prior bot pushes from the removed `cleanup-traces.yml` (e.g. `333caf3`) show `main` accepts them. See the 4c item for the first-run check.
- Backend tests and the frontend build are unaffected by this change (no app code touched).
- Checked documentation links and formatting.
