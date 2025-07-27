/**
 * PersistenceManager.js
 * Handles saving and loading the game state to and from the browser's localStorage.
 */
const persistenceManager = (function() {
    const saveSlotKey = 'antidote_saveFile_1';
    console.log("PersistenceManager initialized.");

    function saveGame() {
        try {
            console.log("Saving game...");
            // We assume the global GameState object has been populated before this is called.
            const jsonSaveData = JSON.stringify(GameState);
            localStorage.setItem(saveSlotKey, jsonSaveData);
            console.log("Save successful. Data:", JSON.parse(jsonSaveData));
        } catch (error) {
            console.error("Error saving game:", error);
        }
    }

    function loadGame() {
        try {
            console.log("Attempting to load game...");
            const jsonSaveData = localStorage.getItem(saveSlotKey);

            if (jsonSaveData === null) {
                console.warn("No save file found.");
                return false;
            }

            const loadedState = JSON.parse(jsonSaveData);

            // Clear the old GameState before loading the new one.
            Object.keys(GameState).forEach(key => delete GameState[key]);
            // Copy all properties from the loaded data into our live GameState object.
            Object.assign(GameState, loadedState);

            console.log("Load successful.");
            return true;

        } catch (error) {
            console.error("Error loading game:", error);
            return false;
        }
    }

    // Public API
    return {
        saveGame,
        loadGame
    };
})();
