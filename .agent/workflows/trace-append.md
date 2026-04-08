---
description: Append a single item to the work trace document (minimal read, write-only update)
---

# /trace-append

Use this command to append a single new item to the work trace document. This is a low-cost trace operation and should be used continuously during active development.

## When to Use
- You discover a new bug or risk → append to **Section 4a**.
- You notice an out-of-scope improvement → append to **Section 4b**.
- You start working on a file → append to **Section 2 (In Progress)**.
- You finish a file or task → append to **Section 3 (Completed)**.

## Instructions

1.  Identify the target section: `2`, `3`, `4a`, or `4b`.
2.  **Read for Targeting**: Use `view_file` to read the trace document to find the correct line for insertion. 
3.  **Minimal Write**: Modify **ONLY** the targeted section using `replace_file_content` or `multi_replace_file_content`. You are strictly forbidden from rewriting, re-summarizing, or altering any other section of the document during this operation.
4.  Compose a single concise line describing the item.
5.  Use the `[raw append]` marker.

## Format

```markdown
- [raw append] Brief description of the item.
```

> [!IMPORTANT]
> This is a **minimal-reach** operation. To save tokens and rate limits, only read what you must to find the insertion point, and only write the new line. Never re-summarize the document.
