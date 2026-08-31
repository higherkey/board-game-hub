# Contributing to Board Game Hub

Thank you for your interest in contributing to Board Game Hub! We are excited to build a community around this platform and appreciate your help in making it better.

## 🌟 How to Contribute

We welcome contributions of all types:
- **New Games**: Build your favorite board game on our platform.
- **Platform Features**: Improve room management, social features, or real-time performance.
- **UI/UX**: Help us polish the "Table" and "Hand" experiences.
- **Bug Fixes**: Help us keep the platform stable and performant.

## 🛠️ Developer Workflow & Release Lifecycle
 
 We follow the **GitFlow Release Train model** with **Conventional Commits**:
 
 ### 1. Feature Branches & Rapid Iteration
 Create a branch off `dev` with a descriptive prefix:
 - `feat/your-feature` (user-facing features)
 - `fix/your-bug` (bug fixes)
 - `chore/your-task` or `refactor/your-refactor` (internal plumbing, docs, and maintenance)
 
 All individual PRs merge into `dev` where they are verified and assigned incremental pre-release build numbers (e.g. `v0.24.0-dev.1`, `v0.24.0-dev.2`).
 
 ### 2. Epic & Milestone Releases
 - Features belonging to an Epic/Sprint are bundled together on `dev`.
 - The bundle moves to `staging` as a Release Candidate (`v0.24.0-rc.1`) for multi-device Table/Hand testing against mirrored staging infrastructure.
 - Upon final validation, merging `staging` $\rightarrow$ `main` cuts a single, cohesive **Milestone Release** (e.g. `v0.24.0`) and publishes user-facing notes to the `/news` page.
 
 ### 3. Emergency Hotfixes
 Critical production bug fixes branch directly off `main` as `hotfix/your-fix`, merge directly to `main` with a patch bump (e.g. `v0.24.1`), and are subsequently back-merged into `staging` and `dev`.
 
 ### 4. Mandatory Work Traces
 All prefixed branches **must** include a running work trace document in `docs/traces/` (e.g., `docs/traces/feat-my-feature-work-trace.md`).
 
 ### 5. Commit Standards
 We use **Conventional Commits**. Please ensure your commit messages (and PR titles) follow this format:
 - `feat: Add Boggle game plugin`
 - `fix: Resolve race condition in RoomService`
 - `chore: Update dependency versions`
 
 Use the **Imperative Tense** (e.g., "Add" instead of "Added", "Fix" instead of "Fixed") for the entire message.

## ⚖️ License and CLA

Please note that this project is **Source-Available and Proprietary**. By submitting a Pull Request, you agree to grant the project owner a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare derivative works of, publicly display, publicly perform, sublicense, and distribute your contributions.


