---
description: Standards and procedures for writing, executing, and verifying tests
---

# Testing Workflow

This workflow provides a standardized approach to testing within the Board Game Hub monorepo. Agents and developers MUST follow these guidelines to ensure architectural stability and mission-critical reliability.

---

## 1. Unit Testing Guidelines

### Backend (.NET)
- **Framework**: xUnit.
- **Location**: `backend/BoardGameHub.Tests/`.
- **Standards**:
  - Use `Mock<T>` (Moq) for service dependencies.
  - Prioritize testing edge cases, boundary conditions, and complex state transitions.
  - **Null Safety**: Always use robust null assertions (e.g., `Assert.NotNull`, `should not be null`) to avoid brittle tests in the face of model changes.

### Frontend (Angular)
- **Framework**: Karma & Jasmine.
- **Location**: Adjacent to the source file (`*.spec.ts`).
- **Standards**:
  - Use Standalone component testing patterns.
  - Mock external services (e.g., `SignalRService`, `AuthService`) to isolate component logic.
  - Use `fakeAsync` and `tick()` for testing timers or asynchronous code (e.g., `UndoToastComponent`).
  - **Subscription Tracking**: Logic that manages RxJS subscriptions (like the Orchestrator service) MUST be tested for correct emission and cleanup.

---

## 2. Test Execution & Verification

### Execution Commands
Run these commands from the repository root:

| Scope | Command |
|---|---|
| **Backend (All)** | `dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj` |
| **Backend (Filter)** | `dotnet test backend/BoardGameHub.Tests/BoardGameHub.Tests.csproj --filter "FullyQualifiedName~[Class/Method]"` |
| **Frontend (All)** | `npm --prefix frontend test -- --watch=false --browsers=ChromeHeadless` |
| **Frontend (File)** | `npm --prefix frontend test -- --include src/app/path/to/file.spec.ts` |

### Success Criteria
- **Pass Rate**: 100% pass rate is mandatory. Any failing test MUST be addressed before commit.
- **Syntactic Correctness**: Tests must be free of TypeScript/Linter errors.

---

## 3. Coverage Requirements & SonarCloud Analysis

For every new feature or significant refactor, coverage MUST be evaluated. We enforce a Unified Monorepo SonarCloud architecture to ensure single-pane-of-glass quality gates.

### 3a. SonarCloud Architecture
We use the **SonarScanner for .NET** (`dotnet-sonarscanner`) via the `.github/workflows/sonar.yml` pipeline instead of the generic SonarCloud Action. This "scanner sandwich" architecture is mandatory for accurate C# code analysis within a monorepo:
1. `dotnet sonarscanner begin`: Initializes analysis, setting paths to both backend (OpenCover) and frontend (LCOV) coverages.
2. `npm run test` & `dotnet build` & `dotnet test`: Execution and compilation phases.
3. `dotnet sonarscanner end`: Wraps the compiler output and ships the unified report.

> [!WARNING]
> **Automatic Analysis MUST remain OFF** in the SonarCloud UI (Administration -> Analysis Method). If Automatic Analysis is enabled, it will override our CI pipeline, run a shallow generic scan, and erroneously report 0% coverage across the repository.

### 3b. Local Coverage Evaluation
- **Adequacy**: Ensure all newly introduced critical logic paths are exercised by tests.
- **Regression**: Verify that existing functionality remains covered and unbroken.
- **Tools**: Use `sonar-scanner` locally or IDE-integrated coverage tools to identify gaps if requested by the USER.

---

## 4. End-to-End & Integration (Playwright)

> [!NOTE]
> Playwright is not currently in active use for regular PR verification but is planned for adoption in the near future. 

### Future Integration
- **E2E Tests**: Will reside in `frontend/tests/`.
- **Execution**: `npm --prefix frontend run test:babble` (example specialized suite).
- **Mandate**: Once formalized, Playwright suites will be required for validation of cross-component interactions and physical device metaphors.

---

## 5. Review Integration

All tests executed under this workflow serve as the foundation for the `/peer-review` audit. Build and test verification in the peer-review process explicitly confirms findings from this workflow.
