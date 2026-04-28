---
description: Procedures and best practices for creating GitHub Issues in the Board Game Hub repository
---

# Creating GitHub Issues

Follow this workflow to ensure every issue is well-defined, properly categorized, and integrated into the project management board.

## 1. Research & Requirements Check
Before creating a new issue, verify if there are any repository-specific requirements that override general best practices.

- Check `.github/ISSUE_TEMPLATE/` for specific formats.
- Check `.github/CONTRIBUTING.md` if it exists.
- Search for existing issues to avoid duplicates.

## 2. General Best Practices
- **Title**: Use a clear, concise title. For features, use `feat: [Description]`. For bugs, use `fix: [Description]`.
- **Description**:
  - **Problem/Goal**: Clear explanation of what needs to be solved.
  - **Proposed Solution**: Technical or functional approach.
  - **Acceptance Criteria**: A checklist of "done" states.
  - **Tasks**: Granular steps to complete the work.
- **Labels**: Apply relevant labels like `enhancement`, `bug`, `Architecture`, or `documentation`.

## 3. Board Game Hub Specifics
All issues in this repository **MUST** be integrated into the project management board with the following metadata:

### Project Selection
Add the issue to the relevant project:
- `BGH Beta 0.2` (Current active milestone)
- `BGH Beta Deployment` (Deployment-related tasks)
- `Board Game Website POC` (Foundational/Proof of Concept work)

### Required Fields (Estimates)
Every issue must have the following fields set (usually via labels or Project fields):
- **Priority**: `Priority: High`, `Priority: Medium`, or `Priority: Low` (or `P0`/`P1`/`P2`).
- **Size**: `Size: Small`, `Size: Medium`, or `Size: Large`.
- **Status**: `Status: Backlog`, `Status: Ready`, etc.

## 4. Advanced Properties (GitHub REST API)
For properties not supported by basic `gh issue create` (like complex relationships or specific repository settings), use the **GitHub REST API**. This is the preferred method for advanced interactions.

Example for adding a comment via REST:
```powershell
gh api -X POST repos/{owner}/{repo}/issues/{issue_number}/comments -f body="Advanced comment via REST"
```

## 5. Pre-Creation Checklist
Before finalizing the issue:
1. **Review Content**: Does the title match the description? Are the tasks exhaustive?
2. **Technical Accuracy**: If technical implementation details are provided, verify they align with the current architecture (e.g., Table vs Hand roles).
3. **Verify Project Metadata**: Ensure Priority, Size, and Status are identified.

## 6. Draft & Approval Process
1. **Draft**: Present the draft (Title, Body, Labels, Project) to the USER.
2. **Approval**: Wait for explicit user approval before running the creation command.
   - *Exception*: If the user gave explicit "proceed" permission in the initial request, you may create it immediately.
3. **Create**: Execute `gh issue create`.
4. **Project Mapping**: Ensure the issue is added to the project board immediately after creation.
## 7. Documentation Reference (REST API)
For detailed specifications of the GitHub REST API (Version `2026-03-10`), refer to the following:

- **Issues**: [Issues Main](https://docs.github.com/en/rest/issues/issues?apiVersion=2026-03-10) | [Sub-issues](https://docs.github.com/en/rest/issues/sub-issues?apiVersion=2026-03-10) | [Dependencies](https://docs.github.com/en/rest/issues/issue-dependencies?apiVersion=2026-03-10)
- **Metadata**: [Labels](https://docs.github.com/en/rest/issues/labels?apiVersion=2026-03-10) | [Milestones](https://docs.github.com/en/rest/issues/milestones?apiVersion=2026-03-10) | [Assignees](https://docs.github.com/en/rest/issues/assignees?apiVersion=2026-03-10)
- **Interaction**: [Comments](https://docs.github.com/en/rest/issues/comments?apiVersion=2026-03-10) | [Events](https://docs.github.com/en/rest/issues/events?apiVersion=2026-03-10) | [Timeline](https://docs.github.com/en/rest/issues/timeline?apiVersion=2026-03-10)
- **Projects**: [Project V2 Drafts](https://docs.github.com/en/rest/projects/drafts?apiVersion=2026-03-10) | [Issue Field Values](https://docs.github.com/en/rest/issues/issue-field-values?apiVersion=2026-03-10)
- **Manual**: [gh CLI Manual](https://cli.github.com/manual/)
