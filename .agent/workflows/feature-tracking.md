---
description: Maintain a running trace document of work on feature branches
---

# Feature Tracking Workflow

Whenever you are working on a branch created with a **conventional prefix** (e.g., `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`, `test/`, `perf/`, `build/`, `ci/`, `style/`), you MUST create and strictly maintain a "work trace" document. Unprefixed branches are exempt.

---

## 1. Document Setup

- **File Path**: `/docs/traces/[branch-name]-work-trace.md`
    - Example: For branch `feat/lobby-ui`, the file is `/docs/traces/feat-lobby-ui-work-trace.md`.
- **Trigger**: Create this document **immediately** when starting work on a new prefixed branch.
- **Persistence**: Committed to the branch. Cleared from `main` automatically via GitHub Action.

---

## 2. Document Structure

Keep all sections as concise as possible without losing critical information.

### 1) Planned Work
- **TODO List**: High-level task list (mirrors your internal `task.md`).
- **File List**: Expected files to change, grouped by feature area.
- **Rationale**: Brief reason and expected change per file or group.

### 2) In Progress Work
- **Active Files**: Lightweight list. Updated via append as work begins. Consolidated at checkpoints.

### 3) Completed Work
- **Summary**: Files changed, grouped by feature. Updated via append. Consolidated at checkpoints.
- **Revised Rationale**: What was actually changed and why (resolved from Planned Work after consolidation).

### 4) Issues and Out of Scope
Any discovery that deviates from the original plan MUST be captured immediately.

- **4a) Potential Blockers**: Risks, discovered bugs, or architectural hurdles that prevent completion of the current task. 
    - **Action**: These MUST be triaged. If they warrant a dedicated effort, create a **sub-issue** and establish a formal **Blocker** relationship.
- **4b) Opportunities**: Out-of-scope improvements, refactors, or new feature ideas discovered during development.
    - **Action**: These become either **sub-issues** (with a Parent relationship) or new standalone **Issues**.

> [!IMPORTANT]
> Section 4 items MUST be appended the moment they are discovered. Use `/trace-append` to do this without a file read.

---

## 3. Trace Modes

The trace document is maintained using three distinct modes to minimize token usage:

| Mode | Command | Token Cost | When to Use |
|---|---|---|---|
| **Append** | `/trace-append` | Minimal (write-only) | Any new item for 4a, 4b, In Progress, or Completed. |
| **Update** | `/trace-update` | Low (section-level read) | Reorganize accumulated appends within one or two sections. |
| **Consolidate** | `/trace-consolidate` | Full (full file read) | Session resume, finalization, or manual request. |

All three modes can be triggered **manually by the USER at any time**.

---

## 4. Automatic Checkpoint Triggers

### Branch Start (Initialization)
- **Action**: Create the trace document. Write the full Section 1 (Planned Work) from the task plan.
- **Mode**: Full write.

### Session Resume
- **Detection**: Agent starts a session, detects it is on a prefixed branch, and finds an existing trace document.
- **Required Action**: Agent MUST pause and explicitly confirm with the USER:
  > *"I see we're resuming `[branch-name]`. Should I consolidate the trace document before we continue?"*
- **If YES**: Run `/trace-consolidate` before proceeding.

### Finalization (Pre-Commit)
- **Action**: Run `/trace-consolidate` to produce a clean, coherent trace. Then perform the parity check (see Section 5).

---

## 5. The Finalization Process (PR/Merge)

Follow this sequence exactly when concluding work on a branch:

1.  **Verification & Testing**: 
    - Execute the `/testing-workflow` to ensure all backend and frontend tests pass and coverage is adequate.
    - Ensure the code is 100% ready and meets all engineering standards.
2.  **Issue Triage (4a & 4b)**: Present all items in Section 4 to the USER. 
    - **Blocker Protocol**: If a 4a item is converted to an issue, establish a formal **Blocker** relationship using GraphQL (see Section 8).
    - **Hierarchy Protocol**: If a 4b item is converted to a sub-issue, establish a formal **Parent** relationship.
    - Items must be acknowledged (accepted, deferred, or dismissed) before proceeding.
3.  **Consolidate & Parity Check**: Run `/trace-consolidate`. Then run the following and compare to the File List in Section 1:
    ```powershell
    git diff --name-only <target-branch>
    ```
4.  **Functional Walkthrough**: Present a demo (build output, screenshots, recordings, or written summary).
5.  **Senior Peer Review**: Run the `/peer-review` workflow. This is the final quality gate.
6.  **Confirm with USER**: Receive **EXPLICIT approval** to commit.
7.  **Self-Referential Correction**: If any stage above reveals missing coverage, bugs, or architectural issues:
    - You MUST return to the active development phase (Section 2/3). 
    - Update the **Planned Work** (Section 1) and **TODO List** to reflect the new requirements.
    - Re-run the finalization sequence from step 1 once the new work is complete.
8.  **Final Commit**: Run `git commit` to seal the code and finalized trace document together.
9.  **Create Pull Request**: Run `gh pr create`. Link to the parent issue and the trace document.

---

## 6. Pre-Commit Checklist

- [ ] All code-related items in Section 1 TODO are checked off (`[x]`).
- [ ] Section 4 items have been triaged and formal relationships established via GraphQL.
- [ ] `git diff` matches the File List in Section 1.
- [ ] Functional Walkthrough provided.
- [ ] USER has given **EXPLICIT approval** to commit.
    - [ ] If rework was requested, it has been completed and re-walked through.

---

## 7. Cleanup

Trace documents are removed from `main` automatically by `.github/workflows/cleanup-traces.yml`.

---

## 8. Technical Guide: Formal Relationship Management (GraphQL)

Since the standard `gh issue` CLI does not yet formally support hierarchies or blockers, agents MUST use GraphQL to establish relationships. Establishing a relationship on one side automatically sets the inverse (e.g., setting a child's parent sets the parent's sub-issue).

### A) Retrieve Global Node IDs
```powershell
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) { id }
    }
  }' -F owner='higherkey' -F repo='board-game-hub' -F number=[ISSUE_NUMBER]
```

### B) Establish Formal Parent/Sub-issue Relationship
```powershell
gh api graphql -f query='
  mutation($parent: ID!, $subIssue: ID!) {
    addSubIssue(input: {issueId: $parent, subIssueId: $subIssue}) {
      issue { number }
      subIssue { number }
    }
  }' -f parent='[PARENT_NODE_ID]' -f subIssue='[CHILD_NODE_ID]'
```

### C) Establish Formal Blocker Relationship
Adding a "Blocked By" relationship on the current issue automatically adds "Blocking" to the target.
```powershell
gh api graphql -f query='
  mutation($current: ID!, $blocker: ID!) {
    addTrackedIssue(input: {issueId: $current, trackedIssueId: $blocker}) {
      issue { number }
      trackedIssue { number }
    }
  }' -f current='[CURRENT_ISSUE_ID]' -f blocker='[BLOCKER_ISSUE_ID]'
```