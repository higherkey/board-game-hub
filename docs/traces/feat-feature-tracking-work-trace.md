# feat-feature-tracking-work-trace

## 1) Planned work
- **TODO List**:
    - [x] Create `/docs/traces/` directory and `.gitkeep`
    - [x] Create `.github/workflows/cleanup-traces.yml`
    - [x] Create `.agent/workflows/feature-tracking.md`
    - [x] Register mandate in `AGENTS.md` and `GEMINI.md`
    - [x] Update `AGENTS.md`, `GEMINI.md`, and `git-commands.md` to explicitly mandate imperative tense for entire commit messages.
    - [ ] Final verification and walkthrough
- **File List**:
    - **Workflows**: `.agent/workflows/feature-tracking.md` (New instructions for agents).
    - **CI/CD**: `.github/workflows/cleanup-traces.yml` (Automated cleanup).
    - **Docs**: `AGENTS.md`, `GEMINI.md` (Registration of the mandate).
    - **Structure**: `/docs/traces/.gitkeep` (Ensure tracking of the traces folder).
- **Rationale**:
    - `.agent/workflows/feature-tracking.md`: To provide a clear, standardized process for agents to follow.
    - `.github/workflows/cleanup-traces.yml`: To keep the `main` branch clean of temporary development documents.
    - `AGENTS.md` / `GEMINI.md`: To ensure the workflow is recognized as a mandatory requirement for all agents.

## 2) In progress work
- **Active Files**:
    - None (Finalizing the initialization of the system).

## 3) Completed work
- **Summary**:
    - Created the core infrastructure for the feature tracking system.
    - Registered the mandate in project-wide documentation and refined rules for prefixed branches.
    - Updated repository standards to explicitly require imperative tense for the entire commit message (header and body).
- **Revised Rationale**:
    - The system was built to provide better visibility into agent progress and prevent forgotten tasks.
    - The "prefixed branch" rule allows for flexibility while enforcing documentation on structural changes.

## 4) Issues and Out of Scope
- **4a) Potential Issues**:
    - None currently identified.
- **4b) Opportunities**:
    - Integrating this trace document directly into a "PR Summary" generator in the future.
