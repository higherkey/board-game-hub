# Branch notes: fix/235-room-membership-identity

## Discoveries & Deviations
- Membership requires the current room instance, its connection map entry, and a connected player seat; creator and host pointers cannot restore departed authority. Joined same-account Table hosts remain supported.
- Create/join reserve one connection map entry before room or seat mutation. Same-room retries preserve the seat and session; reconnects remove only the matching old room mapping and rotate the bearer token.
- Every hub room-code entry and service lookup uses trimmed invariant uppercase codes. Create/set/vote reject undefined enum values and keep the defined None lobby option.
- Leave broadcasts and group removal use the authoritative room returned by RemovePlayer. Offer, answer and ICE relay only between active room members.
- Player.UserId stays private; IsRegistered is public. Persistence round trips retain account/guest identity and SessionId; sidebar badge consumes IsRegistered.

## 4a Blockers & Risks
- No active blockers. Escalated execution and the generated runtime config resolved local tool restrictions.
- Clients that consumed userId must use isRegistered. Legacy guest seats with raw ids reconnect through SessionId.
- The local C: drive is full. Verification uses a worktree dependency junction with matching lockfile and redirected process temp/npm cache; dependencies are not reinstalled.
- Tests use the ignored generated runtime config MSTest.EnableParentProcessQuery=false to bypass this host's parent process query restriction; no tracked runner configuration changes.

## 4b Quick Wins
- Keep integration with #249/#250 independent: reject null settings before the normalized lookup and position admin enum regressions before existing tests. Follow-up backend build and all 13 affected tests pass.
- Skip the Cloudflare deploy step for draft PRs while keeping its build/tests active, as authorized.
- Add explicit 24px avatar dimensions matching existing CSS to clear the touched-template Sitewright audit without changing layout.
- Verify canonical code handling, defined enum inputs, active host authority, concurrent cross-room joins, same-room retries, reconnect mapping ownership, WebRTC relays, and persistence identity.
- Validation: backend build and all 511 tests pass; frontend production build and all 9 sidebar specs pass. Sitewright token contrast and typography assessment pass; touched-template audit reports zero errors. Fresh adversarial review reports no actionable findings.

## 4c Deferred Items
- Undo-majority reevaluation when membership changes remains with #77/#219; retain the existing history implementation in this fix.
