# Courtship Game Flow

## 1. Setup
*   **Host:** Selects "Courtship".
*   **Deck:** 16 cards shuffled.
*   **Deal:**
    *   1 card to each player.
    *   1 card burned (face-down).
    *   (2-player only: 3 additional cards burned face-up).
*   **Starting Player:** Winner of last round or random.

## 2. Turn Sequence
*   **Start:** Active Player draws 1 card (Hand = 2).
*   **Action:** Player selects 1 card to play.
*   **Effect Resolution:**
    *   **Guard:** Select Target + Character (Pop-up menu). Result: Eliminate or Miss.
    *   **Priest:** Select Target. Result: Private Modal shows opponent's card.
    *   **Baron:** Select Target. Result: Auto-compare. Loser eliminated (UI notification).
    *   **Handmaid:** Player status = Protected.
    *   **Prince:** Select Target. Result: Target discards and redraws. (Check if Princess -> Eliminate).
    *   **King:** Select Target. Result: Swap hands.
    *   **Countess:** Auto-highlight if K/P in hand.
    *   **Princess:** Auto-eliminate if played.
*   **Cleanup:** Played card adds to Discard Pile history. Turn passes left.

## 3. Elimination
*   **Trigger:** Guard guess, Baron loss, Princess discard.
*   **Action:**
    *   Player reveals hand (card moves to discard).
    *   Player status = Eliminated.
    *   Out of round.

## 4. Round End
*   **Condition A:** Only 1 player remains.
    *   Winner: Survivor.
*   **Condition B:** Deck is empty.
    *   Winner: Player with highest card value in hand.
    *   Tie-Breaker: Sum of discard pile values.
*   **Reward:** +1 Token of Affection.

## 5. Game End
*   **Check:** Does any player have N Tokens? (2p=7, 3p=5, 4p=4).
*   **Yes:** Declare Winner.
*   **No:** Shuffle and Start New Round (Step 1).
