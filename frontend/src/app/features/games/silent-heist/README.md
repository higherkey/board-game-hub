# Silent Heist (Based on: Magic Maze)

**Status:** Backlog
**Players:** 1-8 (Cooperative)
**Time:** 3-15 Minutes
**Genre:** Real-time, Cooperative, Puzzle

## 🤫 Game Overview
A team of thieves must navigate a sensory-deprived facility to steal four key items and escape. The catch: no one can talk, and each player controls only one *direction* (e.g., only Bob can move characters North). Players must synchronize their minds and actions to move the four shared characters (Red, Green, Blue, Yellow) through the maze before the timer runs out.

## 📜 Rules
1.  **Characters:** 4 pawns (R, G, B, Y). Anyone can move any pawn at any time.
2.  **Actions:** Players are dealt specific actions (e.g., North, East, Explore, Escalator).
    *   *You* are the only person who can perform your action for *any* character.
3.  **Communication:** Absolute silence. No pointing (except with the "Do Something!" pawn).
    *   Breaks: Flipping the timer allows brief talking until someone moves again.
4.  **Timer:** Short countdown (3 mins).
    *   Timer Spaces: Moving a hero here flips the timer (and disables the space).
5.  **Objective:**
    *   Move each hero to their matching "Item" space simultaneously.
    *   Once all 4 are on items -> THEFT! (Alarm trips, special abilities disable).
    *   Move each hero to their matching "Exit".
6.  **Failure:** Timer runs out.

## 🏗️ Components & Architecture
*   `SilentHeistGameService`: Precision timer, action validation, tile mapping.
*   `SilentHeistBoardComponent`:
    *   `GridComponent`: Dynamic tile system.
    *   `PawnLayer`: Smooth interpolation for real-time moves.
*   `ActionOverlay`: "DO SOMETHING!" flashing indicator.

## 🏷️ 50 Alternative Names
1.  Silent Heist
2.  Mall Rat Run
3.  Quiet Riot
4.  Hush Money
5.  The Silent Job
6.  Mime Crime
7.  Whisper Walk
8.  Silent Steps
9.  Coordinated Chaos
10. Breakout
11. The Escape
12. Gridlock
13. Synced
14. Telepathic Thieves
15. Flow State
16. The Maze
17. Labyrinth
18. Dungeon Dash
19. Clockwork
20. Time Crunch
21. Beat The Clock
22. Panic Room
23. Sensory Deprivation
24. Blind Trust
25. North by Northwest
26. One Way Street
27. Directional
28. Vector Squad
29. Compass Rose
30. Shadow Run
31. Ghost Protocol
32. Stealth Mode
33. Covert Ops
34. The Getaway
35. Smash & Grab
36. Exit Strategy
37. Four Corners
38. Quadrants
39. Cardinal Sins
40. Moving Parts
41. Gear Shift
42. Synchronicity
43. Hive Mind
44. Impulse
45. Reflex
46. Twitch
47. Flash Mob
48. Quick Silver
49. Warp Speed
50. Silent Alarm
