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

---

## 5. Verification
- Validated `.github/workflows/cleanup-branch-notes.yml` syntax.
- Verified file pruning logic with `.gitkeep` preservation.
- Checked documentation links and formatting.
