# Four in a Row Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Four in a Row".
- **Players**: 2 Players (1v1).
- **Start**: Click "Start Game".

## 2. Gameplay Phase
- **Grid**: 7 Columns x 6 Rows. Vertical Gravity.
- **State**: `phase = Playing`.
- **View**:
    - **Board**: Shows grid with Red/Yellow tokens.
    - **Active Player**: Indicated.
- **Action**:
    - **Active Player**: Clicks a Column.
    - **Animation**: Token drops to lowest empty slot.
    - **Switch**: Turn passes to opponent.

## 3. Win Condition
- **Check**: After every move.
- **Rules**: 4 consecutive tokens (Horizontal, Vertical, Diagonal).
- **Win**:
    - **Winner**: Highlight winning line.
    - **Draw**: Grid full, no winner.

## 4. Game End
- **View**: Victory Screen.
- **Action**: Host clicks "Play Again".

---

# Implementation Notes
- **Gravity Logic**: Essential. `Row = max(filled) + 1`.
- **Win Check**: O(1) or O(Grid) check after move.
