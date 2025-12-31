# Nom De Code Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Nom De Code".
- **Teams**: Players split into Red and Blue teams.
    - **Spymasters**: 1 per team elected/assigned.
    - **Agents**: Remaining players.
- **Start**: Click "Start Game".

## 2. Spymaster Phase
- **State**: `phase = ClueGiving`.
- **View**:
    - **Spymasters**: See the Key (Grid Colors: Red, Blue, Neutral, Assassin).
    - **Agents**: See only the Words (Neutral grid).
- **Action**:
    - **Active Spymaster**: Types a Clue (1 Word) and a Number (e.g., "Ocean, 2").
    - **Submit**: Sends clue to team.

## 3. Guessing Phase
- **State**: `phase = Guessing`.
- **View**:
    - **All**: See the Clue ("Ocean: 2").
- **Action**:
    - **Active Agents**: Click words on the grid to guess.
    - **Logic**:
        - **Correct Color**: Team keeps guessing (up to Number + 1).
        - **Opponent Color**: Turn ends. Opponent gets the point.
        - **Neutral**: Turn ends.
        - **Assassin**: Game Over (Instant Loss).

## 4. End Turn / Game
- **Turn Switch**: automatic on mistake or user clicks "End Turn".
- **Game End**:
    - All team's words found -> Win.
    - Assassin touched -> Loss.
- **Action**: Host clicks "Play Again".

---

# Implementation Notes
- **Grid**: 5x5 (25 words).
- **Distribution**:
    - Start Team: 9 Words.
    - Second Team: 8 Words.
    - Bystanders: 7.
    - Assassin: 1.
- **Word List**: Need a robust dictionary.
