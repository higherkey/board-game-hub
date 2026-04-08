---
description: Full trace read and rewrite to produce a clean, coherent work trace (full file read)
---

# /trace-consolidate

Use this command to perform a full read and clean rewrite of the work trace document. This is the highest-cost trace operation and should be used sparingly at defined checkpoints.

## When to Use
- **Session Resume**: When re-starting a session on an existing branch (after user confirmation).
- **Finalization**: Just before the final commit of a branch.
- **Manual Request**: When the document has become cluttered with many `[raw append]` items.

## Instructions

1. Perform a FULL read of `/docs/traces/[branch-name]-work-trace.md`.
2. Reconcile all sections:
    - **Section 2 & 3**: Match `In Progress` and `Completed` items against the actual working tree and recent Git history.
    - **Section 1**: Update `Planned Work` lists if the scope has evolved.
    - **Section 4**: Organize discovered issues and opportunities into a coherent format. Remove `[raw append]` markers.
3. Rewrite the entire document cleanly.
4. If this is a **Session Resume**, verify that the `In Progress` section accurately reflects where the previous session left off.
5. If this is **Finalization**, perform the `git diff --name-only` parity check after consolidation.

> [!IMPORTANT]
> This operation consumes the most tokens. Use it only when a full, accurate, and organized state is required.
