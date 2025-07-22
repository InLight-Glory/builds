# Vessels of Sanctuary

## 1. Project Summary

**Vessels of Sanctuary** is a team-based, 5v5 Action MOBA designed for the web. Its defining feature is the **Echo System**, which allows a player to control a pair of characters ("Vessels") and swap between them in real-time. The game combines the strategic depth of a traditional MOBA with the direct control of a third-person action game.

The narrative is set on the shattered world of Gray-Earth, where two rival factions are locked in a perpetual war, unaware they are trapped in a time loop. The full story and game design details can be found in the project's Game Design Document.

---

## 2. Current Status & To-Do List

This project is currently in the **early prototyping phase**. The core design is established, and we are building the initial client-side proof of concept.

### Completed Tasks:
- [x] **Game Design & Lore:** A comprehensive Game Design Document and a detailed Lore Bible have been created.
- [x] **Initial Scene Setup:** A basic `Three.js` scene has been created with an isometric camera, lighting, and a large, diamond-oriented map.
- [x] **Player Character:** A low-poly, controllable character model (Vessel) has been implemented.
- [x] **Core Mechanic Prototype:** The Echo System (swapping between two Vessels with `Shift`) is functional.
- [x] **Basic UI:** A visual cooldown indicator for the Echo System has been added to the UI.
- [x] **Core Movement:** Camera-relative `WASD` movement and map boundary checks are implemented.
- [x] **Basic Scenery:** The map includes a textured floor, boundary walls, randomly placed shrubs, and a Keystone model.

### Current Phase: Gameplay Prototyping
Our immediate goal is to continue building out the core gameplay mechanics to make the prototype feel more like a complete game.

### Next Steps / To-Do:

- [ ] **Implement Basic Combat:**
    - [ ] Add functionality for Lite Attack (`LMB`) and Heavy Attack (`RMB`).
    - [ ] Create a simple "target dummy" or enemy AI to test attacks on.
- [ ] **Develop Ability System:**
    - [ ] Implement the first ability (`Q`) for one of the Vessels.
    - [ ] Create a visual effect (VFX) for the ability.
    - [ ] Add a UI element to display ability cooldowns.
- [ ] **Refine Map Layout:**
    - [ ] Add basic structures for lanes (e.g., placeholder "Landmarks").
    - [ ] Create distinct "jungle" and "lane" areas.

---

## 3. Core Mechanics Overview

* **Echo System:** Players swap between two Vessels with a 5-second cooldown. The inactive Vessel regenerates energy but not health.
* **Action Combat:** Movement is handled with `WASD`, aiming with the mouse. There are separate inputs for light attacks, heavy attacks, three standard abilities, and an ultimate.
* **Unified Itemization:** All items purchased in a match apply their stats and effects to both of the player's Vessels simultaneously, requiring strategic build choices.
* **Dynamic Objectives:** The map features unique objectives like Temples that provide buffs/debuffs and a powerful Jungle Boss that can be summoned as an ally.

---

## 4. Technical Stack

* **Client-Side (Game):** `Three.js`, `HTML5`, `CSS`, `JavaScript (ES6+)`
* **Server-Side (Multiplayer):** `Node.js` with `WebSockets`
* **Database:** `MongoDB` or `PostgreSQL`
* **Hosting:** Requires a VPS or similar cloud hosting solution.

---

## 5. Instructions for Future Context

> To ensure continuity in our development process, please follow these steps at the beginning of any new conversation:
>
> 1.  Review this document (**Project Context: Vessels of Sanctuary**) to understand the current development phase and the immediate to-do list.
> 2.  Review the `README.md` file for the complete Game Design Document (GDD), including detailed lore, character archetypes, and game modes.
> 3.  Refer to the latest code artifacts (e.g., `main.js`, `vessels/Vessel.js`, `index.html`) to understand the current state of the prototype.
>
> This will prevent redundant work and allow us to efficiently build upon what has already been completed.
