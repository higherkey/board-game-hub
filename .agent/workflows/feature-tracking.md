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

When preparing to merge with `dev` or creating a Pull Request, follow these four steps exactly:

1.  **Parity Audit**: Review the code and the document to ensure they match exactly.
2.  **Confirm Parity with USER**: Present the document to the USER. If there is a mismatch, inform the USER and suggest steps to align them. Repeat until the USER agrees that parity is reached.
3.  **Issue Triage**:
    - Remaining items in **4a** should be suggested as **sub-issues** (or parent issues if significant).
    - Items in **4b** should be suggested as **new issues** or sub-issues.
    - Ask the USER for confirmation before creating any issues.
4.  **Git Commit**: Once the USER approves, use the **Completed Work** section as the basis for the final conventional git commit message.

## 4. Cleanup

Trace documents are automatically removed from the `main` branch by a GitHub Action on push/merge to ensure production history remains clean. You do not need to manually delete the file unless explicitly asked.

---
> [!IMPORTANT]
> If you are unsure what to write at any point, PAUSE and ask the USER for review with a specific question.
