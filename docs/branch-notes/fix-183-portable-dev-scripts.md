# Branch Notes: fix/183-portable-dev-scripts

**Issue**: [#183](https://github.com/higherkey/board-game-hub/issues/183)  
**Branch**: `fix/183-portable-dev-scripts`  
**Base**: `dev`  

## Objectives
- [ ] Make `dev-start-dev.ps1` portable using `$PSScriptRoot`.
- [ ] Make `dev-start-prod.ps1` portable using `$PSScriptRoot`.
- [ ] Remove `restart: unless-stopped` from `docker-compose.yml` to prevent background container auto-restarts.
- [ ] Provide a clean `dev-stop.ps1` script to gracefully tear down containers and processes.
- [ ] Verify execution syntax and test in PowerShell.

## Discoveries & Delta Notes
- Prior scripts hardcoded `C:\Programming\board game hub`.

## 4a Blockers
- None.

## 4b Quick Wins
- Changing to `$PSScriptRoot` makes the repository portable across any drive or developer machine.

## 4c Deferred Items
- None.
