# Branch Notes: refactor/219-room-lifecycle

## Discoveries & Deviations
- Keep legacy State=Finished; add authoritative nullable ResultPhase=RoundResults/GameOver and schema-2 room envelopes, with schema-1 hydration support.
- Keep history recording (#238) as a dependent PR; leave the earlier audit worktree unchanged.
- Verify clean solution/frontend builds, 643 backend tests, 554 frontend tests (one existing skip), four live multiplayer checks with both Table and Hand hosts, and Sitewright audits for all nine changed templates.

## Blockers & Risks (4a)
- Preserve explicit result decisions across edited settings; classify legacy snapshots after plugin hydration. Old clients remain readable but must refresh for the new PlayAgain command.
- Keep the original checkout and unrelated README changes untouched; stop at verified PRs without merging or deploying this slice. Physical-device, screen-reader and hosted-environment checks remain manual.

## Quick Wins (4b)
- Include null-settings lobby readiness (#66), repeated-score protection, Wisecrack fixed-three rounds, the duplicate Scatterbrain round increment, and native Sushi final-score synchronization without duplicate pudding points.
- Close post-finish gameplay mutations under the room lock while retaining explicit result review; reject stale Farkle callbacks and record undo snapshots only for accepted actions.
- Fresh adversarial review passes after terminal-action and undo-liveness remediation.
- Explicitly mark unawaited SignalR navigation promises in game result handlers with `void` to satisfy SonarCloud typescript:S9383.

## Deferred Items (4c)
- Keep per-connection hidden-information filtering (#188) separate from lifecycle and history work.
- Keep strict crash-safe history delivery/outbox design outside this slice; existing asynchronous room persistence has queue-loss, crash and TTL windows. Track the limitation in dependent #238.
- Existing game completion issues cover separate defects found during verification: #15 Scatterbrain Hand SubmitAnswers sends SUBMIT_ANSWERS/object while the plugin accepts SUBMIT_ANSWER/array; #28 GreatMinds wrapper routes board/hand by isHost rather than IsScreen (also #166/#186 role migration). Do not close those game issues with this lifecycle PR.
- Existing #166/#186 also cover dynamic game input mismatches seen as NG0303 warnings in the real browser trace; lifecycle synchronization passed those warnings, but this PR does not certify all game UI contracts.
