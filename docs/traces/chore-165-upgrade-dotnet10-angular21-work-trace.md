# Work Trace: chore-165-upgrade-dotnet10-angular21

## 1. Overview
Upgrade Board Game Hub backend to .NET 10 LTS and synchronize all frontend Angular packages to 21.2.22.

## 2. Discoveries & Deviations
- `.NET 10` native OpenAPI (`Microsoft.AspNetCore.OpenApi`) replaces legacy Swashbuckle, deprecating `AddEndpointsApiExplorer()` / `AddSwaggerGen()` in favor of `builder.Services.AddOpenApi()` and `app.MapOpenApi()`.
- `WebApplicationFactory` on .NET 10 requires removing all registered `DbContext` and EF provider service descriptors before injecting `UseInMemoryDatabase` in `TestBase.cs` to prevent dual-provider registration errors.
- Angular packages must be strictly synchronized (`^21.2.22`) to avoid `ERESOLVE` peer dependency conflicts with `@angular-devkit/build-angular`.

## 3. Verified Gates
- Backend Build: Succeeded on `net10.0` (0 warnings, 0 errors).
- Backend Tests: 239 passed, 0 failed.
- Frontend Build & Tests: 325 passed, 0 failed in ChromeHeadless.
- SonarCloud Quality Gate: Passed.
- CodeQL Analysis: Passed.

## 4. Associated Issue
Closes #165.
