# AI Behavior: Minions & Monsters

## 1. Overview

This document outlines the AI behavior, stats, and targeting logic for the non-player characters (NPCs) in Vessels of Sanctuary, including lane minions and neutral jungle monsters.

## 2. Lane Minions

Lane minions are the primary source of Gold and Experience. They spawn in waves from the Sanctuary and march down each of the three lanes, attacking any enemy units they encounter.

### 2.1. Minion Types & Stats

| Type | Health | Damage | Gold | XP | Special |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Melee** | 450 | 12 | 21g | 60 | Spawns 3 per wave |
| **Caster** | 290 | 24 (ranged) | 14g | 30 | Spawns 3 per wave |
| **Siege** | 800 | 40 (ranged) | 60g | 95 | Spawns 1 every 3rd wave |

*Note: Stats and rewards scale up over the duration of the match.*

### 2.2. Spawning

*   **First Wave:** Spawns at 1:00.
*   **Frequency:** A new wave spawns every 30 seconds.
*   **Scaling:** Minions gain health and damage every 2 minutes.

### 2.3. AI Targeting Priority

Minions use a "threat level" system to determine their target. They will attack the highest priority target within their aggro range.

1.  **Enemy Vessel attacking an allied Vessel.** (Highest Priority)
2.  Enemy Minion.
3.  Enemy Landmark (Tower).
4.  Enemy Vessel. (Lowest Priority)

*   A minion will not change its target unless its current target dies, moves out of range, or a higher priority target appears.

## 3. Jungle Monsters

Jungle monsters are neutral NPCs located in the jungle. Killing them provides Gold, XP, and sometimes a unique buff.

### 3.1. Lesser Camps

*   **Rift Wolves:** A pack of three wolves. Provide moderate Gold and XP.
*   **Stone Golems:** A pair of tanky golems. Resistant to damage but grant a temporary shield buff when killed.

### 3.2. Major Camps (Buff Camps)

*   **The Sentinel (Blue Buff):** A powerful golem that grants the "Crest of Insight" buff to its killer.
    *   **Crest of Insight:** Grants significant Mana Regeneration and Cooldown Reduction for 90 seconds.
*   **The Berserker (Red Buff):** A large, two-headed beast that grants the "Crest of Cinders" buff to its killer.
    *   **Crest of Cinders:** Causes basic attacks to slow the target and apply a small damage-over-time effect for 3 seconds. Lasts 90 seconds.

### 3.3. Epic Monsters

These are powerful, unique monsters that require a team effort to defeat and provide significant strategic advantages.

#### 3.3.1. Temple Guardians

*   **Location:** Two temples, one on each side of the river.
*   **Behavior:** The Guardians are powerful warriors that are initially neutral. To capture a temple, a team must defeat its Guardian.
*   **Reward:** Capturing a temple grants a team-wide buff for 3 minutes (e.g., +10% damage to Landmarks). Once captured, the Guardian respawns aligned with the capturing team, defending the temple.

#### 3.3.2. The Overgrowth Darkness

*   **Location:** A large pit near the center of the map.
*   **Behavior:** A massive, monstrous entity with powerful AoE attacks. It is the strongest neutral monster on the map.
*   **Reward:**
    *   Grants a large amount of Gold and XP to the entire team that kills it.
    *   The player who lands the killing blow gains the "Heart of the Overgrowth" item.
    *   **Heart of the Overgrowth:** This is a one-time-use active item that allows the player to summon a friendly, lane-pushing version of the Overgrowth Darkness in any lane.

### 3.4. AI Targeting Priority (Jungle Monsters)

*   Jungle monsters are neutral and will not attack unless provoked.
*   Once attacked, they will focus on the closest enemy Vessel within their aggro range.
*   They will reset and return to their camp if their target moves too far away, rapidly regenerating health.
