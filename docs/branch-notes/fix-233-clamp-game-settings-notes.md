# Branch notes: fix/233-clamp-game-settings

## Discoveries & Deviations
- Reuse `GameSettings.Clamp()` for supplied and retained settings before starting a round; cap rounds at 20 as required by #233.
- Verify supplied BoardSize 40000 and retained out-of-range settings produce a 36-letter Babble grid without resetting retained round progress or player totals.

## 4a Blockers & Risks
- None. Standard testhost initially failed on parent-process access; the official MSTest.EnableParentProcessQuery opt-out in ignored generated runtime configuration allowed all 490 backend tests to pass. No tracked runner configuration changes.

## 4b Quick Wins
- Canonicalize settings room-code lookups; cover padded lowercase input and align the shared hunk with #235.
- Reject null settings updates before any room mutation; test valid game options remain unchanged by clamping.

## 4c Deferred Items
- Existing #66 readiness follow-up: StartGame(null) from the lobby bypasses readiness; leave this separate from settings validation.
