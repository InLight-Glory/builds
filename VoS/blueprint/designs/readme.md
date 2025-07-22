# Game System Design: The Echo System

**Version:** 1.2  
**Date:** July 22, 2025  
**Author:** Game Design Team

---

## 1. Feature Summary

The Echo System is the core, defining mechanic of *Vessels of Sanctuary*. It allows a player to control two distinct Vessels and swap between them in real-time. This system is intended to create deep strategic complexity, reward synergistic pairings, and enable a fast-paced, action-oriented combat flow.

## 2. Detailed Mechanics

### 2.1. The Swap

-   **Input:** `Shift` key (default).
-   **Cooldown:** **5.0 seconds**. This is a global cooldown that begins the moment a swap is executed.
-   **Execution:** The swap is instantaneous. The active Vessel disappears and the inactive Vessel appears in the exact same position and with the same rotation. Momentum is conserved.
-   **Visual/Audio Cue:** A distinct visual effect (e.g., a flash of light) and sound effect must play at the swap location to provide clear feedback to all players.

### 2.2. Resource Management

-   **Health:** The health pools of the two Vessels are **independent**. When a Vessel is inactive (in "Stasis"), it does not regenerate health. The only way to restore health is by returning to the Sanctuary or through specific abilities/items.
-   **Energy:** The energy pools are also **independent**. The active Vessel regenerates energy at its normal rate. The inactive Vessel regenerates energy at a significantly accelerated rate. This encourages swapping to manage ability resources.

### 2.3. Strategic Implications

-   **Combo Extension:** Players can use an ability with one Vessel and immediately swap to the other to follow up with a complementary skill.
-   **Survivability:** Swapping to a high-health Vessel can save a player from certain death.
-   **Role Adaptation:** A player can swap from a high-damage role to a utility role to adapt to a changing team fight.
-   **Itemization:** Because items apply to both Vessels, players must build a shared inventory that benefits their entire pairing, not just one character.

## 3. Edge Cases

-   **Crowd Control (CC):** If the active Vessel is stunned, silenced, or rooted, the player **cannot** swap. The swap action is treated like any other ability.
-   **Death:** If the active Vessel dies, the player does not automatically swap. They will respawn as the Vessel that died. The other Vessel remains in Stasis.
