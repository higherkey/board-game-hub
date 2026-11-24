# chore/remove-supabase-ci-fixes

## Discoveries
- Production, staging and dev all run on Neon now; Supabase is unused.
- SonarCloud analyses only dev on push; staging and main pushes always failed with "not allowed to access data from non main branches".
- The dev quality gate failed on three floating SignalR promises in babble-hand.
- Dependabot security runs failed because the fixes sat under exact pins in Angular CLI/build and miniflare.
- Release-candidate tags were computed from old rc tags (v0.35.x) while dev was at v0.40.x.

## 4a Blockers
- None.

## 4b Quick Wins
- Remove the Supabase workflows, the supabase/ folder and stale docs.
- Run push analysis on dev only.
- Mark the three promises with void.
- Tag rc builds with the dev version they promote.
- Angular 22.2.5 (framework) and 22.2.6 (CLI), npm overrides for miniflare sharp/undici: npm audit reports 0.

## 4c Deferred
- Angular 22.3 (released 19 Nov, too new to adopt).
- Supabase projects and secrets are switched off outside the repo.
