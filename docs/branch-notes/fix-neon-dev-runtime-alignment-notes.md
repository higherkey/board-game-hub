# Branch Notes: fix/neon-dev-runtime-alignment

## 1. Discoveries & Deviations
- Keep Neon scoped to dev; staging and production remain on Supabase.
- At diagnosis, Render dev pointed at Supabase while CI migrated Neon; live dev lacked ActiveRooms and returned outdated Yacht/FourInARow statuses.
- Confirmed deployed Cloudflare dev bundle uses apiUrl /api and requests its own static host; select existing hosted azure_dev configuration for dev and all PR previews.
- Production's live revision is 82a2b1a from September; later deploys failed. Staging has no live deploy or service environment variables.

## 2. Blockers & Risks (4a)
- Resolved live dev target: verified Neon dev migration history, ActiveRooms and game statuses; updated only Render dev DB connection and redeployed the same revision. Health, games and CORS checks pass; Yacht/FourInARow now Testing.
- Cloudflare local login expired; publishing the frontend workflow fix requires GitHub Actions credentials.
- Staging needs its own Supabase connection and JWT configuration; never copy production credentials or silently fall back to dev.
- Production recovery requires its startup fix through the release process.
- Owner approved commit, PR and merge after CI on November 13; authenticated CI/Sonar verification follows publishing.

## 3. Quick Wins (4b)
- Align the runtime connection with CI migrations, remove cross-tier fallback, deploy the exact tested commit, wait for live and validate health/games JSON; serialize deployments and bound jobs.
- Pass secrets/branch names through env; preserve unrelated Render env vars. Add deployment failure/invalid payload tests.
- Preserve local launch-profile/container port settings when Render PORT is absent; reproduce old 8080 override and add real-process local/Render/container binding checks.
- Verification: hosted dev build passes and contains Render dev API URL; backend 467 tests pass, frontend 436 pass (1 pre-existing skip), 22 deployment/binding tests pass, workflow actionlint passes. Independent review fixes addressed; live deployment script exercised successfully against Render dev.
- Update database/deployment docs and Blueprint comments to remove staging's former dev fallback.

## 4. Deferred Items (4c)
- Neon adoption outside dev requires a separate owner decision.
