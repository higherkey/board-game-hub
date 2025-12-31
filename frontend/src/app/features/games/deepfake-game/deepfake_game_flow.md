# Deepfake Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Deepfake".
- **Start**: Click "Start Game".
- **Roles**: One player is assigned "AI" (Fake Artist), others are "Artists".
- **Prompt**: Artists see Category + Specific Word. AI sees Category + "X" (or "Blend in").

## 2. Drawing Phase (Repeats twice)
- **State**: `phase = 0 (Drawing)`.
- **Structure**: The drawing phase consists of **2 complete rounds** of turns.
- **Turn Order**: Determined by backend (random or fixed).
- **View**:
    - **Header**: Shows Category. Role/Prompt (hidden for AI).
    - **Canvas**: Interactive drawing area.
    - **Sidebar**: List of players. Active drawer highlighted.
- **Action**:
    - **Active Player**: Draws **one contiguous stroke**.
    - **Stroke End**: Lifting the mouse/finger submits the stroke.
    - **Pass**: Turn passes to next player.
- **Transition**: After every player has drawn **twice**, phase transitions to Voting.

## 3. Voting Phase
- **State**: `phase = 1 (Voting)`.
- **View**:
    - **Sidebar**: Voting Form. "Who is the AI?".
- **Action**:
    - All players vote for a suspect.
    - **Majority Rule**: 
        - If the AI receives the most votes (or majority?), AI is **Caught**.
        - If another player receives most votes (or tie?): AI **Wins** immediately.

## 4. AI Redemption (Condition: AI Caught)
- **State**: `phase = 1` & `aiCaught = true`.
- **View**:
    - **AI**: Input box "Guess the secret word to win!".
    - **Artists**: "AI is trying to guess...".
- **Action**:
    - AI submits a guess.
    - **Correct Guess**: AI **Wins** (Points awarded to AI).
    - **Incorrect Guess**: Artists **Win** (Points awarded to Artists).

## 5. Result Phase
- **State**: `phase = 2 (Results)`.
- **View**:
    - **Header**: Winner Declaration ("AI Wins" or "Artists Win").
    - **Details**: The Secret Word, The AI Identity.
    - **Canvas**: Visualization of the masterpiece.
- **Action**:
    - **Scoring**: (Optional/TBD)Backend tracks score? 
    - **Next Round**: Host clicks **"Next Round"**.

---

# Discrepancies / Notes
1.  **Multiple Strokes**: Backend must enforce 2 rounds of drawing (Total Turns = PlayerCount * 2).
2.  **Scoring**: Need to clarify point values (e.g. 2pts for AI win, 1pt for Artists).
3.  **Host Control**: Ensure "Next Round" is available.
