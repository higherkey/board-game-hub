# Branch Notes: fix/234-admin-credentials-lockout

## Discoveries & Deviations
- Admin seed now comes only from environment configuration; `Admin` block removed from `appsettings.json`. `DbInitializer` already skips the user when config is absent.
- Login uses `lockoutOnFailure: true`; failed and locked-out attempts return the same `BadRequest("Invalid login attempt")`.
- Lockout options set explicitly in `Program.cs` (5 attempts, 15 minutes, new users included).
- Validation: focused auth/admin/seed tests pass (19/19); full backend suite passes (475/475). Local testhost requires `MSTest.EnableParentProcessQuery=false` in ignored generated runtimeconfig plus `dotnet test --no-build` because process access is restricted.
- HTTP integration coverage uses isolated InMemory Identity storage and no admin seed; verifies persisted failure counts, fifth-attempt lockout, expiry and successful reset.
- Final review: `AdminController.SendMessage` no longer falls back to a hardcoded admin email; unset `Admin:Email` returns `BadRequest`.

## 4a Blockers & Risks
- Operational gate: verify Render admin settings for prod/staging/dev, reset any stored admin password that used the committed credential through authorized Identity operations, verify the old password fails, and check/enable that account's `LockoutEnabled`. Environment changes do not rotate stored passwords; password reset does not revoke issued JWTs before expiry (plan any signing-key rotation through #218). No live credentials were accessed.

## 4b Quick Wins
- Cover absent, email-only and password-only seed configuration; preserve generic unknown/incorrect/locked-out login responses.

## 4c Deferred Items
- Add login abuse throttling independently of per-account lockout (security, S); existing global limits remain unchanged.
