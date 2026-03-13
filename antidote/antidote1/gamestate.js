// gamestate.js - Manages saving and loading the game state.

export function saveGameState(player, buildings, zoneSnapshot = null) {
    console.log("Saving game state...");

    const units = window.unitSystem && typeof window.unitSystem.getUnits === 'function'
        ? window.unitSystem.getUnits()
        : [];

    const fog = window.fogController && typeof window.fogController.getSnapshot === 'function'
        ? window.fogController.getSnapshot()
        : null;

    const gameState = {
        player: {
            position: player.controls.getObject().position.clone(),
            stats: { ...player.stats }
        },
        buildings: buildings.map(building => ({
            position: building.position.clone(),
            type: building.type,
            state: building.state,
            depositedResources: { ...building.depositedResources },
            storage: { ...(building.storage || {}) },
            productionQueue: Array.isArray(building.productionQueue) ? building.productionQueue.map((entry) => ({ ...entry })) : [],
            activeProduction: building.activeProduction ? { ...building.activeProduction } : null
        })),
        zone: zoneSnapshot,
        fog,
        units: units.map((unit) => ({
            type: unit.type,
            position: unit.mesh.position.clone(),
            order: unit.order ? { ...unit.order } : { type: 'idle' },
            attackMode: !!unit.attackMode,
            carry: unit.carry ? { ...unit.carry } : { type: 'wood', amount: 0 }
        })),
        timestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem('antidote_savegame', JSON.stringify(gameState));
        console.log("Game state saved successfully!", gameState);
        if (typeof window.pushGameNotice === 'function') {
            window.pushGameNotice('Recovery snapshot stored.', 'success');
        }
    } catch (e) {
        console.error("Error saving game state to localStorage:", e);
        if (typeof window.pushGameNotice === 'function') {
            window.pushGameNotice('Save failed. Storage may be full.', 'warning');
        }
    }
}

export function loadGameState() {
    console.log("Attempting to load game state...");
    const savedStateJSON = localStorage.getItem('antidote_savegame');

    if (!savedStateJSON) {
        console.warn("No save game found in localStorage.");
        if (typeof window.pushGameNotice === 'function') {
            window.pushGameNotice('No save record found.', 'warning');
        }
        return null;
    }

    try {
        const gameState = JSON.parse(savedStateJSON);
        console.log("Game state loaded successfully!", gameState);
        if (typeof window.pushGameNotice === 'function') {
            window.pushGameNotice('Recovery snapshot loaded.', 'success');
        }
        return gameState;
    } catch (e) {
        console.error("Error parsing saved game state from localStorage:", e);
        if (typeof window.pushGameNotice === 'function') {
            window.pushGameNotice('Load failed. Save data is corrupted.', 'warning');
        }
        return null;
    }
}
