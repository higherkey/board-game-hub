# Code Breaker (Based on: Mastermind)

**Status:** Backlog
**Players:** 2-6 (Competitive or Co-op)
**Time:** 10-20 Minutes
**Genre:** Puzzle, Deduction, Logic

## 🔐 Game Overview
A Digital adaptation of the classic code-breaking game. One entity (The Architect) sets a secret sequence of colored nodes. The other players (The Hackers) must deduce the correct sequence through trial and error, receiving feedback on their accuracy after each attempt.

## 📜 Rules
1.  **The Code:** The Architect (or CPU) sets a code of 4 colored nodes (hidden from others).
    *   Duplicates allowed? (Setting).
    *   Blanks allowed? (Setting).
2.  **The Hack:** Hackers submit a guess (e.g., Red-Blue-Green-Yellow).
3.  **The Feedback:** Logic returns 4 pins:
    *   **Black/Red Pin:** Correct Color AND Correct Position.
    *   **White Pin:** Correct Color but Wrong Position.
    *   **Empty:** No match.
    *   *Note:* The order of pins does NOT correspond to the order of slots (traditionally).
4.  **Turns:** Hackers have N attempts (usually 10-12) to crack the code.
5.  **Multiplayer Modes:**
    *   **Co-op:** Team discusses and submits one guess together.
    *   **Versus:** 1 Hacker vs 1 Architect.
    *   **Race:** Multiple Hackers solving their own codes simultaneously.

## 🏗️ Components & Architecture
*   `BreachGameService`: Logic validation algorithm (comparing guess vs secret).
*   `BreachBoardComponent`:
    *   `CodeRowComponent`: A single guess line with pegs.
    *   `PinFeedbackComponent`: The result indicators.
    *   `ColorPalette`: Draggable source of colors.

## 🏷️ 50 Alternative Names
1.  Cyber Breach
2.  Code Breaker
3.  Master Logic
4.  The Vault
5.  Crack The Code
6.  Sequence
7.  Firewall
8.  Encryption
9.  Decryption
10. System Override
11. Hack The Planet
12. Brute Force
13. Access Denied
14. Keypad
15. Combination
16. Locksmith
17. Safe Cracker
18. Digital Key
19. Pattern Match
20. Mind Reader
21. Logic Bomb
22. Syntax Error
23. The Password
24. Login
25. Authentication
26. Security Protocol
27. Black Box
28. Enigma
29. Cipher
30. Cryptography
31. The Riddle
32. Puzzler
33. Deduction
34. Brain Teaser
35. Color Code
36. Prism
37. Spectrum Solver
38. Neural Net
39. Algorithm
40. Binary Search
41. Debugger
42. Terminal
43. Command Line
44. Mainframe
45. Data Breach
46. Firewall Frontier
47. Signal Intercept
48. Decode
49. Unlock
50. Access Granted
