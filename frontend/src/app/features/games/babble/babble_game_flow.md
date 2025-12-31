# Babble Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Babble".
- **Settings**:
    - **Timer**: 60s (Default).
    - **Board Size**: 4x4, 5x5, 6x6.
- **Start**: Host clicks "Start Game".

## 2. Playing Phase
- **State**: `Room.state = Playing`.
- **View**:
    - **Grid**: 4x4+ grid of letter tiles.
    - **Host**:
        - Grid + "Host's Words" list.
        - Controls: **End Round** (Early), **Pause**, **Resume**.
    - **Player**:
        - Grid + "Found Words" list.
        - Input: Text box to type words + Submit button.
- **Action**:
    - Players type words and convert to uppercase.
    - **Validation**: Minimum 3 letters, not duplicate (local check).
    - **Submit**: Sent to backend.
- **End**: Timer hits 0:00 -> Host client triggers `endRound` (or backend forced). State changes to `Finished`.

## 3. Results Phase
- **State**: `Room.state = Finished`.
- **View**:
    - **Host**: Sees "Results" - List of *all* words found, points, and who found them.
    - **Player**: Sees "Your Results" - List of *their* words with points/validation status.
        - **Validation Status**: "Not on Grid", "Unknown" (Dictionary check), or Points.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"** to generate a new grid.

---

# Discrepancies / Notes
1.  **Critical Bug**: The **"Next Round"** button is completely missing from the Host's view in the Results phase. The Host currently has no way to continue the game after the first round ends.
2.  **Result Visibility**: Players only see *their own* words in the result list. Typical Boggle-style games usually allow players to see *all* valid words found by the group to compare. This is a design choice but noted here.
