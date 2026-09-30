# Work Trace: fix/open-issues-remediation

Branch: `fix/open-issues-remediation`
Target: `dev`

## 1. Planned Work

### TODO List
- [x] Phase 1: Triage, Housekeeping & CI Hygiene
  - [x] Close resolved issues #80, #81, #117, #155, #8, #11
  - [x] Delete `admin_security_remediation_plan.md` from root
  - [x] Add CPD exclusions to `.github/workflows/sonar.yml` (#173)
- [x] Phase 2: P0 Security & Authorization Hardening
  - [x] Remove dev port bypass from `frontend/src/app/core/guards/auth.guard.ts` (#82)
  - [x] Enforce host auth inside `RoomService` & `GameHub` with Table/Hand support (#153)
  - [x] Create `UserDto` & `ChatMessageDto` & `FriendRequestDto` (#154)
  - [x] Implement `RemoveFriend` in `SocialService` & `SocialHub` (#63)
  - [x] Rate limit & sanitize `ClientLoggingController` (#86)
- [x] Phase 3: Concurrency, Reliability & Database Hardening
  - [x] Refactor synchronous `room.StateLock.Wait()` to 5-second timeout guards (#156)
  - [x] Implement room code collision retry loop (#89)
  - [x] Replace `new Random()` with `Random.Shared` across game services (#90)
  - [x] Replace `Console.WriteLine` with structured logging `ILogger` (#91, #111)
  - [x] Database migration: Deduplicate friendships & add non-blocking concurrent indexes (#158)
  - [x] Frontend RxJS subscription lifecycle cleanup with `takeUntilDestroyed` (#159)
- [x] Phase 4: Gameplay Mechanics & UI Polish
  - [x] Babble mobile host controls & grid visibility (#70, #68, #69)
  - [x] Room Menu native HTML `<dialog>` migration & focus management (#124, #146)

### File List
- Group 1 (CI & Housekeeping): `admin_security_remediation_plan.md`, `.github/workflows/sonar.yml`
- Group 2 (Security & Auth): `frontend/src/app/core/guards/auth.guard.ts`, `backend/BoardGameHub.Api/Services/RoomService.cs`, `backend/BoardGameHub.Api/Services/IRoomService.cs`, `backend/BoardGameHub.Api/Hubs/GameHub.cs`, `backend/BoardGameHub.Api/Models/Dtos/UserDto.cs`, `backend/BoardGameHub.Api/Models/Dtos/ChatMessageDto.cs`, `backend/BoardGameHub.Api/Services/SocialService.cs`, `backend/BoardGameHub.Api/Services/ISocialService.cs`, `backend/BoardGameHub.Api/Hubs/SocialHub.cs`, `backend/BoardGameHub.Api/Program.cs`, `backend/BoardGameHub.Api/Controllers/ClientLoggingController.cs`
- Group 3 (Concurrency & DB): `backend/BoardGameHub.Api/Services/*.cs`, `backend/BoardGameHub.Api/Data/AppDbContext.cs`, `backend/BoardGameHub.Api/Migrations/20260928230000_AddChatAndFriendshipConstraints.cs`, `frontend/src/app/features/pages/play-page/play.component.ts`, `frontend/src/app/features/game-room/game-room.component.ts`, `frontend/src/app/features/game-room/components/video-chat/video-chat.component.ts`, `frontend/src/app/features/pages/home-page/home-page.component.ts`, `frontend/src/app/features/active-games/active-games.component.ts`
- Group 4 (Gameplay & UI): `frontend/src/app/features/games/babble/babble-game/babble.component.html`, `frontend/src/app/features/games/babble/babble-game/babble.component.scss`, `frontend/src/app/features/game-room/components/room-header/room-header.component.html`, `frontend/src/app/features/game-room/components/room-header/room-header.component.ts`, `frontend/src/app/features/game-room/components/room-header/room-header.component.scss`

## 2. In Progress Work
- Work complete, ready for peer review & commit verification.

## 3. Completed Work
- **CI Hygiene**: Closed stale triaged issues, pruned stale doc, added CPD exclusions to Sonar workflow.
- **Security & Authorization**: Removed dev port auth bypass, secured all host lifecycle endpoints (`SetGameType`, `SetHostPlayer`, `UpdateSettings`, `StartGame`, `EndRound`, `NextRound`, `UniversalTranslatorForcePhase`, `NextWisecrackBattle`) with Table/Hand awareness, added caller membership check to `RoomService.SubmitAction`, masked sensitive user identity fields behind DTOs, implemented friend removal, rate-limited client logging partitioned by client IP.
- **Concurrency & Reliability**: Added 5-second timeouts to all `StateLock` waits, added room collision retry loop, converted RNG to `Random.Shared` across all game services and data generators, replaced `Console.WriteLine` with structured logging.
- **Database Hardening**: Created zero-downtime EF migration with `SET lock_timeout = '5s'`, status-preserving friendship deduplication, and non-blocking concurrent indexes.
- **Memory & RxJS Hygiene**: Connected unmanaged component subscriptions to `takeUntilDestroyed(destroyRef)` and converted nested observables to `map`.
- **UI & Accessibility**: Added mobile timer and host controls to Babble with >=44px touch targets, upgraded room navigation menu to native modal `<dialog>` with transparent overlay (preventing double backdrop tinting) and accessible focus management.
- **Test Coverage**: Added negative host authorization unit tests and positive verification in `GameHubTests.cs`, and tested state lock timeouts in `RoomServiceTests.cs`.

## 4. Issues and Out of Scope
- **4a) Potential Blockers**: Local environment lacks .NET 10 SDK (only .NET 8 runtime). Backend compilation and test suites are verified through GitHub Actions CI pipeline.
- **4b) Opportunities**:
  - Issue #92 (JWT in localStorage): Migrate to secure HttpOnly cookies alongside CSRF tokens.
  - Issue #178 (Client Logging Telemetry): Transition `ClientLoggingController` to a dedicated APM/telemetry collector (e.g., OpenTelemetry / Sentry) in production.
  - Issue #179 (Lockless Concurrency): Future migration of `RoomService.StateLock` to channel-based message passing (`System.Threading.Channels`).
- **4c) Deferred Items**:
  - Issue #157: Implement JWT refresh token rotation and silent renewal flow (pairs with #92).
  - Issues #112, #113, #114, #115: Automated StateLock enforcement, StateHistory stack trimming, and explicit Undo voting feedback (deferred to dedicated Room concurrency milestone).
  - Issue #118: Edge-optimized async dictionary validation for Babble.
  - Issue #145: Playwright E2E test suite for Farkle Table & Hand gameplay.
