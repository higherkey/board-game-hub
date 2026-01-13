# Terminal Game Flow

## 1. Setup
*   **Host:** Selects "Terminal".
*   **Roles:** 1 Player moves to "Hacker" slot. Others joined as "Agents".
*   **Difficulty:** "Script Kiddie" (Easy) -> "Zero Cool" (Hard).

## 2. Mission Briefing
*   **Hacker Screen:** "Connecting to Mainframe..." -> Displays Map.
    *   Dark Mode UI. Green text. "Target: Extract Data Core."
*   **Agent Screen:** "Infiltration Team Alpha." -> Displays Lobby/Entrance view.

## 3. Infiltration Phase (Loop)
*   **Event:** Agent approaches a Locked Door (ID: D-04).
*   **Comm:** Agent says "I'm at Door D-04. It's locked. Red light."
*   **Hacker Action:**
    1.  Looks at Map for D-04.
    2.  Types `SCAN D-04` -> "Encryption: Level 1".
    3.  Types `UNLOCK D-04` -> "Unlocking... Success."
*   **Result:** Door opens on Agent screen.

*   **Hazard - Camera:**
    *   Hacker sees "CAM-02" cone of vision sweeping.
    *   Hacker types `LOOP CAM-02`.
    *   Camera freezes. "Go now!"

*   **Hazard - Sentry:**
    *   Hacker sees Red Dot moving. "Patrol incoming via North Corridor!"
    *   Agent must Hide (press 'Duck').

## 4. Extraction
*   **Goal:** Reach the Data Core.
*   **Mini-Game:** Hacker and Agent must solve a puzzle together.
    *   Agent sees "Symbol: Omega"
    *   Hacker types `AUTH OMEGA`
*   **Run:** Alarm trips. 60 second timer.
    *   Spam commands to lock doors BEHIND the agents to slow guards.

## 5. Debrief
*   **Win:** Agents reach Exit Zone.
*   **Loss:** All Agents captured/killed.
