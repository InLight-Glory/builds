<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antidote</title>
    <link rel="stylesheet" href="style.css?v=<?php echo time(); ?>">
    </head>
<body>
    <div id="game-container"></div>

    <div id="ui-overlay">
        <div id="brand-mark">
            <span class="brand-kicker">Antidote Initiative</span>
            <span class="brand-title">Sector Recovery Build</span>
        </div>

        <div id="objective-panel" class="panel">
            <div class="panel-heading">Current Objective</div>
            <p id="objective-title">Reclaim the sector</p>
            <p id="objective-body">Establish a foothold, restore the ground, and contain the Gray bloom.</p>
        </div>

        <div id="crosshair"></div>

        <div id="interaction-prompt" class="floating-banner">
            {interaction_text}
        </div>

        <div id="subdue-progress" class="progress-shell">
            <div id="subdue-bar" style="width: 0%; height: 100%; background-color: #006400;"></div>
        </div>

        <div id="antidote-minigame" class="panel minigame-panel">
            <div style="text-align: center; color: #00FFFF; margin-bottom: 5px; font-size: 14px;">Administer Antidote</div>
            <div id="antidote-gauge-container" style="width: 100%; height: 20px; background-color: #333; border: 1px solid #555; position: relative; margin-bottom: 5px;">
                <div id="antidote-sweet-spot" style="position: absolute; top: 0; height: 100%; background-color: rgba(0, 255, 0, 0.3);"></div>
                <div id="antidote-overfill-zone" style="position: absolute; top: 0; height: 100%; background-color: rgba(255, 0, 0, 0.3);"></div> <div id="antidote-pressure-bar" style="position: absolute; top: 0; left: 0; width: 0%; height: 100%; background-color: #00FF00;"></div>
                <div id="antidote-overfill-warning" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 0, 0, 0.5); display: none;"></div>
            </div>
            <div id="antidote-timer-container" style="width: 100%; height: 15px; background-color: #222; border: 1px solid #444;">
                <div id="antidote-timer-bar" style="width: 0%; height: 100%; background-color: #00FFFF;"></div>
            </div>
             <div id="antidote-feedback" style="text-align: center; color: #FFFF00; margin-top: 5px; font-size: 12px;">Aim & [Hold Right-Click] - Keep pressure in the green zone!</div>
        </div>
        <div id="debug-panel">
            <p>Position: <span id="debug-position">X:0, Y:0, Z:0</span></p>
            <p>Controls Locked: <span id="debug-controls-locked">false</span></p>
            </div>

        <div id="hud" class="panel">
            <div class="panel-heading">Field Kit</div>
            <p>Health: <span id="hud-health">100/100</span></p>
            <p>Weight: <span id="hud-weight">0/50</span></p>
            <p>Ammo: <span id="hud-ammo">100/100</span></p>
            <p>Wood: <span id="hud-wood">0</span></p>
            <p>Metal: <span id="hud-metal">0</span></p>
            <p>Water: <span id="hud-water">0</span></p>
            <p>Energy: <span id="hud-energy">0</span></p>
            <p class="hint-line">[R] Restoration Pulse</p>
            <p class="hint-line">[E] Deposit resources / queue nearby building</p>
            <p class="hint-line">Units: Left-click select, right-click command</p>
            <p class="hint-line">Pulse Status: <span id="pulse-status">Awaiting Base uplink</span></p>
        </div>

        <div id="zone-panel" class="panel">
            <div class="panel-heading">Territory Status</div>
            <p><strong>Zone State:</strong> <span id="zone-state-value">0 (Dead)</span></p>
            <p>Contamination: <span id="zone-contamination-value">100</span></p>
            <p>Hydration: <span id="zone-hydration-value">0</span></p>
            <p>Biomass: <span id="zone-biomass-value">0</span></p>
            <p>Infrastructure: <span id="zone-infra-value">0</span></p>
            <p>Milestone: <span id="zone-milestone-value">M1: Reach Stabilized</span></p>
            <p>Frame Budget: <span id="zone-frame-value">0.0ms avg / 0.0ms worst</span></p>
        </div>

        <div id="notice-list"></div>

        <div id="map-menu">
            <button class="build-menu-button" data-type="Base">Base</button>
            <button class="build-menu-button" data-type="Barracks">Barracks</button>
            <button class="build-menu-button" data-type="Refinery">Refinery</button>
            <div id="map-settings-icon">
                <svg viewBox="0 0 24 24" aria-label="Cogwheel icon representing settings menu access in the game interface, displayed in a modern digital user interface environment" style="width: 100%; height: 100%; fill: white;" role="img" focusable="false">
                    <path d="M19.14,12.94c0-.32,0-.64,0-.94s0-.62,0-.94l2.11-1.65a.5.5,0,0,0,.12-.65l-2-3.46a.5.5,0,0,0-.61-.22l-2.49,1a7.14,7.14,0,0,0-1.63-.94l-.38-2.65A.5.5,0,0,0,13,2H11a.5.5,0,0,0-.5.42l-.38,2.65a7.14,7.14,0,0,0-1.63.94l-2.49-1a.5.5,0,0,0-.61.22l-2,3.46a.5.5,0,0,0,.12.65L4.86,11.06c0,.32,0,.64,0,.94s0,.62,0,.94l-2.11,1.65a.5.5,0,0,0-.12.65l2,3.46a.5.5,0,0,0,.61.22l2.49-1a7.14,7.14,0,0,0,1.63.94l.38,2.65A.5.5,0,0,0,11,22h2a.5.5,0,0,0,.5-.42l.38-2.65a7.14,7.14,0,0,0,1.63-.94l2.49,1a.5.5,0,0,0,.61-.22l2-3.46a.5.5,0,0,0-.12-.65ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
                </svg></svg>
            </div>
        </div>
    </div>

    <div id="build-dialog" class="dialog-box">
        <h3 id="build-title">Building Blueprint</h3>
        <div id="build-requirements">
            <p>Approach to build.</p>
        </div>
        <div id="build-menu">
            </div>
        <div id="build-progress-bar-container">
            <div id="build-progress-bar"></div>
        </div>
    </div>

    <div id="save-load-menu" class="dialog-box">
        <h3>Game Menu</h3>
        <button id="save-game-button" class="menu-button">Save Game</button>
        <button id="load-game-button" class="menu-button">Load Game</button>
        <button id="close-save-menu-button" class="menu-button-red">Close</button>
    </div>


    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/PointerLockControls.js"></script>

    <script src="thegray.js?v=<?php echo time(); ?>"></script>
    <script src="thegray-spawner.js?v=<?php echo time(); ?>"></script>
    <script type="module" src="player.js?v=<?php echo time(); ?>"></script>
    <script src="curing_mechanic.js?v=<?php echo time(); ?>"></script>
    <script type="module" src="main.js?v=<?php echo time(); ?>"></script>

</body>
</html>
