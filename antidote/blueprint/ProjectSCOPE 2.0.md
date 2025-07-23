# Antidote: Project Scope v2.0

## 1. High-Level Concept

* **Game Title:** Antidote
* **Core Genre:** A hybrid of First-Person Shooter (FPS), Real-Time Strategy (RTS), and Tower Defense.
* **Player Role:** The Engineer, a survivor with the unique ability to cure the plague and rebuild civilization.
* **Main Goal:** Systematically reclaim 12 regions of the world from "The-Gray," a horde of plague-infected beings.

## 2. The Core Gameplay Loop (The Three Phases)

The game revolves around a repeating cycle of three distinct phases, allowing players to engage with all core mechanics.

* **Phase 1: Setup (FPS Exploration)**
    Players explore a new region in first-person, gathering initial resources (wood, metal), scouting for strategic locations, and avoiding early threats. The primary goal is to find a defensible position and establish a Main Base.

* **Phase 2: War (Tower Defense)**
    With a base established, players must defend it against increasingly difficult waves of "The-Gray." This phase emphasizes building defensive structures, managing base power, and using FPS skills for direct intervention when defenses are overwhelmed.

* **Phase 3: Conquest (RTS Expansion)**
    Players switch to a top-down RTS map view to manage their expanding territory. This involves commanding AI bots, placing new building blueprints, managing a larger economy, and strategically pushing back the horde to conquer the entire region.

## 3. Key Systems & Mechanics

### 3.1. The Noise System

A dynamic threat system where player actions directly influence enemy aggression.

* **Noise Generation:** All player activity generates "Noise." This includes firing weapons, running machinery, and bot operations.
* **Base Noise:** The primary source of Noise. It increases with:
    * The total number of buildings.
    * The proximity of buildings to each other (dense bases are louder).
    * The level of each building (upgraded buildings are more powerful but louder).
* **Horde Waves:** Noise attracts horde waves. The higher the total Noise level, the more frequently the waves will attack, and the stronger and more numerous the enemies in each wave will be.

### 3.2. Base Building & Technology

* **View Switching:** Players can instantly toggle between FPS view for action and a top-down RTS map view for strategic command.
* **Tech Research:** A tech tree allows players to unlock new buildings, bots, player gear, and upgrades.
* **Building Upgrades/Downgrades:** Buildings can be upgraded once the required tech is unlocked, increasing their efficiency but also their Noise output. Players can strategically downgrade buildings to reduce Noise at a moment's notice, though it may come at a resource cost depending on personnel.
* **Resource Management:** Gather raw materials from the world and refine them at your base to fuel all construction, research, and production.

### 3.3. Personnel Management

Cured humans and constructed bots are vital assets that must be managed effectively.

* **AI Companions (Bots):** Specialized robots (e.g., "Mules" for hauling, "Scrappers" for gathering) can be built to automate tasks. Research on bots provides predictable completion times.
* **Human Survivors (Managers):**
    * Cured humans can be assigned as managers to buildings or bots.
    * Each human is generated with 3 to 7 random perks.
    * When assigned to research, a human manager provides a chance for a "breakthrough," making their research timeline randomly faster than a bot's.
* **The Coercion Mechanic:**
    * Players can force an unwilling survivor to work.
    * This reverses 1/3 of their perks (rounded down) into negative Quirks, creating a risk/reward for the player.
* **The Drop Ship Loop:**
    * Survivors who choose not to volunteer can be escorted to a drop ship extraction point.
    * For every 5 successful extractions, a highly skilled volunteer arrives from an orbital station, possessing 3-7 of the best perks from the survivors who were just extracted.

### 3.4. The Curing System

A core, multi-step process to cure "The-Gray" and turn them back into human survivors, making them available for recruitment or extraction.

## 4. Multiplayer & Endgame

### 4.1. Co-op Gameplay

* **Mobile Companion App:** A second-screen experience allowing a co-op partner to help manage the base, assign tasks, and view the RTS map while the main player is in FPS mode.
* **Local & Online Play:**
    * Up to 4-player local split-screen co-op.
    * Online squads of up to 12 players can team up to tackle entire regions together.

### 4.2. Endgame Content

* **Main Goal 2 (Post-Campaign):** After all 12 regions are reclaimed, the game transitions into a live-service model with repeatable, event-driven PvE content, such as high-difficulty challenges and multi-squad raids.
* **Lore-Based PvP:** A "simulation network" becomes available, allowing players to engage in PvP matches that are framed as training exercises within the game's lore. Players can choose to play as either Engineers or powerful Horde Leaders with unique abilities.
