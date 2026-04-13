---
description: Full Senior Peer Review and Code Quality Audit
---

// turbo-all
## Steps

1. **Code Review** — Systematically review all modified/new files for:
   - Bugs and race conditions
   - Best practices (SOLID, DRY, single-responsibility)
   - Memory leaks and lifecycle management
   - Performance bottlenecks

2. **Audit Test Quality** — Refer to the `/testing-workflow`:
   - Verify that all newly introduced logic has adequate unit test coverage.
   - Confirm that all backend and frontend tests are passing.
   - Look for opportunities to strengthen existing test suites.

3. **Immersion & UX Review** — Evaluate:
   - Animation timing and feel between Table and Hand devices
   - Real-world physical gameplay metaphors (e.g. dealing, placing, lifting cards)
   - Synchronization gaps where experience breaks immersion

3. **Accessibility Audit** — Verify:
   - Keyboard navigability for all interactive elements
   - ARIA labels on dynamic content
   - Colorblind-safe indicators (symbols, not color-only)
   - Adequate touch target sizes (minimum 44x44px)

4. **SonarQube Audit** — Follow `/sonarqube-review` workflow:
   ```
   # Step 4a — Check Quality Gate
   mcp_sonarqube_get_project_quality_gate_status(projectKey: "higherkey_board-game-hub")

   # Step 4b — Fetch open HIGH/BLOCKER issues
   mcp_sonarqube_search_sonar_issues_in_projects(projects: ["higherkey_board-game-hub"], severities: ["BLOCKER", "HIGH"])

   # Step 4c — Get key project measures
   mcp_sonarqube_get_component_measures(projectKey: "...", metricKeys: ["new_reliability_rating", "new_duplicated_lines_density", "code_smells", "ncloc"])

   # Step 4d — Investigate any unfamiliar rules
   mcp_sonarqube_show_rule(key: "<rule_key>")

   # Step 4e — Accept / mark false positives for pre-existing issues not in scope
   mcp_sonarqube_change_sonar_issue_status(key: "<key>", status: ["accept"])
   ```

5. **Fix Issues** — Apply code fixes for any issues found above:
   - Fix compilation errors introduced by the review changes immediately
   - Prioritize BLOCKER > HIGH > quality gate metrics

6. **Build Verification** — Confirm both builds pass:
   ```
   # Backend
   dotnet build backend/BoardGameHub.Api/BoardGameHub.Api.csproj 2>&1 | Select-String "error|Build succeeded" | Select-Object -Last 10

   # Frontend
   npm run build -- --configuration=development 2>&1 | Select-String "error TS|compiled" | Select-Object -Last 10
   ```

7. **Issue Creation** — For any large or systemic issues not immediately fixable, create a GitHub issue:
   ```
   gh issue create --title "<title>" --body "<body>"
   ```
   > Note: `gh issue create` may hang if run interactively. Best to include both `--title` and `--body` flags to avoid prompts.

8. **Task Closure** — Update `walkthrough.md` and `peer_review_audit.md` in the brain artifacts directory with:
   - Summary of all findings
   - What was fixed vs. deferred
   - Quality gate conditions and their current status
   - Next steps and open follow-up items