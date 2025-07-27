# Antidote: Project Scope v2.1

A high-level design document for the game "Antidote".

---

## 1. High-Level Concept 🚀

- **Game Title:** Antidote
- **Core Genre:** A hybrid of First-Person Shooter (FPS), Real-Time Strategy (RTS), and Tower Defense.
- **Player Role:** **The Engineer**, a survivor with the unique ability to cure the plague and rebuild civilization.
- **Main Goal:** Systematically reclaim 12 regions of the world from "**The-Gray**," a horde of plague-infected beings.

---

## 2. Architectural & Foundational Systems 🏗️

This section outlines the core underlying architecture required to build a stable, scalable, and debuggable game. These systems are a prerequisite for the successful implementation of the gameplay features described below.

### Game State Manager
- **Description:** Manages the overall state of the application (e.g., `MainMenu`, `LoadingScreen`, `InGame`, `Paused`). It controls which logic is running and what is being rendered at any given time, preventing in-game actions from occurring in menus.
- **Purpose:** Ensures smooth transitions between game segments and provides a clear structure for saving and loading.

### Event Bus (Messaging System)
- **Description:** A central messaging system that allows different game modules (e.g., `BuildingManager`, `NoiseManager`) to communicate without being directly linked. Systems "publish" events (e.g., `BuildingComplete`), and other systems can "subscribe" to these events to react accordingly.
- **Purpose:** Decouples game logic, enabling parallel development, simplifying debugging, and making the codebase scalable. This is the central nervous system of the game.

### UI Manager
- **Description:** A dedicated system responsible for all on-screen information. It subscribes to events from the Event Bus and translates them into UI updates. It manages two primary types of information:
  - **Strategic Info:** Notifications displayed on the map view sidebar (e.g., "Research Complete," "Horde Wave Inbound").
  - **Contextual Info:** Proximity-based dialogs displayed in the FPS view (e.g., "Press `[E]` to deposit resources").
- **Purpose:** Separates game logic from UI presentation, ensuring a consistent visual style and centralizing control over all player-facing information. It will also manage the application of different UI themes (e.g., `Aqua`, `Rustic`, `Dark`) selected by the player.

### Save/Load System (Persistence Manager)
- **Description:** Handles the serialization and deserialization of the complete game state. This includes player inventory, building locations and states, research progress, and the status of all 12 regions.
- **Purpose:** Essential for long-term player engagement, allowing progress to be saved and resumed between sessions.

---

## 3. Core Gameplay Loop (The Three Phases) 🔄

1.  **Phase 1: Setup (FPS Exploration):** Players explore a new region in first-person to gather initial resources, scout locations, and establish a Main Base.
2.  **Phase 2: War (Tower Defense):** Players defend their base against increasingly difficult waves of "The-Gray," emphasizing defensive construction and direct FPS intervention.
3.  **Phase 3: Conquest (RTS Expansion):** Players use a top-down map view to command AI bots, place new building blueprints, and manage their expanding territory.

---

## 4. Key Gameplay Systems & Mechanics 🛠️

### 4.1. The Noise System
- **Description:** A dynamic threat system where player actions (building, upgrading, bot actions) generate "**Noise**." The higher the Noise level, the more frequently and powerfully the horde attacks.
- **Purpose:** Creates a core risk/reward loop, forcing players to balance expansion with stealth.

### 4.2. Base Building & Technology
- **Description:** Players can build, upgrade, and strategically downgrade structures. A tech tree allows for the unlocking of new abilities, bots, and buildings.
- **Purpose:** Provides the primary progression path for the player and the main tool for interacting with the world.

### 4.3. Personnel Management
- **Description:** A deep system for managing AI Bots and rescued Human Survivors. Cured humans come with 3-7 random perks. Players can assign them as managers or force them to work, which reverses a portion of their perks into negative "**Quirks**."
- **Purpose:** Adds a layer of strategic and moral decision-making to the game.

### 4.4. The Drop Ship Loop
- **Description:** Unwilling survivors can be escorted to an extraction point. Every 5 successful extractions rewards the player with a highly-skilled volunteer from an orbital station.
- **Purpose:** Provides a rewarding gameplay loop for players who choose a less coercive playstyle.

---

## 5. Multiplayer & Endgame 🌐

### Co-op Gameplay
- **Mobile Companion App:** A second-screen experience for a co-op partner to manage the base in RTS view.
- **Local & Online Play:** Support for up to 4-player local split-screen and 12-player online squads.

### Endgame Content
- **Post-Campaign:** After conquering all 12 regions, the game shifts to a live-service model with repeatable PvE challenges and raids.
- **Lore-Based PvP:** A "simulation network" allows for non-canon PvP matches as either **Engineers** or **Horde Leaders**.