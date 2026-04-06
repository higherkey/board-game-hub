---
description: Maintain a running trace document of work on feature branches
---

# Feature Tracking Workflow

Whenever you are working on a branch created with a prefix (e.g., `feat/`, `fix/`, `chore/`, `refactor/`), you MUST create and strictly maintain a "work trace" document. This ensures visibility, track progress, and prevent forgotten tasks. Unprefixed branches are exempt from this process.

## 1. Document Setup

- **File Path**: `/docs/traces/[branch-name]-work-trace.md`
    - Example: For branch `feat/lobby-ui`, the file is `/docs/traces/feat-lobby-ui-work-trace.md`.
- **Purpose**: This is a temporary artifact that persists on feature and `dev` branches but is cleared before `main` (via GitHub Action).

## 2. Document Structure

The document must contain the following four sections, kept as concise as possible:

### 1) Planned Work
- **TODO List**: A high-level list (duplicated from your `task.md` or internal list).
- **File List**: Expected files grouped by feature.
- **Rationale**: For each file, a brief reason why it will be changed and a brief plan of the expected change.

### 2) In Progress Work
- **Active Files**: An extremely concise list of files currently being modified, grouped by feature.

### 3) Completed Work
- **Summary**: A list of files changed, grouped by feature.
- **Revised Rationale**: A summary of what was actually changed and why (updated from the "Planned Work" section).

### 4) Issues and Out of Scope
- **4a) Potential Issues**: Known unknowns, bugs discovered during development, or items requiring direction. If you aren't sure how to resolve something, pause and ask the USER. These may become future sub-issues.
- **4b) Opportunities**: Improvements or features identified that are NOT being addressed in this branch. These may become new parent or child issues.

## 3. The Finalization Process (PR/Merge)

When preparing to conclude work on a branch, follow this sequence:

1.  **Final Verification**: Perform all necessary tests (builds, unit tests, etc.). Ensure the code is 100% ready.
2.  **Functional Walkthrough**: Present a demo (recordings, screenshots, or summary) to the USER to prove the feature works as intended.
3.  **Confirm Parity with USER**: Review the trace document and the code changes with the USER. Receive **EXPLICIT approval** to proceed.
4.  **Final Development Commit**: Run `git commit` to seal the code changes and the verified trace doc.
5.  **Create Pull Request**: Run `gh pr create`.
6.  **Seal the Trace**: After the PR is created, update the **Formal Walkthrough** artifact and make one last minor `chore` commit to check off `[x] PR Created` and `[x] Formal Walkthrough Artifact`. This ensures the branch history is a complete record.

## 4. Pre-Commit / Pre-PR Checklist

Before running your final development `git commit`, you MUST verify:
- [ ] ALL code-related items in the Trace Document's TODO list are checked off (`[x]`), including **Final Verification**.
- [ ] The **Completed Work** section accurately reflects all changes.
- [ ] You have received **EXPLICIT approval** from the USER to commit and move to the PR phase.

## 5. Cleanup

Trace documents are automatically removed from the `main` branch by a GitHub Action on push/merge to ensure production history remains clean. You do not need to manually delete the file unless explicitly asked.

---
> [!IMPORTANT]
> If you are unsure what to write at any point, PAUSE and ask the USER for review with a specific question.
