# Clover-Minded Game Flow

This flow mirrors the rulebook (So Clover!) while mapping to how the clone works across **Table** and **Hand** clients.

Key terms (global platform terms):
*   **Table**: shared display (`Player.isScreen === true`)
*   **Hand**: personal device (`Player.isScreen === false`)
*   **Spectator**: a rule role picked per resolution round (Spectator's Hand is locked; no team actions)

## 1. Setup
*   **Initialization:** The server generates cards from a built-in word bank.
*   **Board Assignment:** Each Hand player receives a digital Clover Board (4 slots).

## 2. Planning Phase (Individual, Hands only)
*   Each Hand sees 4 outer edges, each containing a **pair** of keywords.
*   Each Hand types a **single-word Clue** for each pair.
*   Action: tap **`I'M DONE`**.
*   **Clone note:** The rulebook’s “invalid clue” constraints are not fully enforced yet.

## 3. The Shuffle (server-side)
*   The 4 used cards are removed from the board.
*   A 5th random card is added as a distractor (decoy).
*   The 5 cards are shuffled and placed into the center pool.

## 4. Resolution Phase (Team)
*   Table + Hands cycle through each Hand player one by one.
*   One Hand is the **Spectator** for that board.
*   Table shows:
    *   Spectator name
    *   the 5 center cards
    *   the Spectator’s 4 clue words
*   Hands show:
    *   a tap-to-place UI for the team (Spectator is locked)
*   **Rotations:** 0 / 90 / 180 / 270 (digitally represented as 0..3 quarter turns).
*   Team submits by tapping **`GUESS`** when all 4 slots are filled.

### Optional rule setting (on by default)
*   `cloverAllowPerPlayerSingleCardRotation = true`
*   During a resolution attempt, each Hand may rotate **exactly one** placed card (server enforced).

## 5. Feedback Loop
*   **Attempt 1:**
    *   If 4/4 correct: 🌟 PERFECT! +6 points.
    *   Otherwise: the Spectator removes the incorrect card(s) from the center; Team gets one last attempt.
*   **Attempt 2:**
    *   Team fills remaining empty slots.
    *   Scoring: +1 per correct card (0..4).

## 6. Global Scoreboard
*   Points from all resolved boards are totaled.
*   Final score is shown on the Table during the round transitions / end.

## Tie-break (rulebook)
If there’s disagreement on where cards should go, the rulebook says: **“player to the Spectator’s left”** decides.
The clone does not yet implement the tie-break UI; the current team submits once they agree.
