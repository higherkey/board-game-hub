# chore/239-remove-artifacts: Branch Notes

Fixes #239. Removes committed build logs and third-party PDFs from git (files kept on disk).

## Discoveries & Deviations
- Removed from index (`git rm --cached`): `backend/BoardGameHub.Api/build_error.txt`, `build_output.txt`, `startup_log.txt`, `startup_log_2.txt`, `backend/coverage_summary.csv`, `frontend/So Clover! Rules.pdf`, `frontend/rule_fakeartist_e.pdf`, `docs/Farkle-Rules.pdf`.
- `.gitignore` gained a `# Local artifacts and third-party rulebooks` section covering the same paths (globs for the build/startup logs).
- Reference grep (`git grep`) found no references to the removed files. The only hits were the game name "So Clover" in Clover-Minded docs/code and an unrelated `pages_build_output_dir` in `frontend/wrangler.jsonc`. No doc edits were needed.

## 4a Blockers & Risks
- None.

## 4b Quick Wins
- None.

## 4c Deferred Items
- None.
