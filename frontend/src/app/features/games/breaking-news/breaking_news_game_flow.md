# Breaking News Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Breaking News".
- **Start**: Click "Start Game".

## 2. Assignment Phase
- **View**:
    - **Board**: "Breaking News Intro...".
    - **Anchor**: Assigned by System (Round Robin).
    - **Writers**: All other players.
- **Action**:
    - System loads a Script Template (e.g. "Weather Report").
    - Writers are assigned specific "Slots" (Noun, Adjective, etc.) to fill.

## 3. Writing Phase
- **View**:
    - **Writers**: Input forms for their assigned slots.
    - **Anchor**: waiting message (or preview?).
- **Action**:
    - Writers submit words for their slots.
    - Slots are shared/locked once submitted.
    - Transition when all slots filled.

## 4. Broadcast Phase
- **View**:
    - **Board**: Teleprompter Mode. Shows the final text with filled blanks highlighted.
    - **Anchor**: Reads the script aloud.
- **Action**:
    - Anchor reads the hilarious news report.
    - **Next Round**: Host/Anchor clicks "Next Story".

---

# Discrepancies / Notes
1.  **Genre Divergence**: This is implemented as a **Mad Libs** style cooperative game, NOT the competitive "Use Your Words" captioning game.
    - **Recommendation**: Rename if confusion arises, but "Breaking News" fits the theme.
2.  **Scoring**: Currently no scoring implemented (Creative/Cooperative only).
3.  **Content**: Scripts are hardcoded in Service (`GetRandomScript`). Needs expansion.
