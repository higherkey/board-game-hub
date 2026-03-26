---
description: How to complete SonarQube reviews using SonarScanner, the Web API, MCP tools, and the UI
---

# SonarQube Review Workflow

## Guiding Principle: Right Tool for Each Layer

1. **SonarScanner (`sonar-scanner`)** — Use for **running an analysis** and sending results to SonarQube or SonarCloud. It does **not** read quality gates, list issues, change issue status, or review security hotspots on the server.

2. **SonarQube Web API** — Use (**e.g.** `curl`, PowerShell `Invoke-RestMethod`, or any HTTP client) for **everything after analysis**: quality gate status, issue search, measures, issue transitions, webhooks, and more. Your instance documents endpoints at **`/web_api`** (paths can differ slightly between SonarQube Server and SonarCloud).

3. **MCP server tools** — Prefer these **when they wrap the same Web API** and are convenient for an agent; otherwise call the Web API directly with a token. MCP is **not** the only programmatic option.

4. **Web UI** — Prefer for **exploration** (rich filtering, dashboards) when you are working as a human, not as a hard requirement for all workflows.

5. **`gh` (GitHub CLI)** — Use only where it helps with **GitHub-side context** (PR checks, CI workflow runs, etc.). It is not a SonarQube client.

---

## Capability Reference

### SonarScanner CLI (`sonar-scanner`)

| Task | Notes |
|------|--------|
| Trigger a new scan | `sonar-scanner -Dsonar.projectKey=<key>` (and other `-Dsonar.*` properties or `sonar-project.properties`) |
| Help / version / debug | `-h`, `-v`, `-X` |

Everything **not** in this table is outside SonarScanner’s job; use the Web API or UI instead.

---

### Web API and UI (server state after analysis)

| Task | Approach |
|------|----------|
| View project dashboard | Open your SonarQube or SonarCloud project in the browser |
| View quality gate status | **Web API** (see `/web_api`: quality gate / project status) **or** CI output **or** UI |
| Browse issues by file | **Web API** (`issues/search` and related) **or** UI (often faster to explore manually) |
| Security hotspot review (Safe / Fixed / Acknowledged / etc.) | **Not via SonarScanner.** Use **UI**, **SonarQube for IDE** where supported, or the **hotspot Web API** actions your server exposes under `/web_api`—subject to **edition and permissions** |

---

### MCP Server Tools (Web API convenience)

The MCP server maps to **programmatic** workflows that would otherwise use the Web API. Use these tools when they are available and fit the task; use **raw HTTP** when MCP does not expose what you need.

| Tool | When to Use |
|------|------------|
| `mcp_sonarqube_search_my_sonarqube_projects` | Discover project keys |
| `mcp_sonarqube_search_sonar_issues_in_projects` | Fetch and filter issues by severity, project, or PR |
| `mcp_sonarqube_get_project_quality_gate_status` | Check if quality gate passes (by project key, analysis ID, or PR) |
| `mcp_sonarqube_get_component_measures` | Pull metrics: coverage, complexity, violations, ncloc, etc. |
| `mcp_sonarqube_change_sonar_issue_status` | Accept, mark as false positive, or reopen an issue (by issue key) |
| `mcp_sonarqube_analyze_code_snippet` | Run a quick ad-hoc analysis on a snippet of code |
| `mcp_sonarqube_show_rule` | Get detailed information on a specific rule key |
| `mcp_sonarqube_get_raw_source` | View the raw source of a file as SonarQube sees it |
| `mcp_sonarqube_list_quality_gates` | List all quality gate definitions |
| `mcp_sonarqube_list_languages` | List all supported languages |
| `mcp_sonarqube_list_rule_repositories` | List rule repositories, optionally filtered by language |
| `mcp_sonarqube_list_webhooks` | List configured webhooks |
| `mcp_sonarqube_create_webhook` | Register a new webhook for a project |

> **SonarScanner does not** resolve security hotspots or change server issue state. Hotspot workflow is **UI / IDE / Web API** depending on your setup—confirm allowed operations in `/web_api` and your token permissions.

---

## Standard Review Process

1. **Check Quality Gate** — Use **MCP** or **Web API** (not SonarScanner):
   ```
   mcp_sonarqube_get_project_quality_gate_status(projectKey: "higherkey_board-game-hub")
   ```

2. **List Issues** — Use **MCP** or **`issues/search`** via the Web API; filter by severity as needed:
   ```
   mcp_sonarqube_search_sonar_issues_in_projects(projects: ["higherkey_board-game-hub"], severities: ["HIGH", "BLOCKER"])
   ```

3. **Investigate a Rule** — If an issue is unclear, look up the rule (**MCP** or Web API):
   ```
   mcp_sonarqube_show_rule(key: "javascript:SomeRule")
   ```

4. **Fix Issues** — Edit source code directly and re-commit.

5. **Accept / False Positive** — For issues that will not be fixed, use **MCP** or the Web API transition for that issue key:
   ```
   mcp_sonarqube_change_sonar_issue_status(key: "<issueKey>", status: ["accept"])
   ```

6. **Security Hotspots** — **SonarScanner does not** review them. Handle via **UI**, **SonarQube for IDE** if applicable, or **hotspot endpoints** documented on your server’s `/web_api` if your token has the right permissions.

7. **Verify Gate Passes** — After pushing changes, re-check quality gate status (**MCP**, Web API, CI, or UI). Run **`sonar-scanner`** again when you need a **new analysis** uploaded to the server.
