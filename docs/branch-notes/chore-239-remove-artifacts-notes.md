# chore/239-remove-artifacts: Branch Notes

Fixes #239. Removes committed build logs and third-party PDFs from git (files kept on disk).

## Discoveries & Deviations
- Removed from index (`git rm --cached`): `backend/BoardGameHub.Api/build_error.txt`, `build_output.txt`, `startup_log.txt`, `startup_log_2.txt`, `backend/coverage_summary.csv`, `frontend/So Clover! Rules.pdf`, `frontend/rule_fakeartist_e.pdf`, `docs/Farkle-Rules.pdf`.
- `.gitignore` gained a `# Local artifacts and third-party rulebooks` section covering the same paths (globs for the build/startup logs).
- Rechecked tracked code, docs, and build configuration after merging current `origin/dev` (through `f289a45`): no references to these artifact paths; `pages_build_output_dir` is an unrelated configuration key. No application or documentation links needed changes.
- Restored all eight ignored local copies from the original checkout into `.worktrees/audit-239/` at their original relative paths; verified byte lengths and SHA256 hashes match (2026-11-16). No existing differing copy was overwritten.
- Verification passed: `git ls-files` returns none of the eight paths, `git check-ignore` matches all eight, and `git diff --check` is clean. Builds and tests were not rerun because the cleanup changes no executable code or referenced build inputs.

## 4a Blockers & Risks
- No blockers. Preserved copies are local ignored files, not a remote backup; fresh clones will not contain them. Existing Git history is unchanged.

## 4b Quick Wins
- None.

## 4c Deferred Items
- None.
