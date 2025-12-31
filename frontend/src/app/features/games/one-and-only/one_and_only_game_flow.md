# One and Only Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "One and Only".
- **Start**: Click "Start Game".

## 2. Main Phase
- **State**: `phase = Prompt`.
- **View**:
    - **Board**: Shows "Category: [Category Name]". "Submit a unique answer!".
    - **Player**: Input form.
- **Action**:
    - Players submit answers.
    - Goal: Submit an answer that no one else submits, but is valid.

## 3. Reveal Phase
- **State**: `phase = Reveal`.
- **View**:
    - **Board**: Shows all answers.
    - **Animation**: Duplicate answers get "knocked out". Unique answers score points.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.

## 4. End Game
- **Condition**: After X rounds.
- **View**: Leaderboard.
- **Action**: Host clicks **"End Game"**.

---

# Verification Notes
- Verify duplicate detection logic (backend vs frontend display).
- Verify Host controls.
