# Spectrum Game Flow

## 1. Setup
*   **Host:** Selects "Spectrum".
*   **Teams:** 
    *   **Competitive:** Players assigned to Left/Right Teams.
    *   **Co-op:** All players in one pool.
*   **Scores:** Initialize at 0-0 (or handicapped 1-0 for second team).

## 2. Round Start
*   **Psychic Selection:**
    *   Sequential rotation or random pick from the Active Team.
*   **Card Draw:**
    *   Server selects random spectrum card (e.g., "Useless - Useful").
    *   Server generates hidden `TargetValue` (0-100).
*   **Private View:**
    *   Psychic sees: Left Concept, Right Concept, and **Target Position**.
    *   Others see: Only Concepts. Dial is hidden/centered.

## 3. Clue Phase
*   **Psychic Action:** Enters a text clue.
*   **Validation:** Basic profanity check.
*   **Broadcast:** Clue appears on all screens.

## 4. Tuning Phase (Active Team)
*   **Discussion:** Active Team discusses via voice/video.
*   **Interaction:** Any team member can drag the dial. It updates in real-time for everyone (debates cause the needle to wiggle).
*   **Lock In:** Team Captain (or majority vote) clicks "Lock In".

## 5. Counter-Guess Phase (Inactive Team)
*   **View:** Inactive team sees the Locked Dial position.
*   **Decision:** They guess `Left` of Dial or `Right` of Dial.
*   **Input:** Team Captain submits guess.

## 6. Reveal Phase
*   **Animation:** The shutter opens / The target is revealed.
*   **Calculations:**
    *   **Distance:** `abs(Target - Dial)`.
    *   **Bullseye:** < 4% diff (4 pts).
    *   **Inner:** < 10% diff (3 pts).
    *   **Outer:** < 15% diff (2 pts).
    *   **Miss:** > 15% diff (0 pts).
    *   **Counter:** If (Target < Dial AND Guess == Left) OR (Target > Dial AND Guess == Right) -> +1 pt.
*   **Scoring:** Update Team Scores.

## 7. Logic Update
*   **Win Check:** If Score >= 10.
    *   If tied at >10, Sudden Death.
*   **Turn Change:** Active Team flips. New Psychic.
