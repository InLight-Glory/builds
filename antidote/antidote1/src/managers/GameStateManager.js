/**
 * GameStateManager.js
 * Manages the overall state of the application (e.g., In-Game, Paused).
 */

// An "enum" to define our possible game states. This prevents typos.
const GameStates = {
    LOADING: 'LOADING',
    MAIN_MENU: 'MAIN_MENU',
    IN_GAME: 'IN_GAME',
    PAUSED: 'PAUSED',
};

const gameStateManager = (function() {
    let currentState = GameStates.LOADING;
    let stateChangeCallback = null;

    console.log("GameStateManager initialized.");

    function onStateChange(callback) {
        stateChangeCallback = callback;
    }

    function changeState(newState) {
        if (!Object.values(GameStates).includes(newState) || currentState === newState) {
            return;
        }
        console.log(`Game state changing from ${currentState} to ${newState}`);
        currentState = newState;
        if (stateChangeCallback) {
            stateChangeCallback(currentState);
        }
    }

    function isState(state) {
        return currentState === state;
    }

    // Public API
    return {
        onStateChange,
        changeState,
        isState,
        // We expose the GameStates enum here for easy access from other files
        states: GameStates
    };
})();
