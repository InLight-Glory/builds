# Asset Pipeline Specification

## 1. Overview

This document outlines the technical specifications for the asset pipeline of Vessels of Sanctuary. A well-defined pipeline is crucial for ensuring performance, maintainability, and scalability, especially for a web-based game.

## 2. File Formats

The following file formats will be used for game assets. These formats are chosen for their balance of quality, compression, and web-friendliness.

*   **3D Models:**
    *   **Format:** `.glb`
    *   **Reasoning:** This is the binary version of the glTF format. It's the standard for 3D on the web, bundling models, textures, and animations into a single file. It's efficient to load and supported by Three.js.
*   **Textures:**
    *   **Format:** `.webp` for general textures, `.png` for textures requiring high fidelity transparency.
    *   **Reasoning:** WebP offers superior compression compared to JPEG and PNG, reducing file size and loading times. PNG should be used only when WebP's transparency is not sufficient.
*   **Audio:**
    *   **Format:** `.ogg` (Vorbis)
    *   **Reasoning:** Ogg provides excellent sound quality at low bitrates, making it ideal for web games where bandwidth is a concern. It's well-supported by modern browsers.
*   **UI Assets:**
    *   **Format:** `.svg` for icons and simple graphics, `.webp` for complex images.
    *   **Reasoning:** SVG is resolution-independent and ideal for sharp, scalable UI elements.

## 3. Naming Conventions

A strict naming convention is essential for organization and programmatic access to assets.

**General Structure:** `[AssetType]_[Category]_[AssetName]_[Variant].[ext]`

*   **AssetType:** `Model`, `Texture`, `Audio`, `Icon`, `VFX`
*   **Category:** `Vessel`, `Environment`, `UI`, `Item`
*   **AssetName:** The specific name of the asset (e.g., `Orion`, `Keystone`, `MainMenuClick`).
*   **Variant:** A descriptor for variations (e.g., `Base`, `CyberSkin`, `Loop`, `Oneshot`).

**Examples:**
*   `Model_Vessel_Orion_Base.glb`
*   `Texture_Vessel_Orion_CyberSkin_Albedo.webp`
*   `Audio_UI_MainMenuClick_Oneshot.ogg`
*   `Icon_Item_HealthPotion.svg`

## 4. Asset Loading Strategy

The client will employ a multi-stage loading strategy to minimize initial load times and ensure a smooth user experience.

### 4.1. Initial Load (Pre-Game)
When the player first loads the game's URL, a minimal set of assets required for the main menu and login screen will be loaded.

*   Core UI assets (logos, buttons, fonts).
*   Essential audio (UI sounds, main menu music).
*   Player's own profile data (username, level, currencies).

### 4.2. On-Demand Loading (Pre-Match)
Once a player enters a match lobby and all players have selected their vessels, the assets for that specific match will be loaded. A loading screen will be displayed during this phase.

*   Map-specific assets (ground textures, environment models).
*   Models, textures, and ability VFX for all 10 selected vessels and their chosen skins.
*   Announcer voice lines and in-game music.

### 4.3. Caching
The browser's cache will be leveraged to store assets. On subsequent loads, assets that have not changed will be served from the cache, dramatically speeding up loading times. Cache-busting techniques (e.g., appending a version hash to filenames) will be used when assets are updated.

## 5. Build Process & Optimization

In a production environment, assets should be optimized and bundled.

*   **Texture Compression:** Textures should be compressed to appropriate sizes (e.g., 2K for large environment textures, 1K for vessel textures).
*   **Model Optimization:** Models should have their polygon count optimized for real-time rendering without sacrificing too much visual quality.
*   **Asset Bundling:** A build tool like **Vite** or **Webpack** should be used to bundle JavaScript and CSS. For game assets, these tools can also be configured to manage asset paths and implement cache-busting.
