# Poppycock Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Poppycock".
- **Start**: Click "Start Game".

## 2. Faking Phase
- **State**: `phase = 0`.
- **View**:
    - **Board (Host)**: Shows Prompt Word & Category. Status of submissions.
    - **Player**: Input form to write a fake definition (or "I know it!" button).
- **Action**:
    - Players write fake definitions.
    - Dasher (assigned player) waits (or writes real one? Logic implies Dasher is passive/known?).
    - When all submitted, phase transitions.

## 3. Voting Phase
- **State**: `phase = 1`.
- **View**:
    - **Board (Host)**: Shows list of definitions (Real + Fakes). Status of votes.
    - **Player**: List of definitions to vote on.
- **Action**:
    - Players vote for the definition they think is real.
    - When voting complete, phase transitions.

## 4. Result Phase
- **State**: `phase = 2`.
- **View**:
    - **Board (Host)**: "Truth Revealed". Shows Real Def, Validates Votes, Scores.
    - **Player**: Shows result summary.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.
    - **Critical Missing Feature**: There is currently **NO BUTTON** for "Next Round" in the Result view.

---

# Discrepancies / Notes
1.  **Missing "Next Round" Button**: The Board View lacks controls for the Host to proceed after results are shown.
