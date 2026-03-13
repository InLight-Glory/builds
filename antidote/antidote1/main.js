// Antidote - main.js - Orchestrator
console.log("main.js: Script started");

import { updateTrees, initTreeStreaming, updateTreeStreaming } from './tree.js';
import { Building } from './building.js'; 
import { saveGameState, loadGameState } from './gamestate.js';
import { initZoneSystem, onBuildingCompleted, onTheGraySubdued, applyRestorationPulse, updateZoneSystem, updateFrameBudget, getZoneSnapshot, applyZoneSnapshot, registerZoneVisuals, getPulseReadinessText } from './zone_system.js';
import { createEnvironmentArt, updateEnvironmentArt } from './environment_art.js';
import { initUIFeedback, pushGameNotice, updateObjectives, setPulseStatus } from './ui_feedback.js';
import { updatePickups } from './pickup.js';
import { initRuntimeState, registerWorldObject, unregisterWorldObject, getCollidableObjects, setTerrainManager, setFogController } from './runtime_state.js';
import { createTerrainManager } from './terrain_manager.js';
import { createFogOfWar } from './fog_of_war.js';
import { createUnitSystem } from './units.js';

// --- CONFIGURABLE VARIABLES ---
const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 1000;
const MAP_CAMERA_HEIGHT = 150;
const MAP_VIEW_SIZE = 100;
const DAY_DURATION_MINUTES = 24;
const DAY_DURATION_SECONDS = DAY_DURATION_MINUTES * 60;

// --- CORE THREE.JS COMPONENTS ---
let scene, camera, renderer, clock, ambientLight, directionalLight;
let groundMaterialRef;
let mapCamera, activeCamera, raycaster;
let environmentArt;
let terrainManager;
let fogController;
let unitSystem;

// --- GAME OBJECTS ---
let objects = [];
let buildings = []; 
window.buildings = buildings; // Expose to player.js
const interactionDistance = 10;

// --- UI ELEMENTS ---
let buildDialog, buildTitle, buildRequirements, saveLoadMenu;

// --- GAME STATE ---
let isMapViewActive = false;
window.isMapViewActive = isMapViewActive;
let selectedBlueprintType = null; // To store what the player wants to build

// --- LOGGING ---
let enableDebugLogs = true;
function debugLog(...args) { if (enableDebugLogs) console.log(...args); }
window.debugLog = debugLog;

