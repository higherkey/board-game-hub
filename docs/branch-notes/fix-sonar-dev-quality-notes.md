# Branch Notes: fix/sonar-dev-quality

## 1. Discoveries & Deviations
- Post-merge unified .NET analysis clears the 27 frontend bugs but exposes two redundant null fallbacks, security rating B and duplication 3.2% (limit 3%).
- Remove only fallbacks made unreachable by preceding validation/dereference; preserve validation and log sanitization. Expand authenticated diagnostics for security and duplicated files.
- Diagnostics identify seven log-sanitizing regex calls without timeouts, Render's internal HTTP URL, and 651 duplicated lines in the EF-generated idempotent SQL export. Add bounded non-backtracking regex execution, bind the same IPv4 listener via Kestrel, and exclude only that generated export from CPD (security analysis remains enabled).

## 2. Blockers & Risks (4a)
- Final CI and post-merge branch gate must verify remaining findings are cleared; do not change public TLS termination.

## 3. Quick Wins (4b)
- Four diagnostic tests and three real local/Render/container API-binding tests pass. Final API/tests projects build with no errors; add a regression covering all 33 ASCII log control characters. Independent review reports no actionable defects. Local backend testhost aborts with Windows Access Denied; Linux CI must execute the full suite.

## 4. Deferred Items (4c)
- None.
