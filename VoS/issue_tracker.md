# Issue Tracker - Vessels of Sanctuary (VoS)

*In-repo issue log for cataloging bugs, blockers, and important issues found during development.*

**Issue Prefix:** `VOS-`

---

## Issues

### VOS-001: Health bars don't face camera dynamically

| Field | Value |
| :--- | :--- |
| **Reported By** | AI Session |
| **Date Found** | 2026-04-05 |
| **Severity** | 🟢 Low |
| **Affected Area** | `npcs/Minion.js`, `npcs/JungleMob.js` — health bar billboarding |
| **Status** | 🆕 New |

**Description:** Health bars use a hardcoded offset `(+25, +27, +25)` for billboarding instead of reading the actual camera position. This works for the current fixed isometric angle but would break if the camera angle changes. Should reference the camera object directly.

---

### VOS-002: No mana regeneration mechanic

| Field | Value |
| :--- | :--- |
| **Reported By** | AI Session |
| **Date Found** | 2026-04-05 |
| **Severity** | 🟡 Medium |
| **Affected Area** | `vessels/Vessel.js` — stat system |
| **Status** | 🆕 New |

**Description:** Mana is consumed by abilities but never regenerates. Players will run out with no recovery option except leveling up. Needs passive mana regen or a regen-on-timer mechanic.

---

### VOS-003: Minions don't target player vessels

| Field | Value |
| :--- | :--- |
| **Reported By** | AI Session |
| **Date Found** | 2026-04-05 |
| **Severity** | 🟡 Medium |
| **Affected Area** | `npcs/Minion.js` — AI targeting |
| **Status** | 🆕 New |

**Description:** Red minions only fight blue minions and vice versa. They don't attack player vessels even when the player is nearby. In a real MOBA, minions should aggro the player if they attack enemy minions or enter range.

---

*Add new issues above this line.*
