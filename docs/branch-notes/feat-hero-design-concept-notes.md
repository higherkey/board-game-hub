# Branch Notes: feat/hero-design-concept

## Discoveries & Deviations
- The concept lives at its own route `/design-concept` (`/design-consent` redirects to it) so the live home page stays untouched for side-by-side comparison.
- GSAP was already a dependency but the home page used about 60 CSS keyframes. The concept uses one GSAP timeline, and `timeline.revert()` re-measures card flight paths on resize.
- Card flights use `getBoundingClientRect` deltas, so the phones are not rotated (a rotated parent would skew the translation).
- TV-screen text uses container query units (`cqi`) so it scales with the scene rather than the viewport.

## Blockers & Risks (4a)
- None. No backend, schema or auth changes.

## Quick Wins (4b)
- None outstanding.

## Deferred Items (4c)
- Add a unit spec for `DesignConceptComponent` (render, reduced-motion static mode, pause toggle).
- Swap emoji in the Host picker for real game icons.
- Promote the concept into `home-page` once approved and delete the legacy keyframe showcase.
