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
    - **Actions**:
        - **Host Veto**: Host can click an answer to toggle "Vetoed" (Red) for quick cleanup of invalid entries.
        - **Player Challenge**: Any player can "Flag" an answer to initiate a **Group Vote**.
- **Action**:
    - **Group Vote (Challenge)**:
        - All players (including the challenged) vote "Accept" or "Reject".
        - Majority vote decides. Ties result in "Accept".
    - **Criteria**: Wrong letter, duplicate word (if unrelated), or nonsensical.
    - **Transition**: Host clicks **"Finalize Scores"**.

## 4. Result Phase
- **State**: `phase = Result` (2).
- **View**:
    - **Leaderboard**: Shows Round Score and Total Game Score.
- **Action**:
    - **Scoring Details**:
        - **Base**: 1 Point for a unique, valid answer.
        - **Duplicates**: 0 Points if multiple players have the same answer.
        - **Alliteration Bonus**: +1 Point for *each word* in the answer that starts with the key letter (e.g., "Big Bear" with letter B = 2 points).
    - **Next Round**: Host clicks **"Next Round"**.
        - Increments Round Counter.
        - New Letter, New List.
    - **End Game**: After Round 3 (Official) or whenever Host decides.

---

# Discrepancies / Notes
1.  **Round Limit**: Official rules specify 3 Rounds. Current implementation allows infinite rounds. Host must manually "End Game".
2.  **Validation**: Both Host Veto and Group Challenge are supported.
3.  **Initialization**: `ngOnChanges` correctly re-initializes frontend answer buffers on round change.
4.  **Alliteration**: Correctly awarded per-word in the backend logic.
