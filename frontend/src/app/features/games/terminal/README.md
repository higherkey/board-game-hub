# Terminal (Based on: Original "Code Breaker" Concept)

**Status:** Backlog
**Players:** 2-5 (Cooperative)
**Time:** 15-25 Minutes
**Genre:** Asymmetrical, Real-Time, Puzzle

## 📟 Game Overview
An asymmetrical cooperative game where one player plays as the **Hacker** (Overseer) and the others are **Agents** (Field Operatives). The Agents are infiltrating a facility but cannot see the map or hazards. References "Keep Talking and Nobody Explodes".

The Hacker sits at a terminal, viewing the facility schematics (digital map). They must type text commands (e.g., `OPEN DOOR_01`, `DISABLE CAM_4`) to clear the path. The Agents describe what they see ("I see a red door labeled 01") and move blindly based on the Hacker's voice commands.

## 📜 Rules
1.  **Roles:**
    *   **Hacker (1):** Sees the Map (Grid), Enemy Positions, Door Codes. Cannot Move.
    *   **Agent (1-4):** Sees First-Person View (or limited fog-of-war grid). Cannot see the layout or hidden traps.
2.  **Communication:** Vital. Constant voice chat required.
    *   Agent: "I'm at a T-junction. Left is a camera, Right is a locked door."
    *   Hacker: "Don't go Left! That camera is active. I'm hacking the door on the Right... type... type... OK, Door 02 Open. Go Right."
3.  **The Console:** The Hacker's UI is a text-based Command Line Interface.
    *   `LIST DEVICES` -> Shows nearby interactables.
    *   `PING` -> Reveals Agent location on map.
    *   `OVERRIDE [ID]` -> Mini-game to unlock.
4.  **Hazards:**
    *   **Guards:** Patrol paths visible only to Hacker.
    *   **Lasers:** Invisible to Agents, visible to Hacker? Or vice versa?
    *   **Time Limit:** "Alarm triggering in 60 seconds."
5.  **Winning:** Agents reach the Server Room / Extract Point.
6.  **Losing:** Agent caught by Guard, or Time runs out.

## 🏗️ Components & Architecture
*   `TerminalGameService`: Syncs agent coordinates vs map state.
*   `ConsoleComponent`: Authentically styled CLI (Green text, black background, blinking cursor).
*   `MapComponent`: Grid view for Hacker.
*   `AgentViewComponent`: Simple visuals for Agents (maybe just text adventure style or minimal 2D).

## 💡 Tech Note
*   The Hacker literally has to *type* commands. This adds tension.
*   "Typing speed is a mechanic."
