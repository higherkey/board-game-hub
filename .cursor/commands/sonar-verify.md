---
description: SonarQube — verify after changes / new analysis (step 7)
---

Follow **@.agent/workflows/sonarqube-review.md** (verify section). After recent fixes or a push, **re-check quality gate** (MCP or Web API, or **CI** via `gh` if useful). If a **new analysis** is needed, say when to run **`sonar-scanner`** locally or wait for CI. Report current gate status and any regressions.
