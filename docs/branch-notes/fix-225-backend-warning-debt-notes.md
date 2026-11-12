# Branch Notes: fix/225-backend-warning-debt

## 1. Discoveries & Deviations
- Resolve #225: upgrade the test SignalR.Client root dependency to 10.0.13, remove obsolete Npgsql no-op certificate assignment/assertions without changing TLS policy, and await asynchronous test operations.
- Primary sources: [Microsoft advisory](https://github.com/dotnet/aspnetcore/security/advisories/GHSA-334f-vvp4-7g6p) marks 10.0.0–10.0.12 affected and 10.0.13 patched; [NuGet](https://www.nuget.org/packages/Microsoft.AspNetCore.SignalR.Client/10.0.13) confirms Client/Core dependencies; [Npgsql](https://www.npgsql.org/doc/api/Npgsql.NpgsqlConnectionStringBuilder.html#Npgsql_NpgsqlConnectionStringBuilder_TrustServerCertificate) documents TrustServerCertificate as an obsolete no-op.
- Runtime verification: targeted tests RED (eight expected obsolete-option assertions), then GREEN (15/15); initial full backend suite 377/377 passed. Rebase onto dev 328aeba (includes merged #113), then repeat clean solution build with --no-restore -m:1 -warnaserror: zero warnings/errors; full suite 381/381 passed, zero failed/skipped. No manual steps required.
- Resolved SignalR Client/Core/Common/Protocols.Json graph is 10.0.13; dotnet list package --vulnerable --include-transitive reports no vulnerable packages. Verification runtime is ASP.NET Core 10.0.15.
- Initial overlap audit: render-port branch has no changes in target files; other active work owns unrelated undo/UI/game behavior.
- Independent adversarial audit passes with no actionable defects.

## 2. Blockers & Risks (4a)
- Resolved: default SSL Require and all six explicit SSL modes remain unchanged, including VerifyCA/VerifyFull; no warning suppressions.

## 3. Quick Wins (4b)
- Combined validation exposed a pre-existing random Farkle hot-dice test failure (valid bust resets score to zero). Add an internal Random constructor seam while the public constructor retains Random.Shared; exercise deterministic scoring and bust rerolls instead of assuming all random rolls score. Supplemental delta review checks unchanged public DI behavior and no production roll algorithm change. Supplemental independent adversarial review passes; own full backend suite 382/382 passes. Re-run the full combined suite before merge.
- Include six explicit SSL-mode regression cases and verify normalized URI strings omit the obsolete certificate option.

## 4. Deferred Items (4c)
- None in scope. Existing test-runner informational VSTEST_ARTIFACTS_DIRECTORY fallback message remains; it is not a compiler/package warning.
