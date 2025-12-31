# Scatterbrain Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Scatterbrain".
- **Settings**:
    - **Timer**: 60s (Default) - (Official Rules: 3 Minutes, but 60s is better for fast online play).
    - **Letter Mode**: Normal, Hard, True Random.
    - **List ID**: Random or specific list.
- **Start**: Host clicks "Start Game".

## 2. Writing Phase
- **State**: `phase = Writing` (0).
- **View**:
    - **Header**: Shows **Round X**, current **Letter** (e.g., "A") and **Timer**.
    - **Host**: Shows "Player Progress". Controls: Pause, Resume, End Phase.
    - **Player**: Shows list of **12 Categories**.
- **Action**:
    - Players type answers starting with the target letter.
    - **Goal**: Unique answers.
    - **Bonus**: Alliteration (Double points for multi-word answers starting with the key letter).
    - Players click **"SUBMIT FINAL ANSWERS"**.

## 3. Validation Phase
- **State**: `phase = Validation` (1).
- **View**:
    - **Grid**: Rows = Categories, Columns = Players.
    - **Validation**: Host reviews answers.
- **Action**:
    - **Veto**: Host clicks on an answer to toggle "Vetoed" (Red).
    - **Criteria**: Wrong letter, duplicate word (if unrelated), or nonsensical.
    - **Transition**: Host clicks **"Finalize Scores"**.

## 4. Result Phase
- **State**: `phase = Result` (2).
- **View**:
    - **Leaderboard**: Shows Round Score and Total Game Score.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.
        - Increments Round Counter.
        - New Letter, New List.
    - **End Game**: After Round 3 (Official) or whenever Host decides.

---

# Discrepancies / Notes
1.  **Round Limit**: Official rules specify 3 Rounds. Current implementation allows infinite rounds. Host must manually "End Game".
2.  **Validation**: Official rules use Group Vote. Implementation uses Host Veto for speed.
3.  **Initialization**: `ngOnChanges` correctly re-initializes answers on round change. [FIXED]
