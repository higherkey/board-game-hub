# fix/236-per-client-rate-limits

## Discoveries & Deviations
- Forwarded-headers middleware applies `X-Forwarded-For` in TestServer even when `RemoteIpAddress` is null, so no test-only IP shim was needed.
- `ForwardedHeadersOptions.KnownNetworks` is obsolete in .NET 10; used `KnownIPNetworks` instead.
- Reuse the existing `TestBase` WebApplicationFactory for logging and hub HTTP integration tests.
- `SocialHub` now also drops blank messages and rejects messages over 500 characters.
- Merge current dev f289a45; retain the Kestrel listener, lockout, identity, and membership fixes.
- Bound forwarding to the right-most entry; backend README documents the trusted-ingress/direct-access assumptions and a temporary nonce-filtered post-forwarding IP diagnostic for dev verification.
- New JWT integration tests configure a synthetic strong signing key because Program captures the original key before TestBase configuration overrides apply.
- Verification: solution build succeeds with 0 warnings/errors; focused 21/21 and full backend 569/569 pass with coverage. Only generated ignored runtimeconfig uses MSTest.EnableParentProcessQuery=false for this Windows environment; no tracked runner changes.

## 4a Blockers & Risks
- Manual gate after deployment: verify resolved RemoteIpAddress from two public client IPs, spoofed-prefix handling, and independent hub/logging budgets. Current logs omit that field; follow the temporary scoped diagnostic in backend/README.md. Render documentation does not prove the one-hop assumption.
- Forwarded headers trust all immediate peers: untrusted direct/private-network access must stay blocked; configure known proxies before changing ingress.

## 4b Quick Wins
- Prove both hub HTTP policies, queue overflow to 429, per-IP independence, shared hub budgets, spoofed-prefix handling, and a separate logging budget.
- Cover null/empty/whitespace, 500/501-character chat boundaries, and no persistence or broadcast on rejection.

## 4c Deferred Items
- Throttle invocations on established WebSockets separately (HTTP policies cover negotiation/transport requests only) — security, M.
- Share limiter counters across API replicas if the service scales beyond one process — infrastructure, M.
