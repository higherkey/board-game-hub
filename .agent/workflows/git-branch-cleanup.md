---
description: Procedures for cleaning up local branches that have been deleted on the remote
---

# Git Branch Cleanup Workflow

Use this workflow to synchronize your local branch list with the remote, removing any local branches that have been deleted or merged on the server.

## 1. Prune Remote Tracking Branches
First, update your local repository's knowledge of the remote state. This will remove any `origin/branch-name` references that no longer exist on GitHub.

// turbo
```powershell
git fetch -p
```

## 2. Identify "Gone" Branches
Identify local branches whose upstream tracking branches have been deleted. These are marked as `[origin/...: gone]` in the verbose branch list.

```powershell
git branch -vv
```

## 3. Delete Gone Branches
Run the following PowerShell command to automatically delete all local branches identified as "gone".

> [!WARNING]
> This uses `git branch -D` (force delete). Ensure you don't have unpushed work on these branches that you actually want to keep.

// turbo
```powershell
git branch -vv | Where-Object { $_ -match '\[origin/.*: gone\]' } | ForEach-Object { $branch = $_.Trim().Split(' ')[0]; git branch -D $branch }
```

## 4. Verification
Verify that only the active local branches remain.

```powershell
git branch
```