// --- INITIALIZATION ---
function init() {
    debugLog("main.js: init() - Initializing Antidote...");
    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6f7d73);
    scene.fog = new THREE.Fog(0x5b6a5f, 10, 500);
    window.scene = scene;
    window.objects = objects;
    initRuntimeState(objects);
    window.registerWorldObject = registerWorldObject;
    window.unregisterWorldObject = unregisterWorldObject;
    window.getCollidableObjects = getCollidableObjects;

    // --- Cameras ---
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE);
    window.camera = camera;
    const aspect = window.innerWidth / window.innerHeight;
    mapCamera = new THREE.OrthographicCamera(-MAP_VIEW_SIZE * aspect / 2, MAP_VIEW_SIZE * aspect / 2, MAP_VIEW_SIZE / 2, -MAP_VIEW_SIZE / 2, 1, MAP_CAMERA_HEIGHT + 100);
    window.mapCamera = mapCamera;
    mapCamera.position.y = MAP_CAMERA_HEIGHT;
    mapCamera.lookAt(0, 0, 0);
    scene.add(mapCamera);
    activeCamera = camera;

    // --- Renderer & Lighting ---
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    document.getElementById('game-container').appendChild(renderer.domElement);
    ambientLight = new THREE.HemisphereLight(0xd9fff0, 0x172119, 0.9);
    scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xfff0d8, 1.4);
    directionalLight.position.set(-80, 120, -40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.near = 10;
    directionalLight.shadow.camera.far = 350;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);
    const fillLight = new THREE.PointLight(0x77ffd7, 0.6, 180);
    fillLight.position.set(0, 18, 0);
    scene.add(fillLight);

    environmentArt = createEnvironmentArt(scene);

    // --- Ground ---
    terrainManager = createTerrainManager(scene, {
        groundTexture: environmentArt.groundTexture,
        chunkSize: 80,
        chunkResolution: 28,
        loadRadius: 3,
        maxHeight: 24,
        mapTilePath: 'map/tile_x{col}_y{row}.jpg'
    });
    setTerrainManager(terrainManager);
    window.terrainManager = terrainManager;
    groundMaterialRef = terrainManager.material;
    window.getTerrainHeightAt = (x, z) => terrainManager.getHeightAt(x, z);

    const groundProxy = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.MeshBasicMaterial({ visible: false })
    );
    groundProxy.rotation.x = -Math.PI / 2;
    groundProxy.name = 'Ground';
    scene.add(groundProxy);
    registerWorldObject(groundProxy, { collidable: false, type: 'ground-proxy' });

    // --- UI Element References ---
    buildDialog = document.getElementById('build-dialog');
    buildTitle = document.getElementById('build-title');
    buildRequirements = document.getElementById('build-requirements');
    saveLoadMenu = document.getElementById('save-load-menu');
    initUIFeedback();
    window.pushGameNotice = pushGameNotice;
    window.setPulseStatus = setPulseStatus;

    // --- Player & Game Systems ---
    if (typeof window.initPlayer === 'function') window.initPlayer(camera, scene);
    if (window.controls) {
        const spawnPos = window.controls.getObject().position;
        spawnPos.y = terrainManager.getHeightAt(spawnPos.x, spawnPos.z) + 1.8;
    }
    if (typeof window.initCuringMechanic === 'function') window.initCuringMechanic();
    fogController = createFogOfWar({ cellSize: 8, defaultRevealRadius: 22 });
    setFogController(fogController);
    window.fogController = fogController;

    unitSystem = createUnitSystem(scene, {
        terrainManager,
        getObjects: () => objects,
        getBuildings: () => buildings,
        getFog: () => fogController
    });
    window.unitSystem = unitSystem;
    window.spawnPlayerUnit = (unitType, spawnPosition) => {
        const spawn = spawnPosition.clone();
        spawn.y = terrainManager.getHeightAt(spawn.x, spawn.z);
        const unit = unitSystem.spawnUnit(unitType, spawn, { team: 'player' });
        return unit;
    };

    initTreeStreaming({
        scene,
        getHeightAt: (x, z) => terrainManager.getHeightAt(x, z),
        registerObject: registerWorldObject,
        unregisterObject: unregisterWorldObject
    });
    initZoneSystem(scene, groundMaterialRef);
    registerZoneVisuals(environmentArt.zoneVisuals);
    window.onBuildingCompleted = onBuildingCompleted;
    window.onTheGraySubdued = onTheGraySubdued;
    window.getZoneSnapshot = getZoneSnapshot;
    window.requestRestorationPulse = (playerStats) => {
        if (!window.playerInstance || !window.controls) {
            setPulseStatus('Player unavailable');
            return { ok: false, message: "Player unavailable." };
        }
        const playerPos = window.controls.getObject().position;
        const nearbyBase = buildings.some((building) => (
            building.type === 'Base' &&
            building.state === 'complete' &&
            building.position.distanceToSquared(playerPos) < (16 * 16)
        ));
        if (!nearbyBase) {
            setPulseStatus('Awaiting Base uplink');
            return { ok: false, message: "Need a completed Base nearby to restore the zone." };
        }
        return applyRestorationPulse(playerStats);
    };
    pushGameNotice('Recovery team deployed. Establish a foothold.', 'info');

    if (window.controls) {
        const playerPos = window.controls.getObject().position;
        terrainManager.update(playerPos);
        updateTreeStreaming(playerPos);
        fogController.revealAt(playerPos, 24, true);
    }
    
    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('contextmenu', (event) => event.preventDefault());
    setupBuildMenu();
    setupGameMenu();

    animate();
}

