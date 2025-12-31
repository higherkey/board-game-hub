# Symbology Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Symbology".
- **Start**: Click "Start Game".

## 2. Clue Phase
- **Components**: Grid of images (Concept style) in `icon-board`.
- **View**:
    - **Host/Board**: Shows the target word (Secret). Public Board.
    - **Active Word**: Randomly selected (e.g. "Titanic", "Coffee").
    - **Active Player**: The only one who can place markers.
- **Action**:
    - **Place Marker**: Active Player clicks icons.
        - **Main Concept**: Question Mark (Green).
        - **Sub Concept**: Exclamation Points (Red, Blue, etc.).
        - **Cubes**: Additional markers of same color.
    - **Remove Marker**: Active Player can edit board.

## 3. Guessing Phase
- **View**:
    - **All**: See the board updates in real-time.
    - **Guesser**: Input form to guess the word. (All non-active players).
- **Action**:
    - Guessers submit text.
    - **Correct**: Round ends immediately. 10 pts to Guesser & Active Player.
    - **Incorrect**: Added to log. No penalty?

## 4. End Round
- **View**: Summary (Winner, Word).
- **Action**: **Next Round** (Rotate Active Player).

---

# Discrepancies / Notes
1.  **Icon Set**: Frontend `symbology-icons.ts` defines the available icons. Needs to be comprehensive to be playable.
2.  **Scoring**: Simplified. 10pts flat. Official rules have 2pts/1pt tokens.
3.  **Real-time**: Crucial that markers update instantly for all players.
