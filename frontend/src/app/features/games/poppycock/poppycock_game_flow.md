# Poppycock Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Poppycock".
- **Start**: Click "Start Game".

## 2. Faking Phase
- **State**: `phase = Faking (0)`.
- **View**:
    - **Board (Host)**: Shows Prompt Word & Category. Status of submissions.
    - **Player**: Input form to write a fake definition.
- **Action**:
    - Players write fake definitions.
    - **Dasher**: Role rotates `Round % Count`. Dasher does not submit (Real answer is automatic).
    - **The Natural**: If a player submits the exact real definition, they get points immediately and don't play the voting round for that prompt.

## 3. Voting Phase
- **State**: `phase = Voting (1)`.
- **View**:
    - **Board (Host)**: Shows list of definitions (Real + Fakes, shuffled).
    - **Player**: List of definitions to vote on.
- **Action**:
    - Players vote for the definition they think is real.
    - **Restriction**: Cannot vote for self.

## 4. Result Phase
- **State**: `phase = Result (2)`.
- **View**:
    - **Board (Host)**: "Truth Revealed". Shows Real Def, Validates Votes, Scores.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.

---

# Discrepancies / Notes
1.  **Scoring Customization**:
    - **Vote for Real**: +3 pts (Official: 1 or 2).
    - **Fooling Others**: +2 pts (Official: 1).
    - **Dasher Bonus**: +3 pts (matches rules).
    - **The Natural**: +3 pts (matches rules).
    - *Verdict*: Digital scoring is slightly inflated but balanced.
2.  **Resolved**: Missing "Next Round" button was fixed in previous sessions.
