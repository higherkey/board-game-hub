---
description: Best practices for running git commands
---

# Git Command Best Practices

Follow these rules every time you run a git command:

## 1. Do NOT use `&&` to chain commands
PowerShell does not support `&&` the same way bash does. Always use `;` to chain commands instead.

**Bad:**
```powershell
git add . && git commit -m "message" && git push
```

**Good:**
```powershell
git add .; git commit -m "message"; git push
```

## 2. Prefer `git commit -am` over separate `git add` + `git commit`
When staging and committing tracked files, combine the two steps into one using the `-am` flag.

**Bad:**
```powershell
git add .; git commit -m "message"
```

**Good:**
```powershell
git commit -am "message"
```

> **Note:** `git commit -am` only stages **modified tracked files**. If there are **new untracked files** that need to be added, you must still run `git add <file>` separately before committing.
