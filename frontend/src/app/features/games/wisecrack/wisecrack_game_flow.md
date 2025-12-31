# Wisecrack Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Wisecrack".
- **Start**: Click "Start Game".
- **Rules**: Host sees overlays explaining 3 Rounds.

## 2. Writing Phase
- **State**: `phase = Writing`.
- **View**:
    - **Board**: "Step 1: Be Funny". Progress Bar.
    - **Player**: 2 Prompts.
- **Action**:
    - Players fill 2 prompts.
    - **Head-to-Head**: Each prompt is assigned to exactly 2 players.
    - **Transition**: When all answers submitted -> Battling.

## 3. Battling Phase
- **State**: `phase = Battling`.
- **View**:
    - **Board**: "Prompt" + Answer A vs Answer B.
    - **Player**: Vote buttons (Disabled if your answer is shown).
- **Action**:
    - Players Vote.
    - **Scoring**: Winner gets 100 + (Votes * 50). Tie = 50 each. (Simplified implementation).
    - **Next Battle**: Host clicks "Next Battle".

## 4. Result Phase
- **State**: `phase = Result`.
- **View**:
    - **Board**: Leaderboard.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.
        - Increments Round (Standard: 3 Rounds).
        - **Round 3**: Should be "Last Lash" (All answer same prompt) - *Not currently implemented*.

---

# Discrepancies / Notes
1.  **Round Logic Bug**: Backend `StartRound` hardcodes `RoundNumber = 1`. Host hitting "Next Round" just restarts Round 1.
    - **Fix Required**: Update service to use `room.RoundNumber + 1`.
2.  **Missing "Next Round" Button**: Previously noted as missing.
3.  **Round 3**: "Last Lash" (everyone answers same prompt) logic is missing from `AssignPrompts`. It currently just repeats the Head-to-Head logic for all rounds.
