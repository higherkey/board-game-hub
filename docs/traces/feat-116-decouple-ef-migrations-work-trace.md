# Feature Trace: Decouple EF Migrations from Startup (#116)

Branch: `feat/116-decouple-ef-migrations`

---

## 1. Planned Work

### TODO List
- [x] Remove `db.Database.Migrate()` from `Program.cs`
- [x] Create manual migration script (`backend/migrate-db.ps1`)
- [x] Integrate EF Core Migration Bundles into CI/CD pipeline
- [x] Document migration workflow for developers and agents
- [x] Triage Babble dictionary optimization into a sub-issue

### File List
- `backend/BoardGameHub.Api/Program.cs` — Remove startup migration call
- `backend/migrate-db.ps1` — New local migration script
- `.github/workflows/deploy-backend-azure.yml` — Add Migration Bundle steps
- `.gitignore` — Exclude `efbundle` and `efbundle.exe`
- `AGENTS.md` — Add migration workflow docs + fix stale architecture note
- `GEMINI.md` — Add migration mandates to Local Environment and Deployment sections
- `README.md` — Add Deployment & Database Migrations section
- `backend/README.md` — Add full Database Migrations section with CI/CD explanation
- `dev-start-dev.ps1` — Intercept with `migrate-db.ps1`
- `dev-start-prod.ps1` — Intercept with migration bundle execution
- `.agent/workflows/feature-tracking.md` — Updated as part of workflow usage

### Rationale
Decoupling migrations from startup prevents deployment bottlenecks, enables zero-downtime rolling updates, and allows the schema to be managed safely as an explicit, out-of-band step.

---

## 2. In Progress Work

None — finalizing.

---

## 3. Completed Work

### Summary

**Architectural Decoupling**
- Removed `db.Database.Migrate()` from `Program.cs`. The API now starts instantly with no schema-blocking calls.

**Local Developer Tooling**
- Created `backend/migrate-db.ps1` wrapping `dotnet ef database update` for consistent local migration workflow.
- Updated `dev-start-dev.ps1` to intercept Dev startup with `migrate-db.ps1`.
- Updated `dev-start-prod.ps1` to mimic CI/CD by locally building and executing a full `efbundle.exe`.

**CI/CD Pipeline — Migration Bundles**
- Updated `.github/workflows/deploy-backend-azure.yml` to install `dotnet-ef`, generate a self-contained Linux `efbundle`, and execute it against the branch-appropriate Supabase database *before* the new container is deployed.
- Refactored dynamic environment variable assignment in both the `deploy-backend-azure.yml` and `deploy-frontend-azure.yml` workflows to use native GitHub step outputs (`$GITHUB_OUTPUT`), permanently resolving strict IDE linter "invalid context access" warnings.
- Added `efbundle` and `efbundle.exe` to `.gitignore`.

**Documentation**
- `GEMINI.md`: Added migration mandates to both Local Environment and Deployment sections. This is the primary enforcement surface for agents.
- `AGENTS.md`: Added "Database Migrations" command block; fixed stale "applied at startup" note in Persistence section.
- `README.md` (root): Added `🚢 Deployment & Database Migrations` section with pointer to backend README.
- `backend/README.md`: Full migration section with local/CI table, step-by-step CI/CD explanation, and "do not commit efbundle" rule.

**Issue Triage**
- Created sub-issue [#118](https://github.com/higherkey/board-game-hub/issues/118): *feat: Edge-Optimized Async Dictionary Validation for Babble*
- Formally linked #118 as a sub-issue of #14 (Complete Babble) via GraphQL.

---

## 4. Issues and Out of Scope

### 4b) Opportunities
- **Babble Edge Dictionary** (#118): The Babble word list should not live in EF Migrations. Triaged to a sub-issue of #14 — will implement a two-pass async validation system (Bloom Filter + CDN SQLite). Deferred.
