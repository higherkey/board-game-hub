# Branch Notes: fix/114-undo-vote-feedback

## 1. Discoveries & Deviations
- #114: SubmitUndoVote returns a locked-in Pending/Passed/Failed result; hub retains UndoVoteFinished with one string argument; existing ToastService shows restored/rejected feedback and neutral legacy completion.
- Check all origin branches: dev is base; main/staging are older deployment history; fix/render-port-standardization-8080 touches deployment only. PR #190 dependency changes are package manifests only.
- PR #224 Yacht overlaps RoomService timer setup and SignalR submitGameAction, outside this patch. No remote branch implements #114; exclude Yacht/Four in a Row and #113 history hunks.

## 2. Blockers & Risks (4a)
- Full backend suite: 375 passed; API project and solution builds pass (solution requires -m:1 in this executor). Production Angular build passes. All 43 SignalRService specs pass in supplementary Jasmine/jsdom runner, including five outcome/legacy cases.
- Standard Chromium/Karma and multi-device visual testing remain unavailable in this executor; supplementary specs exercise real transport callbacks but do not verify browser rendering.
- Existing .NET warnings remain: SignalR.Common advisory, obsolete Npgsql certificate option, xUnit blocking-task analyzer. No new package changes. SonarCloud gate is not run locally.

## 3. Quick Wins (4b)
- Report failed restoration as Failed rather than success; ensure cleared vote is marked dirty even when restoration fails.
- Regression tests cover pending/pass/reject/restore failure/late vote, event payloads, legacy payloads, and restored RoundNumber.
- Adversarial senior review approves contract/lock correctness; incorporate real restored-state assertion.

## 4. Deferred Items (4c)
- None.