// --- MENU SETUP ---
function setupGameMenu() {
    const mapSettingsIcon = document.getElementById('map-settings-icon');
    const saveButton = document.getElementById('save-game-button');
    const loadButton = document.getElementById('load-game-button');
    const closeMenuButton = document.getElementById('close-save-menu-button');

    if (mapSettingsIcon) {
        mapSettingsIcon.addEventListener('click', () => {
            if (isMapViewActive) {
                saveLoadMenu.style.display = 'block';
            }
        });
    }
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            if (window.playerInstance) {
                saveGameState(window.playerInstance, buildings, getZoneSnapshot());
            } else {
                console.error("Cannot save: Player instance not found.");
            }
        });
    }
    if (loadButton) {
        loadButton.addEventListener('click', () => {
            const gameState = loadGameState();
            if (gameState) {
                rebuildWorldFromState(gameState);
            }
        });
    }
    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', () => {
            saveLoadMenu.style.display = 'none';
        });
    }
}

// Handles clicks in map mode to place blueprints
function onDocumentMouseDown(event) {
    if (!isMapViewActive) return;

    if (unitSystem) {
        const consumed = unitSystem.handlePointerDown(event, {
            camera: mapCamera,
            isMapView: true
        });
        if (consumed) return;
    }

    if (event.button === 0 && selectedBlueprintType) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, mapCamera);
        const intersects = terrainManager.intersectRay(raycaster);
        if (intersects.length > 0) {
            const intersectPoint = intersects[0].point.clone();
            placeBlueprint(intersectPoint, selectedBlueprintType);
            selectedBlueprintType = null;
            document.querySelectorAll('.build-menu-button').forEach((b) => {
                b.style.borderColor = 'white';
            });
        }
    }
}

// Sets up listeners for the build menu buttons
function setupBuildMenu() {
    document.querySelectorAll('.build-menu-button').forEach(button => {
        button.addEventListener('click', () => {
            selectedBlueprintType = button.dataset.type; // e.g., 'Base' or 'Barracks'
            document.querySelectorAll('.build-menu-button').forEach(b => b.style.borderColor = 'white');
            button.style.borderColor = 'cyan';
            debugLog("Selected blueprint:", selectedBlueprintType);
        });
    });
}

// --- BLUEPRINT & WORLD BUILDING ---
function placeBlueprint(position, type) {
    position.y = terrainManager ? terrainManager.getHeightAt(position.x, position.z) : position.y;
    const newBuilding = new Building(position, type);
    scene.add(newBuilding.mesh);
    buildings.push(newBuilding);
    registerWorldObject(newBuilding.mesh, { collidable: true, type: 'building', isBuilding: true });
    debugLog(`Placed ${type} blueprint at`, position);
}
window.placeBlueprint = placeBlueprint;

function rebuildWorldFromState(gameState) {
    // Clear existing dynamic objects (buildings, etc.)
    buildings.forEach((building) => {
        scene.remove(building.mesh);
        unregisterWorldObject(building.mesh);
    });
    buildings.length = 0;

    if (unitSystem && typeof unitSystem.getUnits === 'function' && typeof unitSystem.removeUnit === 'function') {
        const existingUnits = unitSystem.getUnits().slice();
        existingUnits.forEach((unit) => unitSystem.removeUnit(unit));
    }
    // (Future: clear other dynamic objects like NPCs, dropped items etc.)

    // Repopulate buildings
    gameState.buildings.forEach(buildingData => {
        const position = new THREE.Vector3(buildingData.position.x, buildingData.position.y, buildingData.position.z);
        const newBuilding = new Building(position, buildingData.type);
        
        newBuilding.state = buildingData.state;
        newBuilding.depositedResources = { ...buildingData.depositedResources };
        newBuilding.storage = { ...(buildingData.storage || newBuilding.storage) };
        newBuilding.productionQueue = Array.isArray(buildingData.productionQueue) ? buildingData.productionQueue.map((entry) => ({ ...entry })) : [];
        newBuilding.activeProduction = buildingData.activeProduction ? { ...buildingData.activeProduction } : null;
        
        // If complete, update appearance immediately
        if (newBuilding.state === 'complete') {
            newBuilding.finishConstruction(true); 
        } else {
            newBuilding.updateAppearance();
        }

        scene.add(newBuilding.mesh);
        buildings.push(newBuilding);
        registerWorldObject(newBuilding.mesh, { collidable: true, type: 'building', isBuilding: true });
    });

    // Reposition Player
    if (window.playerInstance && gameState.player) {
        const playerObject = window.playerInstance.controls.getObject();
        playerObject.position.set(gameState.player.position.x, gameState.player.position.y, gameState.player.position.z);
        window.playerInstance.stats = { ...gameState.player.stats };
        window.playerInstance.updateHUD();
    }
    if (gameState.zone) {
        applyZoneSnapshot(gameState.zone);
    }
    if (fogController && gameState.fog && typeof fogController.applySnapshot === 'function') {
        fogController.applySnapshot(gameState.fog);
    }
    if (unitSystem && Array.isArray(gameState.units)) {
        gameState.units.forEach((unitData) => {
            const spawnPos = new THREE.Vector3(unitData.position.x, unitData.position.y, unitData.position.z);
            const unit = unitSystem.spawnUnit(unitData.type, spawnPos, { team: 'player' });
            if (unit && unitData.order) {
                unit.issueOrder({ ...unitData.order });
                unit.attackMode = !!unitData.attackMode;
                unit.carry = { ...(unitData.carry || unit.carry) };
            }
        });
    }
    
    saveLoadMenu.style.display = 'none';
    toggleMapView(); // Switch back to FPS view
    debugLog("World rebuilt from saved state.");
}

