# Pictophone Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Pictophone".
- **Start**: Click "Start Game".

## 2. Writing Phase (Round 1)
- **State**: `phase = Writing`.
- **View**:
    - **All Players**: Input form to write a starting prompt (sentence).
- **Action**:
    - Each player writes a sentence and submits.
    - Books are created. Each book starts with a sentence.
    - Books are passed to the next player.

## 3. Drawing / Guessing Loop
- **Loop**: Depending on player count.
- **Drawing Phase**:
    - **View**: Player sees the previous sentence. Canvas to draw.
    - **Action**: Player draws the sentence. Submits drawing.
- **Guessing Phase**:
    - **View**: Player sees the previous drawing. Input to guess the sentence.
    - **Action**: Player writes a sentence describing the drawing. Submits.
- **Transition**: Backend handles rotation and phase switching.

## 4. Result Phase (Presentation)
- **State**: `phase = Results`.
- **View**:
    - **Board (Host)**: "Presentation Mode".
    - **Player**: "Look at the screen".
- **Action**:
    - **Next Page**: Host clicks **"Next Page"** (or Arrow Keys) to reveal the chain of a book.
    - **Next Book**: When a book is finished, proceed to the next book.
    - **End Game**: When all books shown, Host clicks **"End Game"** / **"Back to Lobby"**.

---

# Verification Notes
- Verify Host controls for presentation (Next Page, Next Book).
- Verify canvas tools (Pen, Eraser, Color).
