---
description: SonarQube review router (gate/issues/rules/transition/hotspots/verify)
---

Use **@.agent/workflows/sonarqube-review.md**.

When I run this command, figure out which step I’m asking for and follow the corresponding part of the workflow:

- `quality gate` → gate check
- `list issues` / `issues` → list + filter
- `rule` / `explain rule` → rule lookup / explanation
- `accept` / `false positive` / `reopen` → issue transition
- `hotspots` → hotspot guidance (note: not SonarScanner)
- `verify` → re-check gate after changes
- if I say `full` / `complete` → run the full review flow end-to-end

If the request is ambiguous, ask one clarifying question before changing anything on the Sonar server.

