# Board Game Hub Roadmap

This roadmap complements the `Board Game Hub Project Outline.md` and lays out phased milestones from POC to MVP and beyond.

## Summary Milestones
- POC: Basic playable experience with one game (Scatterbrain), local room flow, and mobile controller.
- Alpha: Connect front end to a running .NET Core SignalR backend; authentication; persistent rooms; basic chat.
- Beta: Multiple games, friend system, game history, video calling integration (WebRTC or SDK), QA and accessibility.
- MVP: Polished UX, deployable backend (Postgres, Redis for scale), analytics, and performance tuning.

## Phase A — Proof of Concept
- Deliverables:
  - Angular app with Scatterbrain UI and mobile controller
  - Local .NET Core SignalR hub stub (or simple backend) for room events
  - Basic game flow and client-side state via services and RxJS
- Success criteria: Playable round, join room flow, basic scoring, no auth required

## Phase B — Early Integration
- Deliverables:
  - Connect Angular client to real SignalR hub
  - Add JWT-based authentication (ASP.NET Core Identity + JWT on backend; token storage and interceptor on client)
  - Persist rooms and users to PostgreSQL
  - Add simple chat and presence
- Success criteria: Multiple clients can join and play a game online, authenticated users, persistent rooms

## Phase C — Scale & Features
- Deliverables:
  - Add NgRx store for global state (rooms, games, session)
  - Add Redis for scale (active room state) and Postgres for history
  - Video calling integration for low-latency voice/video
  - Friend system and game history
  - Add at least one additional game (Boggle)
- Success criteria: Stable multiplayer sessions with >10 concurrent rooms in testing, working video calls

## Phase D — Polishing & Launch
- Deliverables:
  - UI polish and accessibility improvements
  - Leaderboards, achievements, analytics dashboards
  - E2E tests and CI/CD pipeline
  - Optional: mobile PWA or native wrapper
- Success criteria: MVP release candidate, documented deployment, monitoring configured

## Ongoing / Future Enhancements
- AI opponents, tournaments, 3rd-party integrations (Discord), mobile native apps, accessibility improvements

## Rough Priorities (first 90 days)
1. Wire SignalR end-to-end with a simple room lifecycle
2. Implement authentication (Identity + JWT) and secure SignalR with token
3. NgRx store scaffold and migrate key state
4. Basic chat and friend system
5. Video calling proof-of-concept

## How to use this roadmap
- Each phase should be broken into sprints. Keep the `Board Game Hub Project Outline.md` as the canonical technical spec and update this roadmap as estimates and priorities shift.

## Backend Roadmap & Tasks
This section drills into backend-specific work required to support the frontend roadmap and scale to MVP.

Phase B (Early Integration) server tasks:
- Add SignalR hub and ensure it's reachable from the front end (CORS + HTTPS).
- Implement JWT-based authentication (ASP.NET Core Identity or custom) and token issuance endpoints.
- Persist users and rooms with EF Core + PostgreSQL (`AppDbContext`), add migrations and local dev DB setup.

Phase C (Scale & Features) server tasks:
- Add Redis for transient active-game state and to support distributed SignalR scale-out if multi-instance.
- Move authoritative game logic to the server where appropriate and expose minimal, validated commands to clients.
- Add video call signaling (SignalR-based) or integrate a third-party SDK and provide secure key exchange.

Phase D (Polish & Production)
- Implement monitoring, logging, and analytics collection (e.g., Application Insights or Prometheus + Grafana).
- Harden security (validate all hub inputs, rate-limit joining, use secure token lifetimes).

Quick server checklist (first pass):
1. Add `AppDbContext` and register Npgsql provider.
2. Add `Microsoft.AspNetCore.Authentication.JwtBearer` and configure token validation.
3. Add CORS policy to allow the front-end origin and allow credentials for SignalR.
4. Secure hub endpoints with JWT (SignalR supports access_token on negotiate).
5. Add Redis cache registration (optional) and plan for scaling SignalR (Redis backplane or Azure SignalR Service).
6. Add basic integration tests for room lifecycle and hub messaging.

Notes on local dev:
- Provide a `docker-compose` for Postgres and Redis to make local setup reproducible.
- Use environment-specific `appsettings.Development.json` for local connection strings and JWT keys.

## WebRTC (video) plan
We decided to implement WebRTC for peer audio/video rather than a third-party managed SDK. Key points:
- Signaling will be implemented over SignalR: clients exchange SDP offers/answers and ICE candidates via the hub.
- The server acts only as a relay for signaling (no media flows through the server). Use STUN servers for NAT traversal; add TURN if needed for restrictive networks.
- On the backend, the `GameHub` already includes helper methods to relay offers, answers and ICE candidates to group members (`SendOffer`, `SendAnswer`, `SendIceCandidate`).
- On the front end, the `WebRTCService` and `SignalRService` were added as a minimal proof-of-concept: `WebRTCService` manages a single peer connection and the local/remote media streams and uses `SignalRService` for signaling.

Security & production notes for WebRTC:
- Use short-lived JWTs and validate the user identity before allowing signaling messages; reject unauthorized signaling.
- Add TURN servers (coturn) for users behind symmetric NAT or very restrictive networks.
- Consider mesh topology limits (peer-to-peer with many participants is costly). For larger groups, consider SFU solutions (Jitsi, Janus) later.

## Deployment / Hosting Options (Future Reference)
As we move toward MVP, we have identified two primary paths for hosting:

### 1. Cloud Hosting (Render / Azure)
- **Render**: Good for simplicity.
  - Frontend: Static Site.
  - Backend: Docker container.
  - DB: Managed Postgres.
- **Azure**: Best for .NET integration.
  - App Service (Windows/Linux) for Backend.
  - Azure Static Web Apps for Frontend.
  - Azure SQL or Postgres.

### 2. Local Tunnel (Current Approach)
- Using **Cloudflare Tunnel** to expose the local machine securely.
- Ideal for demos and dev testing without deployment costs.
- Requires local machine to be running.



