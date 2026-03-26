---
description: SonarQube — full review flow (gate → issues → rules → verify)
---

Run the **full** Sonar review process in **@.agent/workflows/sonarqube-review.md**:

1. Quality gate  
2. List issues (prioritize HIGH/BLOCKER unless I say otherwise)  
3. For the top issues, pull **rule** details where it helps  
4. Summarize **code fixes** vs **server transitions** (accept/FP)—only transition with explicit approval  
5. Call out **security hotspots** separately (no `sonar-scanner`)  
6. End with **verify** steps after merge/push  

Use this project’s real **Sonar project key** when known; otherwise discover via MCP or ask me once.
