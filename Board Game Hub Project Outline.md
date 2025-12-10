
# Board Game Hub Project Outline

## Project Overview
A multiplayer board game platform featuring:
- Shared display (TV/computer screen) for game board
- Mobile devices as player controllers
- Local and remote play
- Integrated video calling
- Initial games: Scatterbrain (Scattergories clone), Boggle clone
- Extensible for future games and features

## High-Level Architecture
- **Front End:** Angular (RxJS, NgRx, Bootstrap, etc.)
- **Back End:** .NET Core API with SignalR, PostgreSQL
- **Real-Time Communication:** SignalR (WebSockets)
- **Video Calling:** WebRTC or third-party (Agora.io, Daily.co)
- **Social Features:** Friend system, chat, game history

---

## Front End Plan (Angular)

### Technical Requirements
- **Framework:** Angular 17+
- **State Management:** NgRx (Redux pattern), RxJS for reactive streams
- **UI:** Bootstrap 5, custom SCSS for responsive design
- **Routing:** Angular Router
- **Real-Time Updates:** SignalR client, RxJS observables
- **Authentication:** JWT-based, integrated with backend
- **Mobile Optimization:** Touch controls, adaptive layouts
- **Testing:** Jasmine/Karma for unit tests

### Core Features
- Game room creation/joining
- Player management UI
- Real-time game state display
- Mobile controller interface
- Chat and social features
- Video call integration (WebRTC or SDK)
- User profile and friend management

---

## Back End Plan (.NET Core)

### Technical Requirements
- **Framework:** ASP.NET Core 8+
- **Real-Time:** SignalR for game state and chat
- **Database:** PostgreSQL (users, games, history, friendships)
- **Authentication:** ASP.NET Core Identity, JWT tokens
- **State Management:** In-memory for active games, Redis for scaling
- **API:** RESTful endpoints for user/game management
- **Video:** WebRTC signaling, or integration with third-party SDK
- **Testing:** xUnit for unit/integration tests

### Core Features
- Game room and session management
- Player and user management
- Game logic and state synchronization
- Chat and social endpoints
- Video call signaling
- Security: validation, access control

---

## POC to MVP Plan

### Proof of Concept (POC)
- Basic Angular front end with room creation/joining
- .NET Core backend with SignalR hub
- Simple game logic for Scatterbrain
- Mobile controller prototype

### MVP
- Full game room management
- User authentication and profiles
- Friend system
- Game history tracking
- Responsive UI for TV/mobile
- Video calling integration
- Extensible game engine for new games

### Future Enhancements
- User chat
- Additional board games and extensible game library
- Advanced social features (leaderboards, achievements, tournaments)
- Analytics and game statistics
- AI opponents and bots
- Mobile app (native or PWA)
- Third-party integrations (Discord, Google, Facebook)
- Accessibility improvements (screen reader support, high contrast mode)

---

## Next Steps
1. Set up Angular and .NET Core projects
2. Implement SignalR communication
3. Build basic room and game management
4. Develop mobile controller and responsive UI
5. Integrate authentication and social features
6. Add video calling
7. Expand game library and polish UX