# fix/neon-staging-prod-db

## Discoveries
- #217 pointed staging and prod deploys at Supabase secrets. SUPABASE_CONNECTION_STRING_STAGING never existed, so the staging deploy failed, and prod still runs on Neon (last deploy 19 Sep).

## 4a Blockers
- None.

## 4b Quick Wins
- Read NEON_CONNECTION_STRING_STAGING and NEON_CONNECTION_STRING_PROD again.

## 4c Deferred
- Decide later whether the Supabase deploy and keep-alive workflows are still needed.
