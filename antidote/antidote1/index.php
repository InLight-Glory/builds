<!DOCTYPE html>
<html>
<head>
    <title>Antidote - The Gray</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- The UI Container holds all non-game UI elements -->
    <div id="ui-container">
        <div id="gear-icon" class="hidden">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.4 15L19.4 9L17.4 10L16.6 8.6C16.1 7.8 15.2 7.3 14.3 7.3L12.5 7.3C11.6 7.3 10.7 7.8 10.2 8.6L9.4 10L7.4 9L7.4 15L9.4 14L10.2 15.4C10.7 16.2 11.6 16.7 12.5 16.7L14.3 16.7C15.2 16.7 16.1 16.2 16.6 15.4L17.4 14L19.4 15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>

        <!-- NEW: Build menu for RTS mode -->
        <div id="build-menu" class="hidden">
            <h4>Build</h4>
            <div class="build-item" data-building="wall">Wall</div>
        </div>

        <div id="pause-menu" class="hidden">
            <h2>Paused</h2>
            <button id="save-button" class="menu-button">Save Game</button>
            <button id="load-button" class="menu-button">Load Game</button>
            <button id="resume-button" class="menu-button">Resume</button>
        </div>
        <div id="notification"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/PointerLockControls.js"></script>

<<<<<<< HEAD
    <script src="player.js"></script>
    <script src="tree.js"></script>
    <script src="building.js"></script>
    <script src="thegray.js"></script>
    <script src="thegray-spawner.js"></script>
    <script src="collisions.js"></script>
    <script src="pickup.js"></script>
    <script src="curing_mechanic.js"></script>

    <!-- Add the new manager scripts here. The order is important. -->
    <script src="core/GameState.js"></script>
    <script src="managers/GameStateManager.js"></script>
    <script src="managers/PersistenceManager.js"></script>
    <script src="managers/UIManager.js"></script>
    <script src="managers/BlueprintManager.js"></script> <!-- NEW -->

    <script src="Level1.js"></script>
    <!-- main.js must be last, as it uses all the other scripts. -->
    <script src="main.js"></script>
=======
    <script src="thegray.js?v=<?php echo time(); ?>"></script>
    <script src="thegray-spawner.js?v=<?php echo time(); ?>"></script>
    <script type="module" src="player.js?v=<?php echo time(); ?>"></script>
    <script src="curing_mechanic.js?v=<?php echo time(); ?>"></script>
    <script type="module" src="tree.js?v=<?php echo time(); ?>"></script>
    <script type="module" src="pickup.js?v=<?php echo time(); ?>"></script>
    <script type="module" src="building.js?v=<?php echo time(); ?>"></script> <script type="module" src="main.js?v=<?php echo time(); ?>"></script>

>>>>>>> parent of 7d47982 (update attempt)
</body>
</html>
