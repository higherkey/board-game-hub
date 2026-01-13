# Lost In Translation Game Flow

## 1. Setup
*   **Host:** Selects "Lost In Translation".
*   **Mode:** Speed (Co-op/Competitive) or Bluff (Party).
*   **Categories:** Host selects topics (e.g., "Hollywood", "Top 40").

## 2. Round Start - The Glitch
*   **Server:**
    *   Picks phrase: "May the Force be with you."
    *   Pipeline: EN -> FR -> ZH -> ES -> EN.
    *   Result: "Hopefully the power accompanies you."
*   **Broadcast:** Display glitched text to all players.

## 3. Guessing Phase
*   **Timer:** 30 seconds.
*   **Input:** Players type answers.
*   **Validation (Live):**
    *   Frontend fuzzy match score vs "May the Force be with you".
    *   Threshold: > 85% similarity (ignores punctuation/case).
*   **Success:**
    *   First solver triggers "SOLVED!" animation.
    *   Timer drops to 10s for others.
*   **Time Out:** If no one solves.

## 4. Bluff Phase (Optional/Hard Mode)
*   **Condition:** Only if no distinct winner in Phase 3.
*   **Action:** Players write a fake "Original Phrase" that *could* have produced the glitch.
*   **Voting:** All options (Real + Fakes) shown. Players vote.

## 5. Reveal & Score
*   **Display:** Show the full translation chain.
    *   "May the Force be with you"
    *   ⬇️ (French) "Que la force soit avec vous"
    *   ⬇️ ...
    *   ⬇️ "Hopefully the power accompanies you"
*   **Points:** Awarded for Speed, Accuracy, and Bluffing.

## 6. Next Round
*   Repeat for N rounds.
*   Final Game: "The Ultimate Glitch" (Paragraph length).
