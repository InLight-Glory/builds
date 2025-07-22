# 📁 Development Phase 1: Foundation Plan

## 1. Primary Goal

The primary goal of Phase 1 is to build a functional, client-side prototype that proves the core gameplay loop is fun and engaging. This phase focuses entirely on game feel, controls, and the implementation of the Echo System. Networking and advanced features are **out of scope** for this phase.

## 2. Key Deliverables

To exit this phase, the following features must be complete and stable:

- [ ] **Playable Environment:**
    - [ ] A single, large map with basic terrain and boundary walls.
    - [ ] A controllable isometric camera that follows the player.
- [ ] **Core Player Mechanics:**
    - [ ] `WASD` camera-relative movement.
    - [ ] Functional Echo System for swapping between two Vessels.
    - [ ] Visual UI for the swap cooldown.
- [ ] **Playable Characters:**
    - [ ] Two distinct, playable Vessels with unique models, movement speeds, and sizes (e.g., Orion & Kael).
- [ ] **Basic Combat (Proof of Concept):**
    - [ ] A functional Lite Attack (`LMB`).
    - [ ] At least one interactable "target dummy" object in the world to test attacks on.

## 3. Exit Criteria

Phase 1 will be considered complete when a user can:

- Launch the prototype in a web browser.
- Move both Vessels around the entire map without critical bugs.
- Successfully swap between the two Vessels.
- Attack a target dummy and see a visual hit confirmation.
- The experience is stable and maintains a consistent framerate.
