# Player Progression System Design

## 1. Overview

This document defines the in-match progression system for Vessels. Progression is centered around gaining Experience Points (XP) to level up, which increases a Vessel's base stats and grants Ability Points to empower their skills.

## 2. Experience and Leveling

*   **Max Level:** The maximum level a Vessel can reach in a single match is 18.
*   **Experience Sources:**
    *   **Minion Kills:** Being nearby when an enemy lane minion dies. Last-hitting a minion grants a small XP bonus.
    *   **Vessel Kills/Assists:** Killing or assisting in the kill of an enemy Vessel.
    *   **Jungle Monsters:** Killing neutral monsters in the jungle.
    *   **Map Objectives:** Completing major map objectives (e.g., destroying a Landmark) grants global XP to the team.

*   **Experience Curve:** The total XP required to reach the next level increases with each level. This follows a non-linear curve to make early levels faster than later levels.

| Level | XP to Next | Total XP |
| :---: | :---: | :---: |
| 1 | 280 | 0 |
| 2 | 380 | 280 |
| 3 | 480 | 660 |
| 4 | 580 | 1140 |
| 5 | 680 | 1720 |
| ... | ... | ... |
| 17 | 2080 | 20400 |
| 18 | - | 22480 |

*(Note: These are example values and can be tuned for game pacing.)*

## 3. Stat Progression Per Level

Upon leveling up, each Vessel automatically gains a set amount of base stats. This growth is determined by their Archetype, ensuring that Guardians naturally become tankier and Marksmen naturally become more damage-focused.

**Example Stat Growth Per Level:**

| Stat | Guardian | Combatant | Marksman | Specialist | Enhancer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Health | +95 | +90 | +80 | +82 | +78 |
| Mana | +40 | +45 | +35 | +55 | +50 |
| Attack Damage | +2.5 | +3.5 | +4.0 | +2.0 | +2.2 |
| Armor | +3.5 | +3.0 | +2.5 | +2.5 | +2.8 |
| Magic Resist | +1.5 | +1.25 | +1.0 | +1.25 | +1.25 |
| Attack Speed | +1.5% | +2.0% | +2.5% | +1.8% | +1.5% |

*(Note: These values are added to the Vessel's base stats each time they level up.)*

## 4. Ability System

Each Vessel has a kit of 4 abilities:
*   **Passive Ability:** An innate ability that is always active.
*   **Ability 1 (Q):** A standard ability.
*   **Ability 2 (W):** A standard ability.
*   **Ultimate Ability (R):** A powerful ability with a long cooldown.

### 4.1. Ability Points

*   Players gain **1 Ability Point** each time they level up, from level 1 to 18.
*   These points can be spent to learn or rank up their Q, W, or R abilities.

### 4.2. Ability Ranks

*   **Standard Abilities (Q, W):** Can be ranked up to **5 times**.
*   **Ultimate Ability (R):** Can be ranked up to **3 times**.
*   A player can start putting points into their Ultimate at **level 6**.

### 4.3. Skill Progression Rules

*   A player can spend a maximum of **18 ability points** throughout a match.
*   To rank up an ability, the Vessel must meet a minimum level requirement.
    *   Rank 2: Level 3
    *   Rank 3: Level 5
    *   Rank 4: Level 7
    *   Rank 5: Level 9
*   Ultimate abilities can be ranked up at levels 6, 11, and 16.

This system provides players with meaningful choices on how to specialize their Vessel's power curve during a match.
