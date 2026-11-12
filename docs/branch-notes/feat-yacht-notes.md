# Branch Notes: feat/yacht

## 1. Discoveries & Deviations
- Integrate dev PR #227 and preserve its bounded UndoHistory abstraction when remapping reconnect snapshots; avoid replacing it with a Stack.
- Review the 81 currently open issues and the open PR list. Several older “Complete” issues already have services/components; new-game issues #30–#37 remain concept-only. Select #36 (Yacht) as a bounded new game with a complete rules spec and an existing dice-game integration pattern. No explicit ordering or priority is attached to these issues.
- Implement the README’s 13-category rules, including repeat Yacht and Joker handling, rather than a simplified eight-category Yacht variant.
- Use one role-aware component registered for both Table and Hand; respect IsScreen and gate actions on both client and server.
- Persist TotalRounds in backend GameSettings (the frontend already sends it), and give untimed games no deadline. Yacht manages 13 turns inside one platform round.
- Add an awaitable SignalR action method while preserving the existing fire-and-forget API for other games.

## 2. Blockers & Risks (4a)
- Updated full browser suite cannot run locally: Chromium process-singleton socket denied. Earlier 8-spec DOM run and published-head CI do not verify the new regression spec or semantic markup; rerun browser CI after publication.
- Existing backend warnings (including NU1903) remain; track remediation in #225. Full local backend suite before dev integration: 426 pass; rerun after integrating #227 passes. Published-head CI: 423 backend and 419 browser tests pass, one pre-existing frontend spec skipped. Updated frontend regression execution remains blocked by Chromium launch restrictions.
- User authorizes dev merge with Testing status; multi-device playtesting, keyboard/breakpoint checks and LCP measurements remain release limitations. Verify updated browser CI before merge.

- Published-head Sonar quality gate passes (93% new-code coverage, 0% duplication, 0 security hotspots). Five new accessibility annotations are reviewed; semantic corrections are prepared locally, but their updated Sonar result is pending publication. This is not a strict quality sign-off.

## 3. Quick Wins (4b)
- Included locally (uncommitted): repair reconnect/undo snapshot IDs and restore player scores; reject invalid Yacht counts before room mutation; ignore null category tombstones from SignalR patches. Add three backend regression cases and one frontend regression spec.
- Use native fieldset/output/section markup following Sonar annotations. Retain tabindex=0 on the scrollable score region for cross-browser keyboard access; review that remaining static-analysis warning as an accessibility exception rather than removing keyboard access.
- Explicit zero-score confirmation, server-authoritative previews, accessible die labels/pressed states, touch-sized controls, and tied winners.
- Include a catalog-only EF migration and snapshot alignment so existing databases expose the game.

## 4. Deferred Items (4c)
- #134: AFK timers/removal policies (enhancement, medium); disconnected players retain their turn until reconnecting.
- Optional audio/physical dice/shared spatial primitives: existing #133/#135/#187 (enhancement, medium); outside this game slice.
- #225: Resolve baseline backend dependency/compiler warnings (technical-debt, small).
- #41: Restore the pre-existing skipped exitGame browser spec (testing, small); no duplicate issue.
