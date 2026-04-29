---
description: Procedures for managing GitHub issue relationships (Parent/Sub-issue, Blockers) using the REST API
---

# GitHub Relationship Management

This workflow defines the technical procedures for establishing and managing formal relationships between issues using the GitHub REST API.

> [!IMPORTANT]
> **REST API Version**: All commands MUST use the `X-GitHub-Api-Version: 2026-03-10` header (or current latest).
> **Preferred Method**: The REST API is the mandatory method for relationship management in this repository. Avoid using GraphQL.

## 1. Prerequisites: Retrieve Database IDs
Unlike GraphQL (which uses Node IDs), the REST API relationship endpoints often require the **integer Database ID** of the issues.

### Get Database ID for an Issue
```powershell
gh api repos/higherkey/board-game-hub/issues/[ISSUE_NUMBER] --jq .id
```

## 2. Formal Parent / Sub-issue Relationships
Use these endpoints to establish a hierarchy (e.g., Feature -> Task).
[Documentation: Sub-issues](https://docs.github.com/en/rest/issues/sub-issues?apiVersion=2026-03-10)

### Add a Sub-issue to a Parent
```powershell
# [PARENT_NUMBER] is the issue number (e.g., 135)
# [SUB_ISSUE_DATABASE_ID] is the integer ID of the child
gh api -X POST -H "X-GitHub-Api-Version: 2026-03-10" `
  repos/higherkey/board-game-hub/issues/[PARENT_NUMBER]/sub-issues `
  -F "sub_issue_id=[SUB_ISSUE_DATABASE_ID]"
```

### List Sub-issues
```powershell
gh api -H "X-GitHub-Api-Version: 2026-03-10" `
  repos/higherkey/board-game-hub/issues/[ISSUE_NUMBER]/sub-issues
```

## 3. Formal Blocker / Dependency Relationships
Use these endpoints to track issues that block or are blocked by others.
[Documentation: Issue Dependencies](https://docs.github.com/en/rest/issues/issue-dependencies?apiVersion=2026-03-10)

### Add a "Blocked By" Relationship
Adding a "Blocked By" relationship on Issue A to Issue B automatically marks Issue B as "Blocking" Issue A.
```powershell
# [ISSUE_NUMBER] is the issue that IS blocked (e.g., 135)
# [BLOCKER_DATABASE_ID] is the integer ID of the issue doing the blocking
gh api -X POST -H "X-GitHub-Api-Version: 2026-03-10" `
  repos/higherkey/board-game-hub/issues/[ISSUE_NUMBER]/dependencies/blocked_by `
  -F "issue_id=[BLOCKER_DATABASE_ID]"
```

### List Blockers
```powershell
gh api -H "X-GitHub-Api-Version: 2026-03-10" `
  repos/higherkey/board-game-hub/issues/[ISSUE_NUMBER]/dependencies/blocked_by
```

## 4. Other Advanced Properties
- [Labels](https://docs.github.com/en/rest/issues/labels?apiVersion=2026-03-10)
- [Assignees](https://docs.github.com/en/rest/issues/assignees?apiVersion=2026-03-10)
- [Comments](https://docs.github.com/en/rest/issues/comments?apiVersion=2026-03-10)
- [Issue Field Values (Project V2)](https://docs.github.com/en/rest/issues/issue-field-values?apiVersion=2026-03-10)
