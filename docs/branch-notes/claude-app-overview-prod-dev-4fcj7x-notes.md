# Branch Notes: claude/app-overview-prod-dev-4fcj7x

Base: `origin/dev` @ `1727cf6`. Scope: #215 (Supabase variant), #112, #79, #66.

## 1. Discoveries & Deviations
- **Decision (revised):** dev runs on **Neon Dev**, and staging and prod stay on Supabase. My first pass on this branch moved everything to Supabase, and that was reverted. CI dev migrations now use `NEON_CONNECTION_STRING_DEV` only, with no cross-provider fallback.
- The Oct 28 dev deploy log shows `NEON_CONNECTION_STRING_DEV` is set, and the Neon dev DB reported "already up to date". So it already has every migration, including `ActiveRooms`.
- `deploy-backend-render.yml` checked `NEON_CONNECTION_STRING_*` first and fell back to `SUPABASE_CONNECTION_STRING_*`. Migrations could land on Neon while Render runs on Supabase.
- `chefdlvvbyytauruhvjh` is the Supabase **prod** project (`deploy-supabase.yml`). The dev Render service inherited prod's connection string when it was cloned (#215).
- The Supabase SQL migrations are EF idempotent scripts and maintain `__EFMigrationsHistory`, so running the EF bundle against Supabase is safe.
- The DI cycle (#213/#214): `RoomPersistenceWorker` was registered with `AddSingleton<T>()`, and MS DI picks the greediest constructor, which takes `IRoomService` + `GameStateManager`. That closed the loop RoomService → GSM → Worker → RoomService. The workaround dropped persistence from RS/GSM entirely, which also disabled lazy DB hydration (`scopeFactory`) in `RoomService`.

## 2. Blockers & Risks (4a)
- **Render dashboard (manual):** set `ConnectionStrings__DefaultConnection` on `board-game-hub-api-dev` to the Neon Dev connection string, the same value as `NEON_CONNECTION_STRING_DEV`. Per #215 it still points at the Supabase prod project (`chefdlvvbyytauruhvjh`). Unverified here: there's no Render API access in this session.
- **Missing table:** `ActiveRooms` doesn't exist in Supabase prod yet. It will be created by the main-branch migration bundle on promotion.

- **Secrets:** CI reads `SUPABASE_CONNECTION_STRING_PROD` (main), `_STAGING`, falling back to `_DEV` (staging), and `NEON_CONNECTION_STRING_DEV` (dev). If one is missing, migrations are skipped with a warning annotation.
- **Behavior change (#66):** new games now need every player ready or the host override, enforced on both client and server. Playwright e2e flows that start games without readying up may need updating; they weren't run here.

## 3. Quick Wins (4b)
- `RoomPersistenceWorker` logs one warning instead of an error every 60s when `ActiveRooms` is missing (`42P01`).
- Restored the `/health` route. It's on `main` but was lost on dev when #207 restored an old `Program.cs`, and the frontend warmup (#191) calls it.
- `TestBase` now uses a unique in-memory DB per factory. Parallel web-host tests raced on startup seeding.
- The Wisecrack "End Game" button on its Game Over screen was a no-op for the same reason as #79. It now returns to the lobby.
- The DI regression test fails on the old wiring and passes on the new one.
- Beta games audit (#79): Farkle and Clover-Minded never set `room.State = Finished` on natural game over, so they were stuck in Playing. Both are fixed, and Farkle now syncs `Player.Score`. Babble was already correct.
- `SubmitAction` now marks `State` dirty. Without that, a game ending itself never reached clients through the patch.
- E2E specs now ready players up via the `setReady` helper, plus a negative "won't start unready" test. The specs compile and are listed, but haven't been run against live servers.

## 4. Deferred Items (4c)
- #188, audited for the beta games: Clover-Minded broadcasts `currentRoundSolution` and every player's board layout to all devices, which enables cheating (fix size M). Babble streams `playerAnswers` live, a minor spoiler (fix size S). Farkle has nothing hidden. Full-room sends in `GameHub` (`GameStarted`, `RoomUpdated`, `RoundEnded`, `JoinRoom` return) leak too, not only patches.
- #92 / #157: JWT stored in localStorage, plus refresh-token rotation (auth redesign).
- No GitHub Action clears `docs/branch-notes/` on `main` any more, since #216 removed the trace cleanup workflows.
- `Finished` means both "round intermission" and "game over". A distinct `GameOver` state (or a flag) would make the lifecycle explicit across all 17 game services.
- Close the stale issues #193 and #183, which merged PRs already resolved.

## 5. Verification
- `dotnet test`: 371/371 passed. Earlier: 365/365 on three consecutive runs.
- `npm test` (ChromeHeadless): 401 passed, 1 skipped (pre-existing `xit`).
- `ng build`: OK.
- Release-build API boot with the worker enabled: listening, `Rehydrated 0`, `/health` 200.
- Workflow YAML parses.
