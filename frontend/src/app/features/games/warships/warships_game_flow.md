# Warships Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Warships".
- **Players**: 2 Players (1v1).
    - Can support Tournament Mode for >2? (Future).
- **Start**: Click "Start Game".

## 2. Placement Phase
- **State**: `phase = Placement`.
- **View**:
    - **Player**: Own Grid (10x10). Fleet (Carrier, Battleship, Cruiser, Sub, Destroyer).
- **Action**:
    - Drag and drop ships onto grid.
    - Rotate ships.
    - **Confirm**: Lock in placement.
    - **Wait**: For opponent.

## 3. Battle Phase
- **State**: `phase = Battle`.
- **View**:
    - **Player**:
        - **Target Grid**: Opponent's board (Ships hidden, Hits/Misses shown).
        - **Own Grid**: Shows opponent's shots.
- **Action**:
    - **Active Player**: Clicks a cell on Target Grid.
    - **Result**:
        - **Hit**: Red peg. Valid hit animation. Extra turn? (Variant dependent, usually not).
        - **Miss**: White peg. Turn passes.
        - **Sunk**: "You sunk my Battleship!".

## 4. Game End
- **Condition**: All ships of one player sunk.
- **View**: Victory/Defeat Screen.
- **Action**: Host clicks "Play Again".

---

# Implementation Notes
- **Grid**: 10x10.
- **Ships**: 5, 4, 3, 3, 2 sizes.
- **Turn Logic**: Strict alternation.
