---
description: Organize and clean up accumulated trace appends within one or two sections (section-level read)
---

# /trace-update

Use this command to reorganize accumulated `[raw append]` items within one or two sections of the work trace document. This is a **section-level** operation — read only the sections being updated, not the full file.

## When to Use
- Several `[raw append]` items have accumulated in Section 2 or 3 and need to be structured.
- Tasks have moved from In Progress (Section 2) to Completed (Section 3) and need to be formally transferred.
- User requests a quick tidy of a specific section.

## Instructions

1. Identify the target section(s): `2`, `3`, `4a`, or `4b`.
2. Read **only** the content of the specified section(s).
3. Integrate any `[raw append]` items into the structured format. Remove the `[raw append]` marker once integrated.
4. Move completed items from Section 2 to Section 3 as appropriate.
5. Do NOT read or modify other sections.

## Format After Update

**Section 2 (In Progress):**
```markdown
### 2) In Progress Work
- **Active Files**:
    - `path/to/file.ts` — [brief description of active work]
```

**Section 3 (Completed):**
```markdown
### 3) Completed Work
- **Summary**:
    - `path/to/file.ts` — [brief description of what changed]
```

> [!IMPORTANT]
> Do NOT consolidate or reformat the Planned Work (Section 1) or Issues (Section 4) during this operation. Use `/trace-consolidate` for a full cleanup.
