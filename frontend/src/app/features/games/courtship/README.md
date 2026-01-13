# Courtship (Based on: Love Letter)

**Status:** Backlog
**Players:** 2-6
**Time:** 20 Minutes
**Genre:** Deduction, Risk, Card Game

## 💌 Game Overview
Players are suitors trying to get their love letter into the hands of the Princess. In a game of risk and deduction, you hold only one card at a time. On your turn, you draw one card and play one card, trying to expose others while keeping your letter safe.

## 📜 Rules
1.  **Deck:** 16 Cards. Values 1-8 (or 9 in variants).
2.  **Setup:** Deal 1 card to each player. Remove 1 card from play face-down (Burn card).
3.  **Turn:**
    *   Draw 1 card (Hand = 2 cards).
    *   Play 1 card face-up.
    *   Resolve Effect immediately.
4.  **Card Effects (Classic):**
    *   **1 (Guard):** Guess another player's hand. If correct, they are out. (Cannot guess Guard).
    *   **2 (Priest):** Look at another player's hand.
    *   **3 (Baron):** Compare hands with another. Lower value is out.
    *   **4 (Handmaid):** Protection until your next turn.
    *   **5 (Prince):** Choose a player to discard their hand and draw new card.
    *   **6 (King):** Trade hands with another player.
    *   **7 (Countess):** Must be discarded if you hold King or Prince.
    *   **8 (Princess):** If discarded, you are out.
5.  **Round End:**
    *   Deck Empty: Player with highest value card wins.
    *   Last Standing: If all others eliminated, last player wins.
6.  **Winning:** Collect tokens of affection (usually 4-7 depending on player count).

## 🏗️ Components & Architecture
*   `CourtshipGameService`: State machine for turns, effects, and eliminations.
*   `CourtshipComponent`:
    *   `HandComponent`: Your current card(s).
    *   `TableComponent`: Discard piles (important for tracking played cards).
    *   `OpponentView`: Shows connection status, protection status, and tokens.

## 🏷️ 50 Alternative Names
1.  Courtship
2.  Royal Intrigue
3.  The Suitor
4.  Affection
5.  Message In A Bottle
6.  The Courier
7.  Secret Admirer
8.  Brief Encounter
9.  Last Dance
10. The Rose
11. Privy Council
12. Throne Room
13. High Stakes Heart
14. The Favor
15. Liaison
16. Whispers
17. Rumor Mill
18. Palace Guard
19. Masquerade
20. Hidden Agenda
21. The Letter
22. Signed, Sealed, Delivered
23. Post Haste
24. Royal Mail
25. Influence
26. Inner Circle
27. Checkmate
28. Only One
29. The Chosen
30. Destiny
31. Fate's Hand
32. Closer To You
33. Final Rose
34. Heartstrings
35. Cupid's Arrow
36. The Proposal
37. Engagement
38. Betrothal
39. Noble Pursuit
40. Chivalry
41. Entourage
42. Social Climber
43. Status
44. Rank & File
45. Power Play
46. King's Court
47. Queen's Gambit
48. Heir Apparent
49. Succession
50. Regency
