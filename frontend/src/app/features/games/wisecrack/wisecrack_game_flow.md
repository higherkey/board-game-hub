# Wisecrack Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Wisecrack".
- **Start**: Click "Start Game".
- **Rules**: Overlay appears on first round. Logic checks `roundNumber === 1`.

## 2. Writing Phase
- **State**: `GameData.phase = Writing`.
- **View**:
    - **Board**: "Step 1: Be Funny". Shows answer count progress.
    - **Player**: List of 2 assigned prompts. Text Area + Submit.
- **Action**:
    - Players fill prompts. 
    - When all answers submitted (or timer? - Timer not visible in UI), phase transitions?
    - *Note*: Backend likely handles transition when all answers received.

## 3. Battling Phase
- **State**: `GameData.phase = Battling`.
- **View**:
    - **Board**: Shows Current Battle (Prompt + Answer A vs B).
    - **Player**: "Vote Left" vs "Vote Right" buttons. Disabled if "You are in this battle".
- **Action**:
    - Players vote.
    - **Battle End**: When voting completes (backend logic), Board shows Winner + Vote Count.
    - **Next Battle**: Host (via Board controls) clicks **"Next Battle"**.
        - Button only appears when `battleWinner` is determined.

## 4. Result Phase
- **State**: `GameData.phase = Result`.
- **View**:
    - **Board**: Results Screen / Game Over. Shows Leaderboard.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"** (or "End Game").
    - **Critical Missing Feature**: There is currently **NO BUTTON** for "Next Round" in the Result view.

---

# Discrepancies / Notes
1.  **Missing "Next Round" Button**: The Board component shows the leaderboard in the Result phase but provides no way for the Host to trigger the next round.
    - **Fix**: Needs an "Next Round" button (Host Only).
    - **Prerequisite**: `WisecrackBoard` needs to know who is Host. Currently `isHost` is not passed to it.
2.  **Timer Visibility**: There is no visual timer in the Writing phase, though one likely exists in the backend settings.
