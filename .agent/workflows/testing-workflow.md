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

## 3. Coverage Requirements

For every new feature or significant refactor, coverage MUST be evaluated:
- **Adequacy**: Ensure all newly introduced critical logic paths are exercised by tests.
- **Regression**: Verify that existing functionality remains covered and unbroken.
- **Tools**: Use `sonar-scanner` or IDE-integrated coverage tools to identify gaps if requested by the USER.

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
