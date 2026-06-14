# Iceberg - Vessels of Sanctuary (VoS)

---

## L1 - Pages (Project Map)

### Project Summary

**Vessels of Sanctuary (VoS)** is a new-type Action MOBA built with Three.js (WebGL). Unlike traditional click-to-move MOBAs, VoS uses fast WASD movement for action-game pacing. Set in "Gray-Earth," a sci-fi world shattered by "The Fracture," players select two "Vessels" (legendary characters) and swap between them mid-combat. The game features a classic 3-lane MOBA map with bases, jungle camps, and minion waves.

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Vanilla JS + Three.js (r128) via CDN |
| Rendering | WebGL (THREE.WebGLRenderer) on HTML5 Canvas |
| Camera | Orthographic isometric (45-degree offset) |
| Data | JSON flat-file (`characterData.json`) |
| Backend | None (client-only prototype) |
| Build | No build step — ES6 modules loaded natively |

### Project Root Directory Tree

```
VoS/
├── index.html                  <- Main HTML entry point + all embedded CSS
├── main.js                     <- Game orchestrator, map layout, game loop
├── characterData.json          <- Character configuration data (7 vessels)
├── STANDARDS.md                <- Development standards reference
├── readme.md                   <- Project readme
├── vessels/                    <- Playable character classes
│   └── Vessel.js               <- Base vessel class (model, stats, movement)
├── abilities/                  <- Ability system modules
│   ├── Ability.js              <- Abstract base ability (cooldown, mana)
│   ├── BasicAttack.js          <- Standard ranged projectile attack
│   ├── ChargeAttack.js         <- Powerful charged projectile
│   ├── MeleeAttack.js          <- Close-range slash attack
│   ├── PsychicAttack.js        <- Medium-range magical projectile
│   └── Projectile.js           <- Projectile physics & collision detection
├── npcs/                       <- Non-player character classes
│   ├── Minion.js               <- Lane minion (waypoint AI, auto-combat)
│   ├── JungleMob.js            <- Neutral jungle creature (camps, respawn)
│   └── TargetDummy.js          <- Practice target (legacy)
├── assets/                     <- Art assets
│   └── concepts/               <- Banner concepts, character bios
├── blueprint/                  <- Project planning & design docs
└── archive/                    <- Versioned markdown archives
```

### Top-Level Page Table

| Page | File Path | Purpose |
| :--- | :--- | :--- |
| Character Selection | `index.html` (embedded) | Grid-based character picker — select 2 vessels to begin |
| Game Canvas | `index.html` > `#game-canvas` | Main WebGL gameplay surface (MOBA map) |
| Pause Menu | `index.html` > `#pause-menu` | Overlay shown on ESC with resume button |

---

## L2 - Sections & Sub-Pages

### Character Selection Screen (`#character-selection-screen`)

| Component | Element | Purpose |
| :--- | :--- | :--- |
| Selection Title | `#selection-title` | Header: "Select Your Squad (Pick 2)" |
| Character Grid | `#character-grid` | 4-column grid of character cards |
| Start Button | `#start-game-btn` | Activates when 2 selected, starts game |

### Game HUD (In-Game Overlays)

| Component | Element | Purpose |
| :--- | :--- | :--- |
| Cooldown Indicator | `#cooldown-container` | Circular wipe showing vessel swap cooldown |
| Stats Panel | `#stats-container` | Bottom-left: Level, HP, Mana, AD, Armor |
| Pause Overlay | `#pause-menu` | Full-screen overlay with resume button |

### MOBA Map Components

| Component | Module | Purpose |
| :--- | :--- | :--- |
| Blue Base | `main.js` > `createBase()` | Player team nexus, spawn pad, defensive walls |
| Red Base | `main.js` > `createBase()` | Enemy team nexus, spawn pad, defensive walls |
| Lane Paths | `main.js` > `createLaneSegment()` | 3 dirt-colored lane strips (top, mid, bot) |
| Boundary Walls | `main.js` > `createWall()` | 4 perimeter walls preventing map exit |
| Jungle Zones | `main.js` (tree/rock placement) | Forested areas between lanes with mob camps |
| Minion Waves | `main.js` > `spawnMinionWave()` | Timer-based spawner for lane minions |

### Component Reuse Map

| Component | Used By |
| :--- | :--- |
| `Vessel.js` | `main.js` (2 per game session) |
| `Ability.js` | `BasicAttack`, `ChargeAttack`, `MeleeAttack`, `PsychicAttack` |
| `Projectile.js` | `BasicAttack`, `ChargeAttack`, `PsychicAttack`, `MeleeAttack` |
| `Minion.js` | `main.js` (12+ per wave: 4 per lane x 3 lanes x 2 teams) |
| `JungleMob.js` | `main.js` (12 jungle creatures across 6 camps) |

### Navigation Flow

```
Character Selection → [Select 2 vessels] → Start Game → Game Canvas (at Blue Base)
Game Canvas → [ESC] → Pause Menu → [Resume / ESC] → Game Canvas
```

---

## L3 - Buttons & Functions

### In-Game Controls

