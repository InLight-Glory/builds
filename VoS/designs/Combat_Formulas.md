# Combat Formulas Design

## 1. Overview

This document specifies the core mathematical formulas that govern combat in Vessels of Sanctuary. These formulas are fundamental to game balance and feel.

## 2. Damage Types

There are three primary types of damage:
*   **Physical Damage:** Primarily dealt by basic attacks and certain abilities. Reduced by Armor.
*   **Magic Damage:** Primarily dealt by abilities. Reduced by Magic Resist.
*   **True Damage:** A rare damage type that is not reduced by Armor or Magic Resist.

## 3. Defensive Formulas (Damage Mitigation)

The amount of damage reduced by Armor and Magic Resist is calculated using the same formula.

### 3.1. Damage Multiplier

The multiplier for incoming damage is calculated as follows:

`Damage Multiplier = 100 / (100 + Resistance)`

*   **Resistance:** The target's Armor for Physical Damage, or Magic Resist for Magic Damage.

**Examples:**
*   A Vessel with **50 Armor** takes `100 / (100 + 50)` = `0.667` or **66.7%** of incoming physical damage (a 33.3% reduction).
*   A Vessel with **100 Armor** takes `100 / (100 + 100)` = `0.5` or **50%** of incoming physical damage (a 50% reduction).
*   A Vessel with **-25 Armor** (due to a debuff) takes `100 / (100 - 25)` = `1.333` or **133.3%** of incoming physical damage (a 33.3% increase).

This formula provides diminishing returns for stacking resistance, a standard and healthy mechanic for MOBAs.

## 4. Offensive Formulas

### 4.1. Basic Attack Damage

The final damage of a basic attack before mitigation is calculated as:

`Final Attack Damage = Base Attack Damage + Bonus Attack Damage`

*   **Base Attack Damage:** The Vessel's AD at their current level.
*   **Bonus Attack Damage:** AD granted from items.

### 4.2. Critical Strike Damage

A critical strike deals bonus damage.

`Critical Strike Damage = Final Attack Damage * (2.0 + Bonus Crit Damage)`

*   **Default Crit Multiplier:** 200% (2.0) of a normal attack's damage.
*   **Bonus Crit Damage:** Certain items may increase this multiplier.

### 4.3. Ability Damage

The damage of an ability before mitigation is calculated based on its base damage and scaling from stats.

`Final Ability Damage = Base Damage + (Stat * Ratio)`

*   **Base Damage:** The ability's base damage at its current rank.
*   **Stat:** The relevant stat (e.g., Attack Damage, Ability Power, Max Health).
*   **Ratio:** The percentage of the stat that is converted into bonus damage.

**Example:**
An ability with `80/130/180/230/280` base damage and a `(+65% Ability Power)` ratio.
If the Vessel has **200 AP** and the ability is **Rank 3**:

`Final Damage = 180 + (200 * 0.65) = 180 + 130 = 310 Magic Damage`

### 4.4. Penetration

Armor and Magic Penetration reduce the effective resistance of the target when calculating damage.

`Effective Resistance = Target Resistance * (1 - % Penetration) - Flat Penetration`

*   Percentage penetration is applied before flat penetration.
*   Resistance cannot be reduced below 0.

**Example:**
A Vessel with **50 AD** attacks a target with **80 Armor**. The attacker has **10% Armor Penetration** and **15 Flat Armor Penetration**.

1.  **Calculate effective armor:** `80 * (1 - 0.10) - 15 = 80 * 0.9 - 15 = 72 - 15 = 57`
2.  **Calculate damage multiplier:** `100 / (100 + 57) = 0.637`
3.  **Calculate final damage:** `50 * 0.637 = 31.85 Physical Damage`

## 5. Putting It All Together: The Full Damage Formula

**For a Physical Damage Ability:**

`Final Damage = (Base Damage + (AD * Ratio)) * (100 / (100 + (Armor * (1 - % Pen)) - Flat Pen))`

**For a Basic Attack:**

`Final Damage = (Base AD + Bonus AD) * (100 / (100 + (Armor * (1 - % Pen)) - Flat Pen))`
