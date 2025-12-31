# Scatterbrain Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Scatterbrain" from Game Picker.
- **Settings**:
    - **Timer**: 60s (Default)
    - **Letter Mode**: Normal, Hard, True Random.
    - **List ID**: Random or specific list.
- **Start**: Host clicks "Start Game".

## 2. Writing Phase
- **State**: `Room.state = Playing`, `GameData.phase = Writing` (0).
- **View**:
    - **Header**: Shows current **Letter** (e.g., "A") and **Timer**.
    - **Host**: Shows "Player Progress" (Badges turn Green when submitted).
        - Controls: Pause, Resume, End Phase Early.
    - **Player**: Shows list of **12 Categories** (e.g., "Boys Names", "US Cities").
        - Inputs: Text boxes for each category.
- **Action**:
    - Players type answers starting with the target letter.
    - Players click **"SUBMIT FINAL ANSWERS"**.
    - **Timeout**: When timer hits 0, backend presumably forces end of phase (or Host manually ends).

## 3. Validation Phase
- **State**: `GameData.phase = Validation` (1).
- **View**:
    - **Grid**: Rows = Categories, Columns = Players.
    - **Cells**: Player answers. Empty if no answer.
- **Action**:
    - **Veto**: Host clicks on an answer to toggle "Vetoed" state (Red/Strikethrough).
    - **Goal**: Mark invalid answers (wrong letter, duplicate words, non-sense).
- **Transition**: Host clicks **"Finalize Scores"**.

## 4. Result Phase
- **State**: `GameData.phase = Result` (2).
- **View**:
    - **Leaderboard**: Shows Round Score and Total Game Score.
    - **Animations**: Points potentially animate (not currently implemented in basic view).
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.
        - Triggers new round with new Letter and new List.

## 5. End Game
- **Condition**: All rounds completed (if limited) or Host chooses "End Game".
- **Action**: Returns to Lobby / Game Over screen.

---

# Discrepancies / Notes
1.  **Initialization Issue**: `initAnswers()` is only called in `ngOnInit`. If the component is reused for the next round (which it likely is, as the View stays active), the `answers` array will **NOT** be reset or resized for the new round's categories. The input boxes will contain old answers or be the wrong length.
    - **Fix Required**: Implement `ngOnChanges` to re-initialize `answers` when categories or round number changes.
