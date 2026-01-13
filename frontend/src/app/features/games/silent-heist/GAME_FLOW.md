# Silent Heist Game Flow

## 1. Lobby & Setup
*   **Host:** Selects "Silent Heist".
*   **Difficulty:** Introductory (Scenario 1) -> Advanced (Scenarios 2-7).
*   **Deal:**
    *   Server assigns Action Tiles based on player count (e.g., 4 players = 1 direction each).
    *   Board initialized with Tile 1 (Start).
    *   Pawns placed on center grid.

## 2. Countdown
*   **UI:** "Review your actions carefully."
*   **Start:** "3... 2... 1... HEIST!"
*   **Timer:** 3:00 starts ticking.

## 3. Heist Phase (Real-Time loop)
*   **State:** "Exploration".
*   **Player Input:**
    *   Click-and-drag pawn in authorized direction.
    *   Click "Explore" on valid tile connection.
    *   Click "Escalator/Vortex".
*   **Timer Action:**
    *   Pawn enters Timer Space.
    *   Server: Flipped = true.
    *   UI: "TALKING ALLOWED" overlay for 10s? Or just flip timer.
    *   Timer resets to 3:00 (or flips sand).
*   **Goal Check:**
    *   Are Red, Blue, Green, Yellow pawns on Item Spaces?
    *   If YES -> Trigger Phase 4.

## 4. Escape Phase
*   **Event:** "ALARM TRIGGERED!"
    *   Board flashes red.
    *   Theft Tile flips (Vortexes disabled).
*   **New Goal:** Reach Exits.
*   **Action:**
    *   Pawns must navigate to matching color Exit space.
    *   Once a pawn exits, it is removed from board (Saved).

## 5. End Game
*   **Win:** All 4 Pawns Saved.
    *   Score: Time Remaining.
*   **Loss:** Timer hits 0:00.
    *   "BUSTED!" animation.