// --- VIEW TOGGLING ---
function toggleMapView() {
    isMapViewActive = !isMapViewActive;
    window.isMapViewActive = isMapViewActive;
    const mapMenu = document.getElementById('map-menu');
    const crosshair = document.getElementById('crosshair');
    if (isMapViewActive) {
        activeCamera = mapCamera;
        if (window.controls && window.controls.isLocked) window.controls.unlock();
        if (mapMenu) mapMenu.style.display = 'flex';
        if (crosshair) crosshair.style.display = 'none';
        if (fogController) fogController.setEnabled(true);
        document.body.classList.remove('pointer-lock-active');
        debugLog("Switched to Map View");
    } else {
        activeCamera = camera;
        if (mapMenu) mapMenu.style.display = 'none';
        if (crosshair) crosshair.style.display = 'block';
        if (fogController) fogController.setEnabled(false);
        selectedBlueprintType = null; // Clear selection when leaving map view
        saveLoadMenu.style.display = 'none'; // Ensure save menu is hidden
        debugLog("Switched to First-Person View");
    }
}
window.toggleMapView = toggleMapView;

// --- GAME GENERATION ---
function getPlayerPosition() {
    if (window.controls && typeof window.controls.getObject === 'function') {
        return window.controls.getObject().position;
    }
    return new THREE.Vector3();
}

