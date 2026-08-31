# Work Trace: feat-168-event-driven-realtime-state

## 1. Overview
Migrate `GameStateManager` from a 20 Hz (50ms) background polling timer loop with reflective property inspection to an event-driven `System.Threading.Channels.Channel<RoomStateUpdate>` architecture.

## 2. Problem Statement
- `GameStateManager.cs` ran a continuous 50ms timer loop checking dirty dictionaries across all active rooms.
- In `GameTick()`, reflection (`typeof(Room).GetProperty(member)`) was executed on every dirty member check.
- Turn-based board games only change state on player action, timer ticks, or room events. Fixed 20 Hz polling wastes CPU cycles and creates synchronization overhead.

## 3. Architecture & Implementation Plan
- **Event Dispatching via Channels**: Introduce an unbounded `Channel<string>` (or bounded with backpressure) where `MarkDirty(roomCode, member)` writes the dirty event into the channel reader loop.
- **Fast Compiled Property Access / Dictionary Dispatch**: Eliminate slow `typeof(Room).GetProperty` reflection calls by caching property getters or using direct property dispatch.
- **Immediate Push Delivery**: State diffs are computed and dispatched immediately over SignalR without waiting up to 50ms in a timer loop.
- **Graceful Lifecycle**: Backed by a `BackgroundService` / `IHostedService` consumer pattern managed cleanly by ASP.NET Core hosting lifetime.

## 4. Completed Milestones & Verification
- [x] Create `implementation_plan.md` and audit via `/plan-review`.
- [x] Implement `Channel<string>` queue and consumer in `GameStateManager.cs`.
- [x] Replace `_tickTimer` with `IHostedService` background channel reader.
- [x] Eliminate runtime reflection with static `FrozenDictionary` compiled accessors (fixes #87).
- [x] Verify with all 239 backend tests (100% pass rate).
- [x] Verify with all 325 frontend Karma tests (100% pass rate).

## 5. Associated Issues
- Fixes #168
- Fixes #87
