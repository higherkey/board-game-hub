# Babble Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Babble".
- **Settings**:
    - **Timer**: 60s (Default) - (Official Rules: 3 Minutes).
    - **Board Size**: 4x4, 5x5, 6x6.
- **Start**: Host clicks "Start Game".

## 2. Playing Phase
- **State**: `Room.state = Playing`.
- **View**:
    - **Grid**: 4x4+ grid of letter tiles.
    - **Host**: Grid + Controls.
    - **Player**: Grid + Found Words List.
- **Action**:
    - Players type words. Words must be 3+ letters, adjacent tiles.
    - **Qu**: Counts as 2 letters.
    - **Duplicates**: Words found by multiple players get 0 points.
    - **Scoring**: 3-4 (1pt), 5 (2pts), 6 (3pts), 7 (5pts), 8+ (11pts).
- **End**: Timer hits 0:00 -> State changes to `Finished`.

## 3. Results Phase
- **State**: `Room.state = Finished`.
- **View**:
    - **Host**: Sees "Results" - List of *all* words found, duplicate status, and points.
    - **Player**: Sees "Your Results" (Filtered List).
- **Action**:
    - **Next Round**: Host clicks **"Next Round"** to generate a new grid.

---

# Discrepancies / Notes
1.  **Result Visibility**: Players only see *their own* words in the result list. Official Boggle is collaborative/competitive review. Current design prevents "cheating" if players take screenshot, but makes it less social.
2.  **Next Round Button**: Confirmed present and working. [FIXED]
3.  **Scoring**: Backend logic matches official Boggle rules exactly.