| Action | Triggers | Result |
| :--- | :--- | :--- |
| WASD | Camera-relative movement | Fast movement — core MOBA differentiator |
| Mouse move | Raycaster → vessel rotation | Vessel faces cursor |
| LMB | Primary ability | Fires primary toward cursor |
| RMB | Secondary ability | Fires secondary toward cursor |
| Shift | Vessel swap (5s cooldown) | Swaps active vessel, transfers position |
| L | `levelUp()` | Level up (max 18), scale stats |
| ESC | `togglePause()` | Toggle pause overlay |

### Minion AI Actions

| State | Behavior |
| :--- | :--- |
| No enemy nearby | Follow lane waypoints toward enemy base |
| Enemy minion within 12 units | Move toward closest enemy |
| Enemy within attack range (5 units) | Auto-attack (12 dmg, 1.2s cooldown) |

### Jungle Mob Behavior

| State | Behavior |
| :--- | :--- |
| Alive | Stationary at camp position |
| Killed | Hidden, respawn timer (30s) starts |
| Respawn | Reappears at original position, full health |

---

## L4 - Data & Workflows

### Data Sources

| Source | Path | Purpose |
| :--- | :--- | :--- |
| Character Config | `characterData.json` | 7 playable vessels with stats/abilities |

### Map Layout Constants

| Constant | Value | Purpose |
| :--- | :--- | :--- |
| `mapSize` | 250 | Total ground plane size |
| `halfMap` | 125 | Boundary wall positions |
| `blueBaseCenter` | (-90, 0, 90) | Blue team spawn location |
| `redBaseCenter` | (90, 0, -90) | Red team spawn location |
| `WAVE_INTERVAL` | 30 seconds | Time between minion waves |
| `MINIONS_PER_WAVE` | 4 per lane | Minions spawned per lane per wave |
| `laneWidth` | 8 units | Visual width of lane paths |

### Lane Waypoint Paths

**Top Lane:** Blue base → left edge north → top edge east → Red base
**Mid Lane:** Blue base → center (0,0) → Red base (diagonal)
**Bot Lane:** Blue base → bottom edge east → right edge north → Red base

### Jungle Camp Layout

| Camp | Position | Mobs | Type |
| :--- | :--- | :--- | :--- |
| Upper Wolves | (-55, -30) | 3x Wolf | Pack — low HP |
| Upper Golem | (-35, -50) | 1x Golem | Solo — high HP/armor |
| Upper Raptors | (-70, -55) | 2x Raptor | Pair — medium |
| Lower Wolves | (55, 30) | 3x Wolf | Pack — low HP |
| Lower Golem | (35, 50) | 1x Golem | Solo — high HP/armor |
| Lower Raptors | (70, 55) | 2x Raptor | Pair — medium |

### Minion Wave Workflow

```
Timer reaches WAVE_INTERVAL
  → spawnMinionWave() called
  → For each of 3 lanes:
    → Spawn 4 blue minions at blue base with lane waypoints
    → Spawn 4 red minions at red base with reversed waypoints
  → Minions march down lanes
  → When enemy minion detected within 12 units:
    → Move toward enemy → attack when in range
  → Dead minions cleaned up from arrays each frame
```

### Combat Workflow (Minion vs Minion)

```
Each frame:
  → Blue minions scan for closest red minion within 12 units
  → If found and within 5 units: attack (12 dmg * armor reduction)
  → If found but out of range: move toward enemy
  → If not found: continue following waypoints
  → On death: remove from scene, dispose geometry, splice from array
```

---

## L5 - The Deep

### Map Boundaries

- 4 semi-transparent box walls at map edges (250x8x2 units).
- Player `mapBounds` set to `halfMap - 2` (123 units from center).
- Minions follow waypoints within bounds; no explicit clamping needed.

### Visual Style

- Bright daytime: sky-blue background (`0x87CEEB`), warm multi-light setup.
- Dark forest green ground (`0x2E5A1E`) with subtle dark grid overlay.
- Lane paths: dirt-colored (`0x8B7D5B`) flat planes at y=0.05.
- Bases: gray platform + team-colored nexus tower + glowing crystal + walls.
- Jungle: dense tree clusters (trunk + 3-layer icosahedron canopy) + rocks.
- Fog: 80-200 unit range matching sky color.

### Minion System

- Minions use armor-based damage reduction: `effective = damage * (100 / (100 + armor))`.
- Health bars billboard toward camera offset `(+25, +27, +25)`.
- Dead minions fully dispose geometry/materials to prevent memory leaks.
- Spawn stagger: random offset on first waypoint prevents stacking.
- Speed variation: `5 + random * 1.5` creates natural spread.

### Jungle Mob Stats

| Type | HP | Armor | Size | Respawn |
| :--- | :--- | :--- | :--- | :--- |
| Wolf | 400 | 15 | 0.8x | 30s |
| Golem | 800 | 35 | 1.4x | 30s |
| Raptor | 500 | 20 | 1.0x | 30s |

### Known Limitations

- No multiplayer networking (client-only prototype).
- No turrets along lanes (bases only).
- No last-hitting / gold / item shop system.
- Minions don't target player vessels (only fight other minions).
- Jungle mobs are passive (don't attack back).
- No minimap.
- No fog of war.
- Health bars billboard using hardcoded camera offset, not actual camera position.
