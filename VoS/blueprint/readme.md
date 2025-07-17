# Vessels of Sanctuary
![Project Status](https://img.shields.io/badge/status-in%20development-green)
![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

**Vessels of Sanctuary** is a fast-paced, team-based Action MOBA for the web, built around a revolutionary core mechanic: the **Echo System**. In a world shattered by a reality-bending cataclysm, you are a Conductor, projecting your will into perfect reconstructions of legendary heroes and villains to fight a war trapped in a tragic time loop.

---

## Table of Contents
* [About The Game](#about-the-game)
* [Key Features](#key-features)
* [The Vessels: Character Archetypes](#the-vessels-character-archetypes)
* [Game Modes](#game-modes)
* [Technology Stack](#technology-stack)
* [Current Status & Roadmap](#current-status--roadmap)
* [Contributing](#contributing)
* [License](#license)
* [Community](#community)

---

## About The Game
[cite_start]The world of Gray-Earth is broken[cite: 1]. [cite_start]An age of unprecedented harmony, built upon the resonant power of a mysterious material called The Keystone, was shattered by a cataclysm known as **The Fracture**[cite: 3, 16, 1]. [cite_start]This event cracked reality itself, flooding the world with a toxic, reality-warping energy called the Static Miasma[cite: 17, 18].

[cite_start]Now, the last remnants of civilization huddle in two rival Sanctuaries, each built around a massive, stable fragment of The Keystone[cite: 22, 23]. [cite_start]Believing the other is a corruption that perpetuates the chaos, they are locked in a desperate war for the planet's future[cite: 25, 26, 27].

[cite_start]You are a **Conductor**, your mind linked directly to your Sanctuary's Keystone[cite: 28, 29]. [cite_start]From this link, you manifest **Echoes**—perfect physical reconstructions of legendary figures from across time, known as Vessels[cite: 33]. But you are trapped. [cite_start]Unbeknownst to all, the war is a self-perpetuating cycle[cite: 67]. [cite_start]Each time one Sanctuary achieves victory, the resulting imbalance resets the timeline, and the war begins anew[cite: 72, 73]. [cite_start]Your greatest triumph is your ultimate defeat[cite: 74].

[cite_start]Can you uncover the fragmented truths hidden within the loop and find a way to break the cycle? [cite: 78]

---

## ✨ Key Features

* **🌀 The Echo System:** Instantly swap between your two chosen Vessels with a **5-second cooldown**. Dodge lethal blows, create mind-bending combos, and manage two health and energy bars. Your inactive Vessel doesn't heal, so knowing when to fight and when to recall is paramount.

* **🔗 Unified Itemization:** A single item build applies to **both** of your Vessels. This creates incredible strategic depth, forcing you to purchase items that benefit your entire pairing. Will you build pure damage and risk a fragile support, or find the perfect hybrid build to make your duo an unstoppable force?

* **⚔️ True Action Combat:** No point-and-click. With **WASD movement** and a mouse-driven camera, every move is under your direct control. Land skill shots, dodge attacks, and master a combat system featuring light, heavy, and special ability attacks.

* **🗺️ Dynamic Map Objectives:** The jungle is alive with strategic opportunities. Capture asymmetric **Temples** guarded by ever-stronger warriors to buff your team or debuff your enemies. Defeat **"The Overgrowth Darkness"** and the player with the killing blow can summon it as a devastating siege ally.

* **🛡️ A New Kind of Defense:** Forget passive towers. **Landmarks** are high-health defensive points that emit a constant, toxic aura, dealing damage over time to any enemy Vessel in range. Pushing a lane is a war of attrition, not a simple tank-and-spank.

---

## 🎭 The Vessels: Character Archetypes

[cite_start]Choose two Vessels from five distinct archetypes, each a legend reborn from the Keystone Datastream[cite: 36, 48].

* [cite_start]**🛡️ Guardians:** Durable front-line protectors who excel at absorbing damage, controlling enemy movement, and defending their allies[cite: 49].

* [cite_start]**✊ Combaters:** Aggressive melee fighters who thrive in the thick of battle, dealing sustained damage and pursuing high-priority targets[cite: 50].

* [cite_start]**📖 Specialists:** Masters of area control and unique tactical abilities who manipulate the battlefield with powerful, often zone-based, skills[cite: 51].

* [cite_start]**🎯 Marksmen:** Ranged damage dealers who excel at attacking from a distance, taking down objectives, and eliminating key enemies with precision strikes[cite: 52].

* [cite_start]**⚡ Enhancers:** Tactical supporters who empower their allies with shields, healing, and other buffs, or disable enemies to turn the tide of a fight[cite: 53].

---

## 🎮 Game Modes

Whether you crave competition, cooperative challenges, or rich storytelling, Sanctuary has a mode for you.

* ### PvP Modes
  * **Sanctuary Assault (5v5):** The classic MOBA experience. Push lanes, destroy enemy Landmarks, and shatter their Sanctuary. [cite_start]This is the climactic battle of each time loop[cite: 81].
  * **Synergy Skirmish (3v3):** A fast-paced arena deathmatch where the first team to 30 kills wins.

* ### PvE & Single Player Modes
  * **Story Mode (Single Player):** Play through a unique 7-chapter narrative for each Vessel, exploring their backstory and the world of Sanctuary.
  * **Data Heist (1-4 Players):** A standard co-op mission to infiltrate a fortress and secure valuable data.
  * **Sanctuary Siege (1-4 Players):** A horde mode where you defend a Power Core against increasingly difficult waves and powerful bosses.
  * **Giant Hunt (1-4 Players):** A pure boss rush mode. No minions, no objectives—just you and your team against a gauntlet of massive bosses.
  * **Cloud Conduit (4-Player Raid):** The pinnacle of PvE content. A sprawling weekly mission with complex puzzles, unique lieutenants, and a multi-phase raid boss.

---

## 💻 Technology Stack

This project is being developed with a web-first approach to ensure maximum accessibility across browsers and devices.

### Client (The Game)
* **Game Framework:** **Phaser.js** or **Babylon.js**. These powerful JavaScript frameworks are ideal for creating high-performance 2D/2.5D games on the HTML5 Canvas.
* **Core Language:** **JavaScript (ES6+)**
* **Styling & UI:** **HTML5** and **CSS3**

### Server (The Backend)
* **Real-time Communication:** **Node.js** with **WebSockets** (using libraries like `Socket.IO` or `ws`). This is essential for handling the real-time multiplayer action.
* **Database:** **MongoDB** or **PostgreSQL** for storing player data, stats, and other persistent information.
* **Hosting Note:** Due to the need for a persistent WebSocket server, standard shared hosting is not sufficient. This project will require a **Virtual Private Server (VPS)** or similar cloud hosting solution (e.g., DigitalOcean, Linode, AWS EC2) that allows running a dedicated Node.js process.

---

## 🚀 Current Status & Roadmap

The project is currently in the **pre-production** phase. Our primary focus is on finalizing the core design and beginning to prototype the primary game mechanics.

* **Phase 1: Foundation (Current)**
  * [x] Finalize the core Game Design Document (GDD).
  * [ ] Prototype the Echo System (swapping) and combat controls using a selected JS framework.
  * [ ] Develop the first two playable Vessels (e.g., Orion & Kael).

* **Phase 2: Vertical Slice**
  * [ ] Create a small, functional section of the "Sanctuary Assault" map.
  * [ ] Implement the Unified Itemization system with a handful of items.
  * [ ] Set up the basic Node.js WebSocket server for multiplayer testing.

* **Phase 3: Content Expansion**
  * [ ] Develop additional Vessels and game modes.
  * [ ] Build out matchmaking, lobbies, and database integration.

---

## 🤝 Contributing

We are actively looking for passionate developers, designers, artists, and writers to help bring Vessels of Sanctuary to life! If you are interested in contributing, please check the open issues or reach out on our community channels.

You can help by:
* Reporting bugs by opening an issue.
* Suggesting new features or balance changes.
* Submitting a pull request with your own contributions.

---

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## 🌐 Community

Join the conversation and follow our development!

* **Discord:** [Link to Your Discord Server]
* **Twitter:** [@VesselsGame (Placeholder)]
* **Website:** [Link to Your Project Website]
