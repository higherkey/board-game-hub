# Clover-Minded (Based on: So Clover!)

**Status:** Backlog
**Players:** 3-6 (Cooperative)
**Time:** 20-30 Minutes
**Genre:** Word Association, Cooperative, Party

## 🍀 Game Overview
Lucky Clover is a cooperative word-association game. Players work together to get the highest score possible by correctly placing keyword cards back onto clover-shaped boards based on single-word clues.

## 📜 Rules
1.  **Setup:**
    *   Each player has a **Clover Board** with 4 slots.
    *   Each player draws 4 **Keyword Cards** (each with 4 words) and places them randomly in the slots. This creates 4 pairs of words on the edges of the board.
2.  **Writing Clues (Private):**
    *   Players look at their word pairs and write a single-word clue that connects the two words in each of the 4 pairs.
    *   Once finished, players remove the cards, draw a 5th "decoy" card, and shuffle all 5 together.
3.  **Resolution (Cooperative):**
    *   One player is the **Spectator**. They place their board and 5 shuffled cards in the center.
    *   Other players (the **Team**) discuss and try to place the 4 correct cards in the right slots and orientations based on the clues.
    *   The Spectator cannot talk or help!
4.  **Scoring:**
    *   **First Attempt:** 1 point per correct card + 2 bonus points if all 4 are correct (6 total).
    *   **Second Attempt:** Incorrect cards are removed. Team tries again. 1 point per correct card (no bonus).
5.  **Winning:** Total points after all players' boards are resolved.

## 🏗️ Components & Architecture
Server authority:
*   `backend/BoardGameHub.Api/Services/CloverMindedGameService.cs`: Generates cards, owns the round state, validates actions, computes scoring.

Frontend shells (Table vs Hand):
*   `CloverMindedTableComponent` (`clover-minded-table.component.ts`): Shared screen that renders the Clover board + center cards in real time.
*   `CloverMindedHandComponent` (`clover-minded-hand.component.ts`): Phone/tablet UI for private clue entry and team placement actions.

Shared visuals:
*   `KeywordCard3dComponent` (`keyword-card-3d.component.ts`): 3D-styled card that displays the 4 edge keywords and updates with rotation.

## Table vs Hand (global platform terms)
See `docs/platform-glossary.md` for the global definitions.
*   **Table**: `Player.isScreen === true` client; renders spectator’s clue words + the public card pool.
*   **Hand**: `Player.isScreen === false` client; submits private clues and performs team placement.

During resolution:
*   The backend marks a single **Spectator** (rule role) in `room.gameData.currentSpectatorId`.
*   The Spectator’s Hand is disabled for team actions (rotate/place/guess).

## Game setting (optional, on by default)
*   `cloverAllowPerPlayerSingleCardRotation`: if enabled, each Hand may rotate exactly one placed card per resolution attempt.
    *   UI disables rotation on other cards once the Hand has rotated their locked card.

## Status / Known gaps
*   Invalid clue rules (made-up words, keyword family, translations) are not enforced yet; the clone focuses on the card-placement loop.
*   The rulebook’s tie-break (“player to the Spectator’s left”) is not implemented; current scoring is rule-consistent and doesn’t require tie votes yet.

## 🎭 Alternative Names (The Pun-derful List)
1.  **So Clover** (The "Clever" Classic)
2.  **Clover-ly Done** (Cleverly)
3.  **Unbe-leaf-able** (Unbelievable)
4.  **Leaf Your Mark** (Leave your mark)
5.  **Clover-Minded** (Clever-minded)
6.  **Rooting for Words**
7.  **Bloom-ing Genius**
8.  **Four-tune Teller** (Four-leaf/Fortune)
9.  **Stem-sational** (Sensational)
10. **Leaf it to Us** (Leave it to us)
11. **Seed-ly Obvious** (Seemingly)
12. **Clover-age** (Coverage)
13. **Petal-ing Truths** (Peddling)
14. **Bee-leaf in You** (Believe)
15. **Moss Definitely** (Most)
16. **Fern-ly Believe** (Firmly)
17. **Wood You Believe**
18. **Clover-ed Up** (Covered)
19. **Leaf Reflection**
20. **Branch-ing Out**
21. **Stem-ulating** (Stimulating)
22. **The Budding Truth**
23. **Bloom-erang** (Boomerang)
24. **Sylvan Sync**
25. **Clover-field Connection**
26. **Leaf-wise** (Least-wise)
27. **Four-Sight** (Foresight)
28. **Green-light Thinking**
29. **Verdant Verses**
30. **Petal-Pushers**
31. **Garden of Wit**
32. **Clover-Path**
33. **Leaf-let Link**
34. **Herb Your Enthusiasm**
35. **Sage Advice** (Literal/Word association)
36. **Mint Condition**
37. **Seed a Clue**
38. **The Green Room**
39. **Grass Roots**
40. **Bloom Box**
41. **Clover Call** (Clever call)
42. **Leaf-ing Through**
43. **Petal Points**
44. **Stem a Clue**
45. **Clover-Logic**
46. **Root Awakening**
47. **Ever-Green Eyes**
48. **Leaf of Faith** (Leap of faith)
49. **Clover-Craft**
50. **The Final Bloom**
