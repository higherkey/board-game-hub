# Work Trace - 125-fix-sonar-coverage

## 1. Planned Work

### TODO List
- [x] Re-architect `.github/workflows/sonar.yml` to use unified `dotnet-sonarscanner`.
- [x] Explicitly configure `lcov.info` generation in `frontend/karma.conf.js`.
- [x] Clean up redundant configs in `sonar-project.properties`.
- [x] Document CI/Testing architecture across all READMEs and Agental Mandates.
- [ ] Perform Finalization Process (Parity Check, Peer Review, Approval).

### File List
- `.github/workflows/sonar.yml` (Modified)
- `frontend/karma.conf.js` (Modified)
- `sonar-project.properties` (Modified)
- `README.md` (Modified)
- `backend/README.md` (Modified)
- `frontend/README.md` (Modified)
- `.agent/workflows/testing-workflow.md` (Modified)
- `AGENTS.md` (Modified)
- `GEMINI.md` (Modified)

### Rationale
- **Infrastructure**: Standard `SonarCloud` generic scanners fail to analyze C# correctly in monorepos. Transitioning to `dotnet-sonarscanner` (The "Sandwich" architecture) ensures accurate backend analysis while ingesting frontend LCOV data.
- **Protocol**: Explicit documentation ensures future agents and developers respect the "Automatic Analysis = OFF" mandate and follow the unified testing pipeline.

---

## 2. In Progress Work
- Finalizing the branch using the mandatory `feature-tracking` protocol.

---

## 3. Completed Work
- **CI Re-Architecture**: Implemented the `dotnet-sonarscanner` pipeline in `sonar.yml`, including Java 17 and global tool installation.
- **Reporting Optimization**: Consolidated Sonar configurations into the workflow file and forced flat LCOV output in Karma.
- **Documentation Blitz**: Updated 6 core files to define the "Unified Monorepo Architecture" and usage of the new testing pipeline.

---

## 4. Issues and Out of Scope
- **4b) Opportunity**: Discovered that SonarCloud "Automatic Analysis" is likely the primary reason for 0% coverage reports; documented the requirement to disable it.

---
