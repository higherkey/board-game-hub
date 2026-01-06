# Wisecrack Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Wisecrack".
- **Start**: Click "Start Game".

## 2. Writing Phase (Rounds 1 & 2)
- **State**: `phase = Writing`.
- **View**:
    - **Player**: Shows 2 prompts sequentially.
    - **Board**: "Waiting for writers...".
- **Action**:
    - Players fill 2 prompts.
    - **Prompt Assignment**:
        - Each prompt shared by 2 players.
        - Offset by Round Number to vary matchups.

## 3. Battling Phase (Rounds 1 & 2)
- **State**: `phase = Battling`.
- **View**:
    - **Board**: Shows "Prompt", "Answer A", "Answer B".
    - **Player**: Voting buttons (A / B).
- **Action**:
    - Audience votes.
    - **Winner**: Determined by majority. Points awarded.

## 4. The Final Crack (Round 3)
- **State**: `phase = Writing / Battling`.
- **Mechanic**:
    - **One Prompt** for ALL players.
    - **Battles**: Players paired up randomly (Head-to-Head).
    - **Odd Player Logic**: Paired with the first answer (Bonus Battle).
    - **Scoring**: Points Tripled (x3).

## 5. Result Phase
- **State**: `phase = Result`.
- **View**:
    - **Board**: Scores, Winner.
- **Action**:
    - **Host**: "Next Round" (if Round < 3) or "End Game".

---

# Verification Notes
- **Fixed**: Round Loop Bug (Round now increments).
- **Fixed**: Round 3 Logic ("The Final Crack" implemented).
- **Verify**: Odd player count handling in Final Crack.
