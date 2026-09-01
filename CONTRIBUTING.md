# Contributing to Board Game Hub

Thank you for your interest in contributing to Board Game Hub! We are excited to build a community around this platform and appreciate your help in making it better.

## 🌟 How to Contribute

We welcome contributions of all types:
- **New Games**: Build your favorite board game on our platform.
- **Platform Features**: Improve room management, social features, or real-time performance.
- **UI/UX**: Help us polish the "Table" and "Hand" experiences.
- **Bug Fixes**: Help us keep the platform stable and performant.

## 🛠️ Developer Workflow & Automated Conventional Semantic Versioning

We follow **Automated Conventional Semantic Versioning** combining [SemVer 2.0.0](https://semver.org/), [Conventional Commits 1.0.0](https://www.conventionalcommits.org/), and a **Three-Tier Environment-Branch Release Train** (`dev` $\rightarrow$ `staging` $\rightarrow$ `main`). Version bumping and release tagging are fully automated by [`.github/workflows/auto-version.yml`](.github/workflows/auto-version.yml).

### 1. Version Structure
Tags follow the standard SemVer format:
```text
v<MAJOR>.<MINOR>.<PATCH>[-<PRERELEASE>.<COUNTER>]
```

| Component | Description | Example |
|---|---|---|
| **MAJOR** | Breaking changes, architectural shifts, or incompatible API/DB modifications | `v1.0.0` |
| **MINOR** | Backwards-compatible features and functional enhancements | `v0.24.0` |
| **PATCH** | Backwards-compatible bug fixes and internal maintenance | `v0.24.1` |
| **PRERELEASE** | Environment identifier (`dev` for development, `rc` for staging release candidate) | `v0.24.0-dev.1` |
| **COUNTER** | Zero-indexed build/merge counter on the pre-release branch | `v0.24.0-dev.0`, `v0.24.0-dev.1` |

### 2. Feature Branches & Rapid Iteration
Create branches off `dev` with descriptive prefixes:
- `feat/your-feature` (user-facing features)
- `fix/your-bug` (bug fixes)
- `chore/your-task` or `refactor/your-refactor` (internal plumbing, tests, and maintenance)

All PRs merge into `dev`, automatically producing incremental pre-release builds (e.g. `v0.24.0-dev.0`, `v0.24.0-dev.1`). If a release cycle contains **both features and bug fixes**, the target version is classified as a **MINOR** release (`0.X.0`) because features supersede patches in SemVer.

### 3. Epic & Milestone Releases
- Features belonging to an Epic/Sprint are bundled together on `dev`.
- Merging `dev` $\rightarrow$ `staging` cuts a Release Candidate (`v0.24.0-rc.0`, `v0.24.0-rc.1`) for multi-device Table/Hand testing against mirrored staging infrastructure.
- Merging `staging` $\rightarrow$ `main` cuts a single, cohesive **Milestone Release** (e.g. `v0.24.0`), automatically publishing user-facing release notes to the `/news` page and resetting the baseline for the next dev cycle.

### 4. Emergency Hotfixes
Critical production bug fixes branch directly off `main` as `hotfix/your-fix`, merge directly to `main` with a patch bump (e.g. `v0.24.1`), and are subsequently back-merged into `staging` and `dev`.

### 5. Commit & PR Standards (Conventional Commits)
All commit messages and PR titles must follow **Conventional Commits** using **Imperative Tense** for the entire message (header and body). PR titles are strictly enforced by [`.github/workflows/lint-pr.yml`](.github/workflows/lint-pr.yml):

| Type | Impact on SemVer | Purpose |
|---|---|---|
| `feat:` / `feat!:` | **MINOR** (or **MAJOR** with `!`) | New feature or capability |
| `fix:` / `fix!:` | **PATCH** (or **MAJOR** with `!`) | Bug fix or defect remediation |
| `perf:` | **PATCH** (or inherits target) | Performance optimization |
| `chore:`, `refactor:`, `test:`, `build:`, `ci:`, `docs:`, `style:` | Inherits base version (increments pre-release counter) | Internal plumbing, tests, tooling, or formatting |
| `BREAKING CHANGE:` | **MAJOR** | Placed in commit body to trigger major bump |

### 6. Mandatory Work Traces
All prefixed branches **must** include a running work trace document in `docs/traces/` (e.g., `docs/traces/feat-my-feature-work-trace.md`).

## ⚖️ License and CLA

Please note that this project is **Source-Available and Proprietary**. By submitting a Pull Request, you agree to grant the project owner a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute your contributions.


