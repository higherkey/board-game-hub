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

## 3. Commit Message Standards

Strictly follow these rules for commit messages and Pull Request titles to ensure a clean and searchable history.

### Prefix (Conventional Commits)
Mandate a prefix to categorize the change. PR titles **MUST** include one of these:
- `feat`: (New feature)
- `fix`: (Bug fix)
- `docs`: (Documentation changes)
- `style`: (Formatting, missing semi-colons, etc; no logic change)
- `refactor`: (Refactoring code, e.g. renaming variables)
- `perf`: (Performance improvements)
- `test`: (Adding tests, refactoring tests)
- `build`: (Build system or external dependencies)
- `ci`: (CI configuration files and scripts)
- `chore`: (Routine tasks, maintenance)

### Mandatory Format
- **Imperative Tense**: Use `Update`, not `Updated`; `Fix`, not `Fixed` for the **entire message** (header and body).
- **Subject Length**: Keep the header under 50 characters.
- **Issue Reference (Recommended)**: Link to its GitHub Issue using `#123` or `fixes #123` if one exists.

**Bad:**
```powershell
git commit -am "added a new login screen"
git commit -am "Fixed bug in lobby"
```

**Good:**
```powershell
git commit -am "feat: Add login screen"
git commit -am "fix(lobby): Resolve race condition #456"
git commit -am "docs: Update README with deployment steps fixes #12"
```

> [!IMPORTANT]
> **Strict PR Enforcement**: Pull Request titles **MUST** follow the **Conventional Commits** format (e.g., `feat: Add room timer`) for the merge to be accepted.
