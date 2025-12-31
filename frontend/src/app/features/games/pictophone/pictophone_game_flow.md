# Pictophone Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Pictophone".
- **Start**: Click "Start Game".

## 2. Prompting Phase (Round 0)
- **State**: `phase = Prompting`.
- **View**:
    - **All Players**: Input form to write a starting prompt (sentence).
- **Action**:
    - Each player writes a sentence and submits.
    - Books are created. Each book starts with a sentence.
    - Books are passed to the next player.

## 3. Drawing / Guessing Loop
- **Loop**: Rounds 1 to N (Player Count).
- **Drawing Phase**:
    - **View**: Player sees the previous sentence. Canvas to draw.
    - **Action**: Player draws the sentence. Submits drawing.
- **Guessing Phase**:
    - **View**: Player sees the previous drawing. Input to guess the sentence.
    - **Action**: Player writes a sentence describing the drawing. Submits.
- **Transition**: Backend alternates `Drawing` / `Guessing` phases until book returns to owner.

## 4. Reveal Phase
- **State**: `phase = Reveal`.
- **View**:
    - **Board (Host)**: "Presentation Mode". Shows current Book/Page.
    - **Player**: "Look at the screen". Validates stars can be given? (Backend supports `STAR_PAGE`).
- **Action**:
    - **Next Page/Book**: Host clicks **"Next"** to reveal the chain step-by-step.
    - **Star**: Players can "Star" favorite pages (Friendly scoring).

---

# Discrepancies / Notes
1.  **Ending Phase**: Logic alternates phases. For Even player counts, the book ends on a Drawing. Physical rules suggest ending on a Guess (by passing first if odd?), but the digital implementation works fine.
2.  **Scoring**: Purely "Stars" (Likes). No competitive scoring. Matches "Friendly" variant.
3.  **Host Controls**: Confirmed implemented (Pause/Skip/Reveal).
