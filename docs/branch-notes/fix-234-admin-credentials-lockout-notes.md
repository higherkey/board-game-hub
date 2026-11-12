# Branch Notes: fix/234-admin-credentials-lockout

## Discoveries & Deviations
- Admin seed now comes only from environment configuration; `Admin` block removed from `appsettings.json`. `DbInitializer` already skips the user when config is absent.
- Login uses `lockoutOnFailure: true`; failed and locked-out attempts return the same `BadRequest("Invalid login attempt")`.
- Lockout options set explicitly in `Program.cs` (5 attempts, 15 minutes, new users included).
- No integration tests relied on the seeded admin config; no test host config changes were needed.
- Final review: `AdminController.SendMessage` no longer falls back to a hardcoded admin email; unset `Admin:Email` returns `BadRequest`.

## 4a Blockers & Risks
- Manual step: verify `Admin__Email`/`Admin__Password` are set in the Render dashboard for prod, staging and dev; rotate the admin password if it was ever unset.

## 4b Quick Wins
- None.

## 4c Deferred Items
- None.
