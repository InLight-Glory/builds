# newSpec.md

## Project Design Spec (Systems-First Framework)

### 1) Vision
Build a game that feels larger than its team size by using reusable, data-driven systems instead of hand-authoring every moment.

### 2) Core Experience
- `Fantasy`: Reclaim and heal a damaged world while surviving escalating threats.
- `Player Promise`: Every build choice changes both survival and world recovery.
- `Tone`: Ruin -> restoration progression, visible and persistent.

### 3) Design Pillars
- `Systems Over Scripts`: Build rules that generate outcomes instead of one-off scripted events.
- `Reactive World`: Art and environment states respond to gameplay actions in real time.
- `Emergent Tension`: Resource systems should push against each other (no single best path).
- `Scalable Performance`: Architecture supports high activity without frame collapse.

### 4) Gameplay Framework
- `Loop A (Survival)`: Gather -> Build defenses -> Repel threats -> Expand safe zone.
- `Loop B (Restoration)`: Invest in terraforming/recovery -> Unlock cleaner biome states -> Gain new capabilities.
- `Loop C (Economy Tension)`: Water/energy/materials feed both survival and restoration; choosing one delays another.

### 5) World State Model
Use a staged environment-state model driven by metrics (not manual scene swaps).
- `State 0`: Dead/poisoned
- `State 1`: Stabilized
- `State 2`: Regrowth
- `State 3`: Clean/renewed

Each zone tracks:
- contamination
- hydration
- biomass
- infrastructure score

State transitions occur when thresholds are crossed.

### 6) Content Production Framework
- `Procedural Materials`: Author parameterized material graphs once; generate many variants.
- `Smart Texturing`: Use geometry-aware rules (edge wear, dirt accumulation, color variance) instead of per-asset painting.
- `Modular Asset Rules`: Build asset recipes (e.g., foliage scatter, decal placement), not unique one-off assets.

### 7) Combat/Simulation Framework
- Enemies, projectiles, and effects are simulation entities managed by shared systems.
- Avoid per-entity heavy logic where possible; prefer batched updates by concern:
  - movement system
  - targeting system
  - damage system
  - spawn/director system

### 8) Technical Architecture Practices
- `Object Pooling`: Reuse bullets/enemies/effects; avoid frequent instantiate/destroy cycles.
- `Data-Oriented Updates`: Organize logic by system and data flow for multicore execution.
- `Budgeting`: Define explicit frame budgets for AI, VFX, spawning, and pathing.
- `Stress Harness`: Always validate at target peak counts (enemy density + projectile density + effects).

### 9) Development Practices
- Build the minimum vertical slice with all key systems connected early.
- Prefer tools and pipelines that multiply output (procedural, template-driven, reusable).
- Add one system at a time, then re-profile.
- Treat performance as design constraint from day one, not end-phase cleanup.

### 10) Milestone Acceptance Criteria
- `M1`: One zone that visibly transitions through at least 2 environment states from player actions.
- `M2`: Survival + restoration loops both playable and mutually constraining.
- `M3`: Sustained combat stress test at target activity without major frame spikes.
- `M4`: Reusable content pipeline produces multiple biome/building variants from shared rules.

### 11) Non-Goals (For Scope Control)
- No large set of bespoke scripted encounters in early production.
- No hand-texturing every asset.
- No optimization strategy based on late-stage emergency rewrites.

### 12) Definition of Success
A player can feel: "My decisions changed the world," while the game remains performant under high systemic activity.
