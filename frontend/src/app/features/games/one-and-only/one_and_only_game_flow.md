# One and Only Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "One and Only".
- **Start**: Click "Start Game".

## 2. Clue Giving Phase
- **State**: `phase = ClueGiving`.
- **View**:
    - **Guesser**: "Waiting for clues...". (Target Word Hidden).
    - **Clue Givers**: Show Target Word (e.g. "Apple"). Input form for 1-word clue.
- **Action**:
    - Givers submit clues.
    - **Valid Clues**: Single word, not same root as target.
    - **Transition**: When all clues submitted -> Elimination.

## 3. Guessing Phase
- **State**: `phase = Guessing`.
- **View**:
    - **Guesser**: Shows Valid Clues (Duplicates hidden/crossed out). Input for Guess.
    - **Clue Givers**: Waiting for guess. Shows eliminated clues.
- **Action**:
    - **Guesser**: Submits Guess or Pass.
    - **Logic**: 
        - Correct -> Success (+1 Score).
        - Incorrect -> Failure (Lives lost / Score penalty).
        - Pass -> Safety (Score penalty reduced).

## 4. Result Phase
- **State**: `phase = Result`.
- **View**:
    - **All**: Result screen (Success/Failure), Total Score.
- **Action**:
    - **Next Card**: Host clicks **"Next Round"**.

---

# Discrepancies / Notes
1.  **Duplicate Detection**: Backend `EliminateClues` handles basic normalization (trim, lowercase, trailing 's'). It correctly eliminates duplicates.
2.  **Scoring**: Purely cooperative session stats (Correct/Failed count). Matches "Just One" spirit.
3.  **Variant**: Old flow doc described "Reverse Scattergories". Code is definitely "Just One".
