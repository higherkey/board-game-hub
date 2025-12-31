# Deepfake Game Flow

## 1. Game Setup (Lobby)
- **Host**: Selects "Deepfake".
- **Start**: Click "Start Game".

## 2. Drawing Phase
- **State**: `DeepfakeState.phase = 0 (Drawing)`.
- **View**:
    - **Header**: Shows Role (Artist/AI) + Prompt (if Artist) / "Blend in" (if AI).
    - **Canvas**: Interactive drawing area.
    - **Sidebar**: List of players. Active drawer marked.
- **Action**:
    - **Active Player**: Draws a stroke.
    - **Stroke End**: Automatically submits stroke and ends turn.
    - **Wait**: Others watch stroke appear in real-time (via signalR updates).
- **Transition**: Backend handles turn rotation. After X rounds, phase changes.

## 3. Voting Phase
- **State**: `DeepfakeState.phase = 1 (Voting)`.
- **View**:
    - **Sidebar**: Voting Form (Select Suspect).
- **Action**:
    - Players vote for who they think is the AI.
    - **Majority Vote**: If AI receives majority -> AI is Caught.
    - **No Majority/Wrong**: AI Wins (or goes to next stage? Logic implies single voting round).

## 4. AI Redemption (Conditional)
- **State**: `phase = 1` AND `aiCaught = true`.
- **View**:
    - **AI**: Input box "Guess the prompt".
    - **Artists**: "AI is trying to guess...".
- **Action**:
    - AI submits guess.
    - If correct -> AI Wins (Steal).
    - If incorrect -> Artists Win.

## 5. Result Phase
- **State**: `DeepfakeState.phase = 2 (Results)`.
- **View**:
    - **Sidebar**: Game Over. Winner declaration. Prompt & AI reveal.
    - **Canvas**: Replays the drawing history stroke-by-stroke.
- **Action**:
    - **Next Round**: Host clicks **"Next Round"**.
    - **Critical Missing Feature**: There is currently **NO BUTTON** for "Next Round" in the Result view.

---

# Discrepancies / Notes
1.  **Missing "Next Round" Button**: The Result view lacks controls for the Host to proceed.
2.  **Mobile Support**: Canvas height is fixed at 400px.
