# Implementation Plan - Secure Admin Access (P0 Remediation) [FINAL REVIEW]

This plan addresses issue **[P0] Security: Admin Endpoints Completely Unprotected (#81)**. `AdminController.cs` and `AdminHub.cs` currently lack authorization, exposing highly sensitive operations (terminating rooms, sending global messages, updating game definitions) to any anonymous user.

Furthermore, several architectural gaps must be addressed to support role-based authorization: missing JWT role claims, missing IdentityRole registration, and an auth bypass in the frontend guard.

## User Review Required

> [!IMPORTANT]
> Please review the **Admin Seeding Strategies** section below. Based on your requirement for a single initial admin account but long-term scalability, I am recommending **Strategy #3 (Hybrid Config Bootstrapping + Future UI)**.
> Let me know if you approve this plan and strategy, and I will begin execution immediately.

---

## Admin Seeding Strategies Analysis

To secure the admin dashboard, we must implement Role-Based Access Control (RBAC). A "bootstrapping" problem arises: how does the *first* user get the "Admin" role so they can log in?

Here are the strategies, considering your goal of starting with a single account while avoiding technical debt:

### 1. Hardcoded Auto-Creation (The Current Anti-Pattern)
*Currently, `AdminController.SendMessage` tries to create a `SystemAdmin` user with a hardcoded password on the fly, but without assigning roles.*
* **Pros**: None.
* **Cons**: Massive security risk (password in source control), creates a user without the proper role, executes on every API call, tightly couples auth logic to a messaging endpoint.

### 2. First-In Promotion Endpoint
*An open endpoint (e.g., `/api/admin/init`) that grants the Admin role to the first registered user who calls it, then locks itself.*
* **Pros**: No secrets required in configuration.
* **Cons**: High security risk in production. If an attacker discovers the endpoint before the legitimate owner, the application is instantly compromised.

### 3. Config-Driven Bootstrapping + Future UI Management (Recommended)
*Read admin credentials from secure configuration (`appsettings.json` or Environment Variables). A `DbInitializer` runs on startup, ensures the "Admin" role exists, and creates/promotes the specified user to Admin if they aren't already. Later, you build a UI in the Admin Dashboard to let this first admin grant the role to other registered users.*
* **Pros**: 
    * **Secure**: Credentials live in secure environment variables, never in source control.
    * **Automated**: The initial admin is guaranteed to exist as soon as the app boots.
    * **Scalable**: Completely decouples the *creation* of the first admin from the *management* of future admins. You avoid technical debt by having standard RBAC in place from day one.
* **Cons**: Requires setting environment variables in production.

---

## Full Proposed Changes

### Backend — Critical Security & Auth Fixes

#### [MODIFY] [Program.cs](file:///c:/Programming/board%20game%20hub/backend/BoardGameHub.Api/Program.cs)
1. Add `.AddRoles<IdentityRole>()` to the Identity builder chain so `RoleManager` is available.
2. Call `await DbInitializer.SeedAsync(app.Services)` during the migration/startup phase.
3. Secure the Hub mapping:
    ```csharp
    app.MapHub<AdminHub>("/adminhub")
       .RequireRateLimiting("HubRateLimit")
       .RequireAuthorization(p => p.RequireRole("Admin"));
    ```

#### [NEW] [DbInitializer.cs](file:///c:/Programming/board%20game%20hub/backend/BoardGameHub.Api/Data/DbInitializer.cs)
Implement the recommended **Strategy #3**. It will:
1. Create the "Admin" `IdentityRole` if it doesn't exist.
2. Read `Admin:Email` and `Admin:Password` from configuration.
3. Create the user if they don't exist, and assign the "Admin" role to them.

#### [MODIFY] [AuthController.cs](file:///c:/Programming/board%20game%20hub/backend/BoardGameHub.Api/Controllers/AuthController.cs)
**Critical**: Currently, JWT tokens do not include the user's roles.
1. Update `GenerateJwtToken()` to become async.
2. Add the user's roles as `ClaimTypes.Role` claims to the token so `[Authorize(Roles = "Admin")]` evaluates correctly.

#### [MODIFY] [AdminController.cs](file:///c:/Programming/board%20game%20hub/backend/BoardGameHub.Api/Controllers/AdminController.cs)
1. Add `[Authorize(Roles = "Admin")]` to the class level.
2. Remove the insecure `SystemAdmin` auto-creation block in `SendMessage()`. Fetch the sender's details from the JWT claims instead.

#### [MODIFY] [AdminHub.cs](file:///c:/Programming/board%20game%20hub/backend/BoardGameHub.Api/Hubs/AdminHub.cs)
1. Add `[Authorize(Roles = "Admin")]` to the class level to protect all hub methods.

---

### Frontend — Guarding the Dashboard

#### [MODIFY] [auth.service.ts](file:///c:/Programming/board%20game%20hub/frontend/src/app/services/auth.service.ts)
1. Add a method to decode the JWT and extract roles (`hasRole(role: string): boolean`).
2. Add an `isAdmin()` convenience wrapper.

#### [MODIFY] [auth.guard.ts](file:///c:/Programming/board%20game%20hub/frontend/src/app/core/guards/auth.guard.ts)
**Critical**: Fix the production bypass. Currently, the guard returns `true` unconditionally if the port is not `4200`. Remove this check so authentication applies in production.

#### [NEW] [admin.guard.ts](file:///c:/Programming/board%20game%20hub/frontend/src/app/core/guards/admin.guard.ts)
Create a new guard that verifies the user is authenticated and `isAdmin()` is true. Redirects to `/login` if not authenticated, or `/` (Home) if authenticated but not an Admin.

#### [MODIFY] [app.routes.ts](file:///c:/Programming/board%20game%20hub/frontend/src/app/app.routes.ts)
Change the `canActivate` array for the `/admin` path from `[authGuard]` to `[adminGuard]`.

---

## Verification Plan

### Automated Tests
- `dotnet build` & `npm run build` to ensure no syntax errors.
- `dotnet test` to ensure existing backend specs pass.

### Manual Verification
1. Open an incognito window and attempt to visit `/admin`. Verify redirect to `/login`.
2. Register a new, standard user. Attempt to visit `/admin`. Verify redirect to `/` (Home).
3. Check application logs on startup to confirm the Admin user was seeded correctly.
4. Log in with the seeded Admin credentials. Verify the dashboard loads successfully.
5. Inspect the generated JWT in the browser's local storage (e.g., via jwt.io) to ensure the `role: "Admin"` claim is present.
