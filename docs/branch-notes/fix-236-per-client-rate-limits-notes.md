# fix/236-per-client-rate-limits

## Discoveries & Deviations
- Forwarded-headers middleware applies `X-Forwarded-For` in TestServer even when `RemoteIpAddress` is null, so no test-only IP shim was needed.
- `ForwardedHeadersOptions.KnownNetworks` is obsolete in .NET 10; used `KnownIPNetworks` instead.
- Repo has one `WebApplicationFactory` (`TestBase`); the new integration test reuses it.
- `SocialHub` now also drops blank messages and rejects messages over 500 characters.
- Final review: the forwarded-headers comment now states that trusting X-Forwarded-For relies on the service being reachable only through Render's proxy.

## 4a Blockers & Risks
- Manual: after deploy to dev, confirm Render logs show real client IPs (not the proxy) for rate limiting.

## 4b Quick Wins
- None.

## 4c Deferred Items
- None.
