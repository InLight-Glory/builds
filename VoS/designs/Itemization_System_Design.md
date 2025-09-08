# Itemization System Design

## 1. Core Philosophy

The itemization in Vessels of Sanctuary is built on two core principles:
1.  **Meaningful Choices:** Every item purchase should feel like a significant decision that adapts a player's strategy to the current state of the game.
2.  **Synergistic Builds:** Due to the "Echo System" (controlling two Vessels), items should offer strategic depth that benefits the player's entire pairing, not just one Vessel.

## 2. Core Statistics

Items grant a combination of core and special stats.

*   **Offensive:**
    *   **Attack Damage (AD):** Increases the damage of basic attacks.
    *   **Ability Power (AP):** Increases the damage and effects of abilities.
    *   **Attack Speed (AS):** Increases the rate of basic attacks.
    *   **Critical Strike Chance (Crit %):** The chance for a basic attack to deal bonus damage.
    *   **Armor Penetration:** Ignores a percentage or flat amount of the target's Armor.
    *   **Magic Penetration:** Ignores a percentage or flat amount of the target's Magic Resist.

*   **Defensive:**
    *   **Health (HP):** The total damage a Vessel can take.
    *   **Health Regeneration (HP5):** Health restored per 5 seconds.
    *   **Armor:** Reduces incoming physical damage.
    *   **Magic Resist (MR):** Reduces incoming magical damage.

*   **Utility:**
    *   **Mana:** The resource for casting abilities.
    *   **Mana Regeneration (MP5):** Mana restored per 5 seconds.
    *   **Cooldown Reduction (CDR):** Reduces the time before abilities can be used again.
    *   **Movement Speed (MS):** Increases the Vessel's speed across the map.

## 3. The Armory (Item Shop)

The Armory is accessible only within the Sanctuary's spawn area. It is organized by item tiers and categories to facilitate quick purchasing.

## 4. Item Tiers & Build Paths

Items are structured in a tiered system, allowing players to build towards powerful "Legendary" items over time.

*   **Tier 1: Basic Items**
    *   **Description:** Single-component items that provide a small amount of a core stat. They are cheap and form the building blocks of all other items.
    *   **Example:**
        *   **Keystone Shard:** +15 Ability Power, Cost: 400 Gold.
        *   **Steel Longsword:** +10 Attack Damage, Cost: 350 Gold.
        *   **Woven Mantle:** +20 Armor, Cost: 300 Gold.

*   **Tier 2: Epic Items**
    *   **Description:** Mid-tier items built from two or more Basic Items and a recipe cost. They offer a significant stat boost and sometimes a simple passive effect.
    *   **Example:**
        *   **Runic Codex:** (Keystone Shard + Keystone Shard + 200g) = +40 Ability Power, +10% CDR. Cost: 1000 Gold.
        *   **Serrated Dirk:** (Steel Longsword + Steel Longsword + 300g) = +25 Attack Damage, +5 Armor Penetration. Cost: 1000 Gold.

*   **Tier 3: Legendary Items**
    *   **Description:** The most powerful items in the game. Built from Epic and/or Basic items, they provide substantial stats and a unique, game-changing passive or active ability.
    *   **Example:**
        *   **Fracture Cannon (Marksman/AD):**
            *   Build Path: Serrated Dirk + Runic Codex + 900g
            *   Stats: +50 AD, +30 AP, +10 Armor Pen, +10% CDR
            *   **Unique Passive - "Echo Blast":** After swapping Vessels, your next basic attack within 5 seconds deals bonus magic damage equal to 50% of your AP.
        *   **Aegis of the Sanctuary (Guardian/Tank):**
            *   Build Path: Woven Mantle + Woven Mantle + Runic Codex + 500g
            *   Stats: +50 Armor, +50 MR, +250 Health, +10% CDR
            *   **Unique Active - "Stasis Field":** Place yourself and your inactive vessel in stasis for 2.5 seconds, becoming invulnerable and untargetable. Cannot move or act during this time. (90s Cooldown)

## 5. Consumables & Trinkets

*   **Health Potion:** A cheap, single-use item that restores a small amount of health over time.
*   **Vision Ward:** A placeable ward that reveals a small area of the map, including invisible units.

This structure provides a clear progression, allows for strategic diversity, and integrates with the core Echo System mechanic.
