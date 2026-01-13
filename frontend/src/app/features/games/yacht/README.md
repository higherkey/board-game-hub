# Yacht (Based on: Yahtzee)

**Status:** Backlog
**Players:** 1-8
**Time:** 30 Minutes
**Genre:** Dice, Strategy, Chance

## 🎲 Game Overview
The classic dice-rolling game. Players roll five dice up to three times per turn to make specific combinations (Full House, Large Straight, Yacht). The game consists of 13 rounds. The player with the highest total score wins.

## 📜 Rules
1.  **The Roll:** Roll 5 dice.
2.  **Rerolls:** You can re-roll any number of dice up to 2 times (Total 3 rolls).
3.  **Categories:**
    *   **Upper Section:** Aces, Twos, Threes, Fours, Fives, Sixes. (Bonus +35 if Sum >= 63).
    *   **Lower Section:**
        *   3 of a Kind (Sum of all dice).
        *   4 of a Kind (Sum of all dice).
        *   Full House (25 pts).
        *   Small Straight (4 sequential, 30 pts).
        *   Large Straight (5 sequential, 40 pts).
        *   Yacht (5 of a kind, 50 pts).
        *   Chance (Sum of all dice).
4.  **Filling a Slot:** You MUST pick a slot after your rolls. If you can't satisfy the category, you must take a ZERO in that slot.
5.  **Bonus Yacht:** If you roll a Yacht but the slot is filled:
    *   If Yacht slot has 50 -> Bonus +100.
    *   Joker Rule: Can be used to fill other slots.

## 🏗️ Components & Architecture
*   `YachtGameService`: Score validation and turn tracking.
*   `YachtComponent`:
    *   `DiceRollerComponent`: 3D dice physics?
    *   `ScoreCardComponent`: Interactive table grid. (Columns for Players, Rows for Cats).

## 🏷️ 50 Alternative Names
1.  Yacht
2.  High Rollers
3.  Five Dice
4.  Full House
5.  Grand Slam
6.  Dice Poker
7.  Shake & Score
8.  Rolling Thunder
9.  Chance It
10. The Cup
11. Snake Eyes (Irony)
12. Boxcars
13. Tumblers
14. Straight Flush
15. Lucky Five
16. Jackpot
17. Bonus Round
18. Upper Lower
19. On A Roll
20. Hot Hand
21. High Stakes
22. Free Fall
23. Gravity
24. Kinetic
25. Momentum
26. Velocity
27. Probability
28. Statistics
29. Number Cruncher
30. Calculator
31. Sum It Up
32. Total Recall
33. Final Tally
34. The Ledger
35. Audit
36. Balanced Books
37. Quintet
38. Pentadice
39. Cinq
40. High Five
41. Take A Chance
42. Risk & Reward
43. Strategic Luck
44. Determinism
45. Chaos Theory
46. Entropy
47. Randomness
48. Fortuity
49. Serendipity
50. Kismet
