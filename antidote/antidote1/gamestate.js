// gamestate.js - Manages saving and loading the game state.

export function saveGameState(player, buildings) {
    console.log("Saving game state...");

    const gameState = {
        player: {
            position: player.controls.getObject().position.clone(),
            stats: { ...player.stats }
        },
        buildings: buildings.map(building => ({
            position: building.position.clone(),
            type: building.type,
            state: building.state,
            depositedResources: { ...building.depositedResources }
        })),
        timestamp: new Date().toISOString()
    };

    try {
        localStorage.setItem('antidote_savegame', JSON.stringify(gameState));
        console.log("Game state saved successfully!", gameState);
        alert("Game Saved!");
    } catch (e) {
        console.error("Error saving game state to localStorage:", e);
        alert("Failed to save game. Storage might be full.");
    }
}

export function loadGameState() {
    console.log("Attempting to load game state...");
    const savedStateJSON = localStorage.getItem('antidote_savegame');

    if (!savedStateJSON) {
        console.warn("No save game found in localStorage.");
        alert("No save game found!");
        return null;
    }

    try {
        const gameState = JSON.parse(savedStateJSON);
        console.log("Game state loaded successfully!", gameState);
        alert("Game Loaded! The world will now be rebuilt.");
        return gameState;
    } catch (e) {
        console.error("Error parsing saved game state from localStorage:", e);
        alert("Failed to load save game. The data may be corrupted.");
        return null;
    }
}