// --- EVENT HANDLERS ---
function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    mapCamera.left = -MAP_VIEW_SIZE * aspect / 2;
    mapCamera.right = MAP_VIEW_SIZE * aspect / 2;
    mapCamera.top = MAP_VIEW_SIZE / 2;
    mapCamera.bottom = -MAP_VIEW_SIZE / 2;
    mapCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (fogController) {
        fogController.setEnabled(isMapViewActive);
    }
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    const playerPosition = getPlayerPosition();
    terrainManager.update(playerPosition);
    updateTreeStreaming(playerPosition);

    mapCamera.position.set(playerPosition.x, MAP_CAMERA_HEIGHT, playerPosition.z);
    mapCamera.lookAt(playerPosition.x, 0, playerPosition.z);
    
    updateTrees(delta);
    updateEnvironmentArt(delta, clock.elapsedTime);
    updatePickups(delta, clock.elapsedTime);
    if (fogController) {
        fogController.clearFrameVisibility();
        fogController.revealAt(playerPosition, 24, true);
    }
    if (unitSystem) {
        unitSystem.update(delta);
    }
    if (typeof window.updateTheGray === 'function') window.updateTheGray(delta);
    if (typeof window.updateSpawner === 'function') window.updateSpawner(delta);
    if (typeof window.updateCuringMechanic === 'function') window.updateCuringMechanic(delta);
    updateFrameBudget(delta);

    const canUpdatePlayer = window.controls && window.controls.isLocked && !isMapViewActive;
    if (canUpdatePlayer) {
        if (typeof window.updatePlayer === 'function') window.updatePlayer(delta);
    }
    
    let canInteractWithBuilding = false;
    if (canUpdatePlayer && window.playerInstance) { 
        const playerPosition = window.controls.getObject().position;
        for (const building of buildings) {
            const distanceToPlayer = playerPosition.distanceTo(building.position);
            if (distanceToPlayer < interactionDistance) {
                if (building.state === 'blueprint') {
                    canInteractWithBuilding = true;
                    buildDialog.style.display = 'block';
                    buildTitle.textContent = `${building.type} Blueprint`;
                    const required = building.requiredResources[building.type];
                    const deposited = building.depositedResources;
                    let reqText = '<h4>Resources Needed:</h4>';
                    for (const [resource, amount] of Object.entries(required)) {
                        const hasDeposited = deposited[resource] || 0;
                        reqText += `<p>${resource}: ${hasDeposited} / ${amount}</p>`;
                    }
                    reqText += '<p style="color:cyan;">Press [E] to deposit resources.</p>';
                    buildRequirements.innerHTML = reqText;
                    break;
                } else if (building.state === 'complete') {
                    canInteractWithBuilding = true;
                    buildDialog.style.display = 'block';
                    buildTitle.textContent = `${building.type} Operational`;

                    let storageText = '<h4>Storage</h4>';
                    const storage = building.storage || {};
                    storageText += `<p>Wood: ${Math.floor(storage.wood || 0)} | Metal: ${Math.floor(storage.metal || 0)}</p>`;
                    storageText += `<p>Water: ${Math.floor(storage.water || 0)} | Energy: ${Math.floor(storage.energy || 0)}</p>`;
                    if (building.activeProduction) {
                        storageText += `<p>Producing: ${building.activeProduction.unitType} (${Math.max(0, building.activeProduction.timeRemaining).toFixed(1)}s)</p>`;
                    }
                    storageText += '<p style="color:cyan;">Press [E] to deposit resources.</p>';
                    if (building.type === 'Base') {
                        storageText += '<p style="color:#aaf1ff;">Press [E] for Helper, hold [Shift] + [E] for Scout.</p>';
                    } else if (building.type === 'Barracks') {
                        storageText += '<p style="color:#aaf1ff;">Press [E] to queue Soldier.</p>';
                    }
                    buildRequirements.innerHTML = storageText;
                    break;
                }
            }
        }
    }
    if (!canInteractWithBuilding && buildDialog.style.display !== 'none') {
        buildDialog.style.display = 'none';
    }

    buildings.forEach((building) => {
        if (typeof building.update === 'function') {
            building.update(delta, clock.elapsedTime);
        }
    });

    if (window.playerInstance) {
        // Passive resource regen so restoration and construction remain in tension.
        window.playerInstance.stats.water = Math.min(100, window.playerInstance.stats.water + delta * 1.2);
        window.playerInstance.stats.energy = Math.min(100, window.playerInstance.stats.energy + delta * 0.9);
        window.playerInstance.updateHUD();
    }

    const enemyCount = objects.filter(obj => obj.userData && obj.userData.isTheGray).length;
    const completeBuildings = buildings.filter(building => building.state === 'complete');
    const refineryCount = completeBuildings.filter(building => building.type === 'Refinery').length;
    const baseCount = completeBuildings.filter(building => building.type === 'Base').length;
    updateZoneSystem(delta, { enemyCount, refineryCount, baseCount });
    updateObjectives(getZoneSnapshot());
    const hasBaseAccess = window.playerInstance && window.controls && completeBuildings.some((building) => (
        building.type === 'Base' &&
        building.position.distanceToSquared(window.controls.getObject().position) < (16 * 16)
    ));
    setPulseStatus(getPulseReadinessText(window.playerInstance?.stats, hasBaseAccess));

    if (isMapViewActive && fogController) {
        fogController.render(mapCamera);
    }

    renderer.render(scene, activeCamera);
}

// --- START ---
document.addEventListener('DOMContentLoaded', init);
