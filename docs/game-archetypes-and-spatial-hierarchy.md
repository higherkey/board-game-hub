# Platform Game Archetypes & Spatial Hierarchy

> **Purpose:** Applied engineering standards and heuristic framework for building game layouts on Board Game Hub.  
> **Complements:** [`docs/platform-glossary.md`](file:///z:/Programming/board-game-hub/docs/platform-glossary.md) (Table vs. Hand roles)  
> **Theoretical Basis:** [`docs/zones-of-play-design-system.md`](file:///z:/Programming/board-game-hub/docs/zones-of-play-design-system.md) (Scott Rogers & Gil Hova's Six Zones of Play)

---

## 1. Architectural Philosophy: Heuristics Over Rigid Boxes

Board Game Hub does not treat game types as monolithic, rigid templates. A party game might feature card drafting; a dice game might have an asymmetric deduction screen; a word game might feature rapid passing mechanics.

Per our core engineering principles:
1. **Heuristics Over Rigid Silos:** Archetypes are **illustrative reference points and composable building blocks**, not restrictive boundaries. Developers have full autonomy to adapt, customize, or synthesize new archetypes whenever a game's interaction model warrants it.
2. **Composition Over Megastructures:** Rather than creating monolithic, one-off game layouts, games are assembled from a **Four-Tier Compositional Hierarchy** of standardized spatial primitives.
3. **Table vs. Hand Role Invariant:** Every spatial composition must strictly honor the device role boundary (`Player.isScreen`):
   - **The Table (`Player.isScreen === true`):** Optimized for communal viewing (Zones 4, 5, 6) on shared screens (TVs, projectors).
   - **The Hand (`Player.isScreen === false`):** Optimized for personal, tactile interaction (Zones 1, 2, 3) on mobile phones and tablets.

---

## 2. The Four-Tier Compositional Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 0: PLATFORM STAGE SHELL                                           │
│ Viewport containment (100dvh), container queries (@container),         │
│ zero window scroll, theme token injection, Table vs Hand routing.      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ wraps
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: PRIMARY SPATIAL LAYOUT ARCHETYPES                              │
│ Composable macro-layouts: Spatial Grid, Hand/Deck, Tableau Bay,        │
│ Passing Relay, Deduction Screen, Creative Canvas, Social Prompt/Vote.  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ composes
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: REUSABLE SPATIAL ZONE PRIMITIVES                               │
│ Reusable Angular UI blocks mapped to Gil Hova's Six Zones:             │
│ Hand Tray, Tableau Bay, Play Mat, Handoff Shield, Turn Bar, Rules.    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ skins & drives
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 3: GAME-SPECIFIC MECHANICS & THEMATIC SKINNING                    │
│ Scoped CSS variables (--game-primary), game assets, rules logic,       │
│ tactile micro-animations, and custom audio SFX.                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tier 1: Primary Spatial Layout Archetypes

Developers compose one or more of these macro-archetypes to construct any game's layout:

### 1. Spatial Grid Arena (`SpatialGridArena`)
* **Primary Mechanisms:** Grid Movement, Area Majority, Spatial Puzzles, Coordinate Targeting.
* **Representative Games:** Four in a Row, Warships, Symbology.
* **Spatial Mapping:**
  - **Table View (Zone 4):** Dominant central board ($>75\%$ viewport) with fixed aspect ratio and container-queried cell scaling.
  - **Hand View (Zone 1 + 4):** Synchronized grid viewport paired with direct coordinate touch targets ($\ge 44\times 44\text{px}$) or a bottom column-selector dock.

### 2. Hand & Deck Tray (`HandDeckTray`)
* **Primary Mechanisms:** Hand Management, Trick-Taking, Card Drafting, Set Collection.
* **Representative Games:** Sushi Train, One and Only.
* **Spatial Mapping:**
  - **Hand View (Zone 1/2):** Horizontally scrollable or fanned card tray docked at the bottom third of the screen. Tap to inspect (Zone 2 zoom sheet), swipe-up/tap to play (Zone 1).
  - **Table View (Zone 4):** Communal play mat displaying active tricks, discard stacks, and the public draft market.

### 3. Player Tableau Bay (`PlayerTableauBay`)
* **Primary Mechanisms:** Engine Building, Worker Placement, Dice Rolling, Resource Management.
* **Representative Games:** Farkle, Yacht, Clover Minded (player view).
* **Spatial Mapping:**
  - **Hand View (Zone 3 + 1):** Personal dashboard displaying player score, locked dice bays, and tactile action triggers (e.g. dice shaker).
  - **Table View (Zone 4 + 3):** Ring or perimeter grid of all players' public tableaus simultaneously, allowing the entire room to monitor each player's engine.

### 4. Passing & Hot Potato Relay (`PassingRelay`)
* **Primary Mechanisms:** Physical/Virtual Device Handoff, Real-Time Clue Giving, Fast Turn Rotation.
* **Representative Games:** Taboo, Catch Phrase, Babble, Hot Potato.
* **Spatial Mapping:**
  - **Hand View (Zone 1):** Giant, high-contrast prompt card, high-visibility timer ring, and massive touch targets for "GOT IT" / "PASS" ($\ge 56\text{px}$).
  - **Transition State:** Full-screen blocking modal (`PassHandoffShield`) preventing clue leakage until the device is passed to the active player.
  - **Table View (Zone 4/5):** Large turn spotlight showing active team/player, audible panic buzzer, and communal spectator display.

### 5. Hidden Information & Deduction Screen (`DeductionScreen`)
* **Primary Mechanisms:** Secret Roles, Asymmetric Clues, Spymaster Grids, Bluffing.
* **Representative Games:** Nom de Code, Clover Minded, Poppycock, Deepfake.
* **Spatial Mapping:**
  - **Hand View (Zone 2):** Private asymmetric overlay (e.g. Spymaster key or secret word), shielded with privacy toggles.
  - **Table View (Zone 4):** Completely neutral shared board displaying only publicly confirmed clues and public guesses.

### 6. Creative Canvas (`CreativeCanvas`)
* **Primary Mechanisms:** Collaborative Drawing, Freeform Sketching, Stroke Playback.
* **Representative Games:** Pictophone.
* **Spatial Mapping:**
  - **Hand View (Zone 1):** Full-bleed responsive drawing canvas with touch-optimized brush/color palette ($\ge 44\text{px}$).
  - **Table View (Zone 4):** Real-time stroke replication, animated gallery chain, and side-by-side guess comparisons.

### 7. Social Prompt & Voting (`SocialPromptVote`)
* **Primary Mechanisms:** Prompt Cards, Submission Judging, Blind Voting, Category Lists.
* **Representative Games:** Wisecrack, Great Minds, Universal Translator, Scatterbrain.
* **Spatial Mapping:**
  - **Hand View (Zone 1):** Punchline/answer submission input followed by anonymized card-voting grid.
  - **Table View (Zone 4):** Dramatic card reveal animations, vote tallying bars, and winner celebration podiums.

---

## 4. Tier 2: Reusable Spatial Zone Primitives

To eliminate boilerplate across games, the platform provides reusable standalone Angular components in `frontend/src/app/features/games/shared/components/`:

| Zone | Primitive Component | Purpose & Interaction Model |
| :--- | :--- | :--- |
| **Zone 0** | `<app-game-stage>` | Root wrapper providing `100%` height, container queries, viewport containment, and theme propagation. |
| **Zone 1** | `<app-player-hand>` | Bottom-docked card tray with horizontal scroll/fan, card selection states, and touch targets $\ge 44\text{px}$. |
| **Zone 1** | `<app-action-dock>` | Bottom action bar housing primary gameplay buttons (Roll, Submit, End Turn, Buzz). |
| **Zone 2** | `<app-secret-staging>` | Hidden info container (cards in reserve, secret clues) with tap-to-reveal privacy shields. |
| **Zone 3** | `<app-player-tableau>` | Personal dashboard displaying score, tokens, dice lock bays, and status indicators. |
| **Zone 3** | `<app-tableau-ring>` | Table-mode component displaying all players' tableaus simultaneously in a shared layout. |
| **Zone 4** | `<app-game-board>` | Base container for grids, maps, and communal play mats with aspect-ratio preservation. |
| **Zone 5** | `<app-turn-header>` | Status banner displaying round counter, active turn indicator, and animated timer ring. |
| **Zone 6** | `<app-pass-handoff>` | Full-screen blocking modal for passing games ("PASS DEVICE TO [PLAYER]"). |
| **Zone 6** | `<app-rules-drawer>` | Slide-over drawer providing quick rules and iconography reference without leaving the game. |

---

## 5. Composition Heuristics for Game Developers

When integrating or refactoring a game, developers follow these heuristic guidelines:

### Heuristic 1: Games Are Dynamic Compositions
Rarely does a game map 1:1 to a single archetype. Always identify the **primary** and **secondary** interaction loops:
* **Babble:** `PassingRelay` (Zone 1 active turn buzzer) + `SpatialGridArena` (Zone 4 communal letter grid) + `SocialPromptVote` (word scoring).
* **Clover Minded:** `DeductionScreen` (Zone 2 secret keywords) + `PlayerTableauBay` (Zone 3 personal clover) + `SpatialGridArena` (Zone 4 table board).
* **Farkle:** `PlayerTableauBay` (Zone 1 dice shaker + Zone 3 locked dice) + `TableauRing` (Zone 4/5 all-player table scoreboards).
* **Scatterbrain:** `SocialPromptVote` (Zone 1 category text inputs) + `PassingRelay` (Zone 5 round timer panic).

### Heuristic 2: The Zone 1 Rule of Thumb
Any component rendered on a Hand device that requires player input must reside in **Zone 1** (the lower two-thirds of the screen, within thumb reach) and meet the $44 \times 44\text{px}$ minimum hit target. High-frequency actions must never require reaching to the top edge of a mobile phone.

### Heuristic 3: The Zone 2 Privacy Invariant
Any information designated as private (secret words, unplayed cards, hidden roles) must exist only on Hand devices in **Zone 2**. It must **never** be transmitted to or rendered by the Table device (`Player.isScreen === true`), ensuring zero spectator leakage.

### Heuristic 4: CSS Hygiene & Independence
Games must never inject global styles or use `!important`. All styling is scoped to the component host, utilizing design system tokens (`var(--primary)`, `var(--shadow-sm)`, etc.) and optionally overriding game-level custom properties (`--game-primary`, `--game-accent`).
