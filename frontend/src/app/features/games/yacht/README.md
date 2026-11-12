# Yacht (Based on: Yahtzee)

**Status:** Testing
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

## Implementation

Yacht is registered as `GameType.Yacht` (18) with `YachtGameService` and a role-aware standalone Angular `YachtComponent`.

- Table devices display shared dice, turn status, and the complete score deck; Hand devices expose controls only for the active participant.
- Support 1–8 Hand players, with Table devices excluded from the turn order. Players joining after the start watch until the next match.
- Roll up to three times, keep/release dice between rolls, preview server-calculated legal scores, and confirm a category before ending the turn. Zero remains distinct from an unused slot.
- Complete 13 categories per player within one untimed platform round. The server chooses winners (including ties), publishes cumulative scores, and sets the room to Finished. The existing host Finish Game control returns everyone to selection.
- Upper subtotal at least 63 earns 35. A repeat Yacht earns 100 only when Yacht already contains 50. The matching upper category must be filled first; otherwise choose an unused lower category, with Joker values for full house/straights. Only when all lower categories are full may another upper category be scratched. A scratched Yacht disables both the bonus and Joker.
- Persist scorecards, held dice, rolls, turn order, and winners through the existing room serializer. Reconnects rebind player references without changing seat order.
- Actions: `ROLL {}`, `TOGGLE_DIE { index: 0..4 }`, `SCORE { category: "Ones" | ... | "Chance" }`. Scores and dice supplied by clients are ignored. Invalid payloads, Table actions, paused/finished actions, and out-of-turn requests are rejected.

The catalog's Backlog → Testing change is delivered in the `EnableYacht` EF migration; no schema changes are required. Apply through the existing deployment migration bundle.

## Verification

Backend category/bonus/action/persistence tests live in `YachtGameServiceTests`; `YachtRoomIntegrationTests` covers room creation, a two-player match, automatic finish, and returning to the lobby. Frontend interaction specs live next to `YachtComponent`.

```bash
dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj
npm --prefix frontend test -- --no-watch --browsers=ChromeHeadless --include=src/app/features/games/yacht/yacht.component.spec.ts
npm --prefix frontend run build
```

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
