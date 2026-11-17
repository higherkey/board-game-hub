# Frontend Design, Layout & CSS Hygiene Overhaul Handover (Temporary)

> **Document Status:** Temporary Handover Document  
> **Notice:** This document serves as the implementation handover and technical checklist for the frontend overhaul. Any permanent standards have been codified into `frontend/README.md` and `docs/game-archetypes-and-spatial-hierarchy.md`. This file will be removed prior to merging the PR into `dev`.

---

## 1. Executive Summary & Design System Alignment

The upcoming frontend overhaul will align the application with the **Spatial Architecture & Zones of Play** ([`docs/zones-of-play-design-system.md`](file:///z:/Programming/board-game-hub/docs/zones-of-play-design-system.md)), migrating away from legacy Bootstrap overrides and arbitrary pixel values toward a token-driven, component-scoped CSS architecture.

### Target Quality Gates
- **Zero `!important` declarations:** Eliminate all 30 existing `!important` declarations by establishing proper CSS cascade and specificity.
- **Zero inline `style="..."` attributes:** Eliminate all 78 inline style declarations in favor of scoped classes and CSS variables (`var(--...)`).
- **Touch Targets $\ge 44 \times 44\text{px}$:** Expand all interactive elements on touch viewports (`@media (pointer: coarse)`).
- **Layout Stability (CLS = 0):** Reserve layout dimensions for all 12 identified image, canvas, and video containers.
- **Accessible Focus Rings:** Replace `outline: none` across 13 SCSS files with high-contrast `:focus-visible` rings.
- **Reduced Motion Support:** Wrap GSAP transforms and CSS animations in `@media (prefers-reduced-motion: reduce)`.

---

## 2. CSS Hygiene: `!important` Elimination Catalog (30 Total)

The audit identified 30 instances of `!important` used primarily to override Bootstrap default styles or force layout constraints.

| File Path | Line Range | Count | Selector / Property | Migration Strategy |
|---|---|---|---|---|
| [`frontend/src/app/features/game-room/components/room-entry/room-entry.component.scss`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/room-entry/room-entry.component.scss) | L8-L36 | **17** | `.room-entry-card`, `.form-control` (background, color, border, padding, box-shadow) | Replace with scoped `:host .room-entry-card .form-control` selectors; override Bootstrap via CSS custom properties on `:host`. |
| [`frontend/src/app/features/games/babble/babble-game/babble.component.scss`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/babble/babble-game/babble.component.scss) | L40-L42, L127 | **4** | `width: 100% !important;`, `max-width`, `min-width`, `color: #fff !important;` | Convert Babble game wrapper into a flex/grid layout matching Archetype C (Shared Board) in Zones of Play. |
| [`frontend/src/styles.scss`](file:///z:/Programming/board-game-hub/frontend/src/styles.scss) | L352-L354 | **3** | `.btn-primary` (background-color, color, border-color) | Define `--bgh-btn-primary-bg` custom properties on `:root` and style the base `.btn` class cleanly. |
| [`frontend/src/styles.scss`](file:///z:/Programming/board-game-hub/frontend/src/styles.scss) | L380-L383 | **4** | `@media (prefers-reduced-motion: reduce)` reset | Standard reset does not require `!important` when placed at root cascade level. |
| [`frontend/src/app/features/games/clover-minded/components/keyword-card-3d/keyword-card-3d.component.scss`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/clover-minded/components/keyword-card-3d/keyword-card-3d.component.scss) | L86 | **1** | `transform: none !important;` | Use state modifier class `.is-flat` or `.no-transform` with normal specificity. |
| [`frontend/src/app/features/pages/games-page/games.component.scss`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/games-page/games.component.scss) | L114 | **1** | `padding: 1.25rem !important;` | Use scoped card container class with natural cascade. |

---

## 3. CSS Hygiene: Inline `style="..."` Elimination Catalog (78 Total)

### 3.1 Component Templates (75 Instances)

| Component Area | Files | Count | Common Patterns | Target Token / Scoped Class |
|---|---|---|---|---|
| **User Profile & Navigation** | [`user-profile-dropdown.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html) (7), [`navbar.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/core/components/navbar/navbar.component.html) (4) | **11** | `style="width: 32px; height: 32px;"`, `style="font-size: 0.85rem;"` | `.avatar-sm`, `.avatar-md`, `.nav-badge` tokenized classes |
| **Profile Page Color Swatches** | [`profile-page.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/profile-page/profile-page.component.html) (L91-L97) | **7** | `[style.background-color]="color"` | Use dynamic CSS custom property `[style.--swatch-color]="color"` and style `.color-swatch { background-color: var(--swatch-color); }` in SCSS. |
| **Room Entry & Lobby** | [`room-entry.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/room-entry/room-entry.component.html) (4), [`lobby.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/lobby/lobby.component.html) (1) | **5** | Dynamic widths, inline font sizes | Scoped `.room-entry-container` and `.lobby-status-pill` classes. |
| **Scatterbrain Game** | [`scatterbrain.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/scatterbrain/scatterbrain-game/scatterbrain.component.html) (L37, L54, L82, L111, L137, L150, etc.) | **11** | Inline z-index, transforms, font-weights, colors | Migrate to `.scatterbrain-board` SCSS with Zones of Play Archetype B tokens. |
| **Pictophone Game** | [`pictophone-drawing.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/pictophone/pictophone-drawing/pictophone-drawing.component.html) (2), [`pictophone-input.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/pictophone/pictophone-input/pictophone-input.component.html) (3), [`pictophone-results.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/pictophone/pictophone-results/pictophone-results.component.html) (4) | **9** | Inline canvas dimensions, result preview heights | Flexbox layout with `.drawing-frame` and `.preview-canvas-wrapper`. |
| **Games Catalog & Detail** | [`games.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/games-page/games.component.html) (5), [`game-detail.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/game-detail-page/game-detail.component.html) (4) | **9** | Banner max-heights, grid column templates | Responsive CSS Grid utilities in `games.component.scss`. |
| **Shared UI Primitives** | [`social-panel.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/social-panel/social-panel.component.html) (2), [`toast.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/toast/toast.component.html) (2), [`canvas-draw.component.html`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/canvas-draw/canvas-draw.component.html) (2) | **6** | Positioning, inline borders, canvas heights | Move positioning to component host styles. |
| **Other Game Views** | `babble`, `breaking-news`, `one-and-only`, `poppycock`, `play`, `social`, `admin-dashboard` | **17** | Miscellaneous layout margins and font sizing | Standardize into design system typography classes. |

### 3.2 TypeScript Inline Styles & Dynamic DOM Injections (3 Instances)

1. [`frontend/src/app/shared/components/app-confirm/app-confirm.component.ts#L14`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/app-confirm/app-confirm.component.ts#L14):
   - **Current:** `style="transform: translate(-50%, -100%); z-index: 2000; width: 280px;"`
   - **Target:** Extract to `app-confirm.component.scss` as `.confirm-dialog-popup`.
2. [`frontend/src/app/features/pages/game-social/game-social.component.ts#L25`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/game-social/game-social.component.ts#L25):
   - **Current:** `style="font-size: 5rem;"`
   - **Target:** Create `.hero-icon-lg { font-size: 5rem; }` in SCSS.
3. [`frontend/src/app/features/games/clover-minded/clover-minded-table/clover-minded-table.component.ts#L163-L165`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/clover-minded/clover-minded-table/clover-minded-table.component.ts#L163-L165):
   - **Current:** `flyCard.innerHTML = '<div style="width:40px;height:55px;background:white;border-radius:4px;box-shadow:0 4px 8px rgba(0,0,0,0.3)"></div>'` and `flyCard.style.position = 'absolute'; flyCard.style.zIndex = '1000'`.
   - **Target:** Move to a declarative template component or CSS class `.flying-deal-card`.

---

## 4. Mobile Ergonomics: Touch Target Violations (< 44px)

Under `/frontend-ui-engineering-slim` and WCAG 2.5.5 / 2.5.8, interactive elements on mobile devices (Zone 1 / Hand) must provide at least a $44 \times 44\text{px}$ touch target.

| Component | Selector / Element | Current Size | Required Overhaul Fix |
|---|---|---|---|
| [`profile-page.component.scss#L2-L3`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/profile-page/profile-page.component.scss#L2) | `.color-swatch` | $32 \times 32\text{px}$ | Increase swatch bounding container to $44 \times 44\text{px}$ with padding or visual swatch centered inside. |
| [`game-room.component.scss#L214-L215`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/game-room.component.scss#L214) | `.floating-btn` | $32 \times 32\text{px}$ | Resize to minimum $44 \times 44\text{px}$ floating action button. |
| [`active-games.component.scss#L16, L129`](file:///z:/Programming/board-game-hub/frontend/src/app/features/active-games/active-games.component.scss#L16) | `.active-tables-btn`, `.join-icon-btn`, `.remove-btn` | $40\text{px}$ / $24\text{px}$ | Expand hit area with padding: `min-width: 44px; min-height: 44px;`. |
| [`room-sidebar.component.scss#L16, L63`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/room-sidebar/room-sidebar.component.scss#L16) | `.collapse-btn`, `.host-toggle-btn` | $28 \times 28\text{px}$ / $24 \times 24\text{px}$ | Use `::after` touch target expander or increase button bounds to $44\text{px}$. |
| [`farkle-hand.scss#L64-L65`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/farkle/farkle-hand/farkle-hand.scss#L64) | `.sound-toggle-btn` | $32 \times 32\text{px}$ | Enlarge toggle button to $44 \times 44\text{px}$. |
| [`pictophone-drawing.component.scss#L10`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/pictophone/pictophone-drawing/pictophone-drawing.component.scss#L10) | `.brush-size-btn` | $28 \times 28\text{px}$ | Set brush selection pills to $\ge 44\text{px}$ height. |
| [`social-panel.component.scss#L78, L102`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/social-panel/social-panel.component.scss#L78) | `.tab-btn`, action buttons | $36\text{px}$ / $32\text{px}$ | Standardize tab header hit boxes to $44\text{px}$. |
| [`social-sidebar.component.scss#L23`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/social-sidebar/social-sidebar.component.scss#L23) | `.sidebar-toggle-btn` | $40 \times 40\text{px}$ | Upgrade to $44 \times 44\text{px}$. |
| [`video-chat.component.scss#L319`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/video-chat/video-chat.component.scss#L319) | `.control-btn` | $36 \times 36\text{px}$ | Enlarge media control buttons to $44 \times 44\text{px}$. |
| [`great-minds.component.scss#L19`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/great-minds/great-minds-game/great-minds.component.scss#L19), [`deepfake-game.component.scss#L74`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/deepfake-game/deepfake-game/deepfake-game.component.scss#L74) | `.rules-btn`, `.tool-btn` | $40 \times 40\text{px}$ | Upgrade to $44 \times 44\text{px}$. |

---

## 5. Layout Stability & Cumulative Layout Shift (CLS) Catalog

Under `/frontend-ui-engineering-slim`, media and canvas elements must reserve layout bounding boxes to prevent reflow during asynchronous asset loading.

| Element | File & Line | Current Hazard | Overhaul Fix |
|---|---|---|---|
| User Avatar | [`navbar.component.html#L42`](file:///z:/Programming/board-game-hub/frontend/src/app/core/components/navbar/navbar.component.html#L42) | `<img [src]="session.avatarUrl">` missing dimensions | Add `width="32" height="32" class="rounded-circle"` and `aspect-ratio: 1 / 1`. |
| Room QR Code (Host) | [`host-settings.component.html#L61`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/host-settings/host-settings.component.html#L61) | `<img [src]="getQrCodeUrl()" class="qr-img">` | Declare `width="200" height="200"` and CSS `aspect-ratio: 1 / 1`. |
| Room QR Code (Player) | [`player-settings.component.html#L10`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/player-settings/player-settings.component.html#L10) | Relies on inline style width | Add explicit HTML attributes and CSS aspect-ratio. |
| Sidebar Player Avatar | [`room-sidebar.component.html#L57`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/room-sidebar/room-sidebar.component.html#L57) | Missing width/height | Add `width="24" height="24"` and `aspect-ratio: 1 / 1`. |
| Video Feeds (3 tags) | [`video-chat.component.html#L11, L16, L31`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/video-chat/video-chat.component.html#L11) | `<video>` tags lack aspect ratio | Apply `aspect-ratio: 16 / 9; background: var(--bgh-surface-dark);` to hold video boxes before media stream attaches. |
| Deepfake Drawing Canvas | [`deepfake-game.component.html#L60`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/deepfake-game/deepfake-game/deepfake-game.component.html#L60) | `<canvas #canvas>` defaults to $300\times 150$ | Provide container query with aspect-ratio reservation. |
| Canvas Draw Primitive | [`canvas-draw.component.html#L2`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/canvas-draw/canvas-draw.component.html#L2) | Canvas lacks explicit width | Bind container bounding box and reserve aspect-ratio. |
| One-and-Only Clue Images | [`one-and-only-board.component.html#L34, L47`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/one-and-only/one-and-only-board/one-and-only-board.component.html#L34) | Clue cards reflow on load | Reserve card aspect ratio ($2.5 / 3.5$). |
| Pictophone Guess Image | [`pictophone-input.component.html#L11`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/pictophone/pictophone-input/pictophone-input.component.html#L11) | Drawing image lacks dimensions | Wrap in `.drawing-frame` with `aspect-ratio: 4 / 3`. |
| Pictophone Results Image | [`pictophone-results.component.html#L39`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/pictophone/pictophone-results/pictophone-results.component.html#L39) | Results gallery reflows on load | Set `aspect-ratio: 4 / 3` container with skeleton placeholder. |
| Sushi Train Avatar | [`sushi-train-board.component.html#L59`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/sushi-train/sushi-train-board/sushi-train-board.component.html#L59) | Player avatar missing bounds | Declare `width="40" height="40"`. |
| Dropdown Header Avatar | [`user-profile-dropdown.component.html#L7`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html#L7) | Avatar image lacks dimensions | Declare `width="32" height="32"`. |

### 5.1 Test Asset Serving (`angular.json`)
During testing, Karma reported 404 warnings for `/assets/fonts/outfit-600.woff2` and `/assets/logo.png`. In `angular.json`, the `build` target includes `src/assets`, but the `test` target only declared `public`. To eliminate 404 warnings during test runs, align `test.options.assets` with `build.options.assets`:
```json
"assets": [
  { "glob": "**/*", "input": "public" },
  { "glob": "**/*", "input": "src/assets", "output": "assets" }
]
```

---

## 6. Accessibility & Visual Feedback: Focus Indicators (13 Files)

The audit revealed that 13 SCSS files suppress native browser focus outlines using `outline: none;` without providing a high-contrast `:focus-visible` replacement ring.

### Target Focus Ring Token
```scss
// Design System Standard Focus Token:
:focus-visible {
  outline: 2px solid var(--bgh-focus-ring, #0d6efd);
  outline-offset: 2px;
}
```

### Files to Update in the Overhaul:
1. [`frontend/src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.scss#L2`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.scss#L2): `.profile-trigger`
2. [`frontend/src/app/core/layout/layout.component.scss#L73-L78`](file:///z:/Programming/board-game-hub/frontend/src/app/core/layout/layout.component.scss#L73-L78): `.logo-container`
3. [`frontend/src/app/features/active-games/active-games.component.scss#L24`](file:///z:/Programming/board-game-hub/frontend/src/app/features/active-games/active-games.component.scss#L24): `.active-tables-btn`
4. [`frontend/src/app/features/game-room/components/mobile-tab-bar/mobile-tab-bar.component.scss#L31`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/mobile-tab-bar/mobile-tab-bar.component.scss#L31): `.nav-btn`
5. [`frontend/src/app/features/game-room/components/game-combobox/game-combobox.component.scss#L51`](file:///z:/Programming/board-game-hub/frontend/src/app/features/game-room/components/game-combobox/game-combobox.component.scss#L51): `.dropdown-header`
6. [`frontend/src/app/features/games/babble/babble-game/babble.component.scss#L114`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/babble/babble-game/babble.component.scss#L114): `input`
7. [`frontend/src/app/features/games/clover-minded/clover-minded-hand/clover-minded-hand.component.scss#L139`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/clover-minded/clover-minded-hand/clover-minded-hand.component.scss#L139): `.keyword-btn`
8. [`frontend/src/app/features/games/deepfake-game/deepfake-game/deepfake-game.component.scss#L254`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/deepfake-game/deepfake-game/deepfake-game.component.scss#L254): `.color-btn`
9. [`frontend/src/app/features/pages/home-page/home-page.component.scss#L198`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/home-page/home-page.component.scss#L198): `.hero-join-input`
10. [`frontend/src/app/features/pages/login-page/login.component.scss#L111`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/login-page/login.component.scss#L111): `.form-control`
11. [`frontend/src/app/features/pages/register-page/register.component.scss#L109`](file:///z:/Programming/board-game-hub/frontend/src/app/features/pages/register-page/register.component.scss#L109): `.form-control`
12. [`frontend/src/app/shared/components/social-panel/social-panel.component.scss#L235`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/social-panel/social-panel.component.scss#L235): Chat inputs
13. [`frontend/src/app/shared/components/social-panel/social-panel.component.scss#L300`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/social-panel/social-panel.component.scss#L300): Friend request inputs

---

## 7. Motion & Animation Overhaul (`prefers-reduced-motion`)

Under `/accessibility-and-a11y-slim` and `/frontend-ui-engineering-slim`:
1. **Clover-Minded GSAP Dealing Animations:**
   - [`frontend/src/app/features/games/clover-minded/clover-minded-table/clover-minded-table.component.ts#L150-L187`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/clover-minded/clover-minded-table/clover-minded-table.component.ts#L150-L187): `runDealingAnimation()`, `animateSlotSnap()`, and `animateSlotRotate()` execute multi-second 360-degree rotations, flips, and scale transforms.
   - **Overhaul Requirement:** Inject a motion service or check `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. When active, pass `{ duration: 0 }` to skip tween rotations and instantly place cards.
2. **Clover-Minded Hand Bounces:**
   - [`frontend/src/app/features/games/clover-minded/clover-minded-hand/clover-minded-hand.component.ts#L93`](file:///z:/Programming/board-game-hub/frontend/src/app/features/games/clover-minded/clover-minded-hand/clover-minded-hand.component.ts#L93): GSAP `from` animation creates bounce effects on `.clue-zone`.
3. **Toast Slide Transitions:**
   - [`frontend/src/app/shared/components/toast/toast.component.ts#L12-L22`](file:///z:/Programming/board-game-hub/frontend/src/app/shared/components/toast/toast.component.ts#L12-L22): Ensure toast notifications respect reduced motion by substituting instant opacity transitions.

---

## 8. Wave 2 & Wave 3 Game Spatial Hierarchy & Migration Strategy

Per [`docs/game-archetypes-and-spatial-hierarchy.md`](file:///z:/Programming/board-game-hub/docs/game-archetypes-and-spatial-hierarchy.md) and [`docs/zones-of-play-design-system.md`](file:///z:/Programming/board-game-hub/docs/zones-of-play-design-system.md), all remaining games transition from monolithic desktop views to the **Four-Tier Compositional Hierarchy** (Zone 0 Stage through Zone 6 Dialogs).

### 8.1 Wave 2: Turn-Based Boards, Grids & Hidden Information (5 Games)
Targeted for immediate adoption of `<app-game-board>`, `<app-player-tableau>`, and `<app-secret-staging>`.

| Game | Primary Archetype | Table View (`isScreen = true`) | Hand View (`isScreen = false`) | Migration Requirements & Shared Primitives |
| :--- | :--- | :--- | :--- | :--- |
| **Nom de Code** | `DeductionScreen` + `SpatialGridArena` | Communal $5\times 5$ word card grid with public guess tokens | Spymaster asymmetric role overlay (red/blue key grid) with privacy shield | Integrate `<app-game-board>` (Zone 4) and `<app-secret-staging>` (Zone 2). Implement backend client filtering for strict Spymaster clue security. |
| **Warships** | `SpatialGridArena` + `PlayerTableauBay` | Dual radar grid showing public hit/miss markers | Personal ocean grid with draggable ship placement & firing console | Dual grid split via `<app-game-board>`. Touch target $\ge 44\text{px}$ on mobile radar coordinate buttons. |
| **Four in a Row** | `SpatialGridArena` | $7\times 6$ vertical drop matrix with column drop animations | Column selector dock with high-contrast disc indicator | Use `<app-action-dock>` (Zone 1) for mobile drop triggers; CSS Grid container query for board scaling. |
| **Great Minds** | `SocialPromptVote` + `PlayerTableauBay` | Question spotlight card + real-time player answer reveal podium | Text submission field + category prompt card | Adopt `<app-turn-header>` (Zone 5) and `<app-action-dock>` (Zone 1). |
| **One and Only** | `SocialPromptVote` + `DeductionScreen` | Public prompt board + eliminated duplicate card animation | Secret word submission input + lock button | Implement privacy toggle for hidden answer staging prior to reveal phase. |

### 8.2 Wave 3: Party, Simultaneous Action & Creative Canvas (8 Games)
Adopts `<app-player-hand>`, `<app-action-dock>`, `<app-pass-handoff>`, and drawing synchronization.

| Game | Primary Archetype | Table View (`isScreen = true`) | Hand View (`isScreen = false`) | Migration Requirements & Shared Primitives |
| :--- | :--- | :--- | :--- | :--- |
| **Pictophone** | `CreativeCanvas` | Communal gallery chain displaying progressive drawing/guess pairs | Full-screen responsive drawing canvas + palette dock | Extract drawing canvas to `<app-game-stage>` (Zone 0) with touch-optimized color palette ($\ge 44\text{px}$). |
| **Poppycock** | `DeductionScreen` + `SocialPromptVote` | Shared card table with public true/false statement board | Private role card (Honest vs Bluff) + lie submission field | Implement `<app-secret-staging>` (Zone 2) with tap-to-reveal shield. |
| **Scatterbrain** | `SocialPromptVote` + `PassingRelay` | Communal category list + round countdown panic ring | 12-item list input form with auto-advance and submission lock | Adopt `<app-turn-header>` (Zone 5) timer and `<app-action-dock>` (Zone 1). |
| **Wisecrack** | `SocialPromptVote` | Punchline tournament brackets + voting podium | Private punchline submission input + voting card grid | Standardize on `<app-player-hand>` (Zone 1) for vote card selection. |
| **Universal Translator** | `SocialPromptVote` | Translated phrase displays with progressive clue hints | Guess input and translation submission dock | Responsive text input container with high-contrast readable typography. |
| **Yacht** | `PlayerTableauBay` | Shared multiplayer score sheet with animated score tallying | 5-dice shaker tray + category score picker | Adopt `<app-player-tableau>` (Zone 3) with tap-to-hold dice locking mechanics. |
| **Sushi Train** | `SpatialGridArena` + `PlayerTableauBay` | Conveyor belt animation with moving plate conveyor | Plate grabber dock with Chopsticks/Wasabi action triggers | Implement SVG/CSS conveyor belt responsive to container width queries. |
| **Symbology** | `SocialPromptVote` + `SpatialGridArena` | Central symbol decoding arena with shared puzzle tiles | Asymmetric deciphering hand with tile selector tray | Split view into Table spectator board vs Hand private tile rack (`<app-player-hand>`). |

---

## 9. Tracking & Related Work Items

The following architectural and follow-up initiatives connect to this handover:

### 9.1 Authentication Bridge for GitHub CLI (`gh`) via Git Credential Manager (GCM)
GitHub CLI failed initially because the Windows Keyring credential for `gh` was stale, but Git itself was authenticated via Git Credential Manager (GCM) OAuth token (`gho_...`).

We bridged GCM directly to `gh` via PowerShell profile (`$PROFILE.CurrentUserAllHosts`):
```powershell
if (-not $env:GH_TOKEN) {
    try {
        $gcm = "protocol=https`nhost=github.com`n`n" | git credential fill 2>$null | Select-String "password="
        if ($gcm) {
            $env:GH_TOKEN = $gcm.ToString().Replace("password=", "").Trim()
        }
    } catch {}
}
```
With this bridge in place, `gh` uses the active Git OAuth token seamlessly (`gh issue list`, `gh issue create`, `gh pr create`) without requiring interactive login or personal access tokens.

### 9.2 Backlog Candidates & Ready-to-File Issues

#### Issue 1: Game Spatial Hierarchy & Zones of Play Migration (Wave 2 & 3)
```powershell
gh issue create `
  --title "[Frontend] Migrate Wave 2 & 3 games to Zones of Play spatial hierarchy" `
  --body "### Summary`nMigrate remaining board game views (Wave 2: Nom de Code, Warships, Four in a Row, Great Minds, One and Only; Wave 3: Pictophone, Poppycock, Scatterbrain, Wisecrack, Universal Translator, Yacht, Sushi Train, Symbology) from monolithic desktop layouts to the Four-Tier Compositional Hierarchy (Table vs Hand).`n`n### Reference Spec`nSee section 8 of docs/frontend-design-overhaul-handover.md and docs/game-archetypes-and-spatial-hierarchy.md." `
  --label "enhancement,frontend"
```

#### Issue 2: Reusable Spatial Zone Primitives Implementation
```powershell
gh issue create `
  --title "[Frontend Architecture] Implement shared Spatial Zone UI primitives" `
  --body "### Summary`nImplement shared UI zone components in frontend/src/app/features/games/shared/components/:`n- <app-game-stage> (Zone 0)`n- <app-player-hand> (Zone 1)`n- <app-action-dock> (Zone 1)`n- <app-secret-staging> (Zone 2)`n- <app-player-tableau> / <app-tableau-ring> (Zone 3)`n- <app-game-board> (Zone 4)`n- <app-turn-header> (Zone 5)`n- <app-pass-handoff> (Zone 6)`n`n### Reference`nSee docs/game-archetypes-and-spatial-hierarchy.md Section 4." `
  --label "architecture,frontend"
```

#### Issue 3: Backend Strict Hidden Information State Filtering
```powershell
gh issue create `
  --title "[Security/Backend] Implement per-connection SignalR RoomStatePatch filtering for hidden information games" `
  --body "### Summary`nFor games with asymmetric hidden information (Nom de Code Spymaster grid, Poppycock roles/lies, Clover-Minded keyword prep), implement per-connection SignalR StateDiffService filtering so opponent secrets are never serialized into client memory or inspectable via browser devtools.`n`n### Reference`nSee docs/frontend-design-overhaul-handover.md Section 9 and docs/platform-table-hand-plan.md." `
  --label "security,backend"
```

