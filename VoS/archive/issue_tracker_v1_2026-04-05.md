# Issue Tracker - Vessels of Sanctuary (VoS)

*In-repo issue log for cataloging bugs, blockers, and important issues found during development.*

**Issue Prefix:** `VOS-`

---

## Issues

### VOS-001: Health bars don't face camera

| Field | Value |
| :--- | :--- |
| **Reported By** | AI Session |
| **Date Found** | 2026-04-05 |
| **Severity** | 🟢 Low |
| **Affected Area** | `npcs/TargetDummy.js` — health bar rendering |
| **Status** | 🆕 New |

**Description:** TargetDummy health bars are rendered as flat `PlaneGeometry` meshes positioned above the body. They do not rotate to face the camera, so depending on camera angle they can appear edge-on and become unreadable. Expected: health bars should always face the camera (billboard effect).

---

### VOS-002: No mana regeneration mechanic

| Field | Value |
| :--- | :--- |
| **Reported By** | AI Session |
| **Date Found** | 2026-04-05 |
| **Severity** | 🟡 Medium |
| **Affected Area** | `vessels/Vessel.js` — stat system |
| **Status** | 🆕 New |

**Description:** Mana is consumed by abilities (ChargeAttack costs 15, PsychicAttack costs 10) but there is no mana regeneration system. Players will eventually run out of mana with no way to recover it except leveling up (which fully restores mana). Expected: passive mana regen or a regen-on-timer mechanic.

---

*Add new issues above this line.*
