# Branch Notes: feat/instant-game-catalogue

## 1. Discoveries & Deviations
- Bundle 25 public games from canonical EF model seeds with schema version, content hash and generation timestamp; each release uses its checked-out metadata and scopes browser cache to its exact API URL.
- Existing localStorage cache only helps after a successful visit; startup and page components can issue duplicate requests.
- Export directly from the EF design-time model without API/database startup; committed output keeps normal frontend builds independent of .NET and origin availability. Frontend CI verifies seed drift and exporter failures before publishing.

## 2. Blockers & Risks (4a)
- Browsing snapshots can lag live metadata until a successful refresh; room/game actions still require the live backend.
- One pre-existing frontend unit test is skipped. Authenticated CI/Sonar checks follow PR publishing.

## 3. Quick Wins (4b)
- Synchronous bundle/newer validated cache hydration; reject legacy/corrupt/wrong-tier cache and invalid refreshes. Normalize timers and sanitize dynamic settings to avoid malformed select-option crashes.
- Deduplicate concurrent refreshes, reuse successes for 60 seconds, bound requests to 15 seconds and permit retries after failure; ping health once per service lifetime.
- Verification: original browser first-visit test failed with held API; final hosted build, six browser cases (360/1280px, Home, offline first visit/reload, refresh and invalid response), 467 frontend tests (1 existing skip), 467 backend tests and seven CLI exporter checks pass. Independent audit and actionlint pass.
- Regeneration/check commands and offline browser verification run in frontend CI; backend seed/exporter edits trigger the pipeline.

## 4. Deferred Items (4c)
- Edge catalogue endpoint and cache refresh between deployments, if needed later.
- Existing server gap: enforce catalogue status and registered-service availability on room creation/start (bug, small); current statuses govern discovery rather than server authorization. No authorization behavior changed here.
