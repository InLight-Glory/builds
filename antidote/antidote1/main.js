// Antidote - main.js - Orchestrator
console.log("main.js: Script started");

// --- MODULE IMPORTS/WIRING ---
// The PointerLockControls are loaded via a <script> tag in index.php and are available on the global THREE object.
// The import below was causing a fatal script error.
import { createTree, updateTrees } from './tree.js';
import { Building } from './building.js'; 

// --- CONFIGURABLE VARIABLES (Game-Wide) ---
const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 1000;
const MAP_CAMERA_HEIGHT = 150;
const MAP_VIEW_SIZE = 100;

// Day-Night Cycle Constants
const DAY_DURATION_MINUTES = 24;
const DAY_DURATION_SECONDS = DAY_DURATION_MINUTES * 60;

// --- CORE THREE.JS COMPONENTS ---
let scene, camera, renderer, clock, ambientLight, directionalLight;
let mapCamera, activeCamera;

// --- GAME OBJECTS ---
const objects = [];
const particles = [];
const buildings = []; 
const interactionDistance = 10;

// --- UI ELEMENTS ---
let debugPositionElement, debugControlsLockElement, debugPanel;
let buildDialog, buildTitle, buildRequirements;

// --- GAME STATE ---
let isMapViewActive = false;
window.isMapViewActive = isMapViewActive;
let currentTimeOfDay = 0;

// --- LOGGING ---
let enableDebugLogs = true;
function debugLog(...args) {
    if (enableDebugLogs) console.log(...args);
}
window.debugLog = debugLog;

// --- INITIALIZATION ---
function init() {
    debugLog("main.js: init() - Initializing Antidote...");
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 500);
    window.scene = scene;
    window.objects = objects;

    // --- Cameras ---
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE);
    window.camera = camera;
    const aspect = window.innerWidth / window.innerHeight;
    mapCamera = new THREE.OrthographicCamera(-MAP_VIEW_SIZE * aspect / 2, MAP_VIEW_SIZE * aspect / 2, MAP_VIEW_SIZE / 2, -MAP_VIEW_SIZE / 2, 1, MAP_CAMERA_HEIGHT + 100);
    window.mapCamera = mapCamera; // Expose map camera for other modules
    mapCamera.position.y = MAP_CAMERA_HEIGHT;
    mapCamera.lookAt(0, 0, 0);
    scene.add(mapCamera);
    activeCamera = camera;

    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // --- Lighting ---
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 75);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // --- Ground ---
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- UI Element References ---
    debugPositionElement = document.getElementById('debug-position');
    debugControlsLockElement = document.getElementById('debug-controls-locked');
    debugPanel = document.getElementById('debug-panel');
    buildDialog = document.getElementById('build-dialog');
    buildTitle = document.getElementById('build-title');
    buildRequirements = document.getElementById('build-requirements');

    // --- Player & Game Systems ---
    if (typeof window.initPlayer === 'function') {
        window.initPlayer(camera, scene);
    } else { console.error("Player module not found!"); }

    if (typeof window.initCuringMechanic === 'function') {
        window.initCuringMechanic();
    } else { console.error("Curing mechanic module not found!"); }
    
    generateTrees(50);
    
    placeBlueprint(new THREE.Vector3(15, 0, 15), 'Barracks');

    window.addEventListener('resize', onWindowResize);
    animate();
}

// --- BLUEPRINT PLACEMENT ---
function placeBlueprint(position, type) {
    const newBuilding = new Building(position, type);
    scene.add(newBuilding.mesh);
    buildings.push(newBuilding);
    objects.push(newBuilding.mesh); 
}
window.placeBlueprint = placeBlueprint; // Expose to other modules like player.js

// --- VIEW TOGGLING ---
function toggleMapView() {
    isMapViewActive = !isMapViewActive;
    window.isMapViewActive = isMapViewActive; // Update global state

    const mapMenu = document.getElementById('map-menu');
    const crosshair = document.getElementById('crosshair');

    if (isMapViewActive) {
        // Switch to Map View
        activeCamera = mapCamera;
        if (window.controls && window.controls.isLocked) {
            window.controls.unlock(); // Unlock pointer controls
        }
        if (mapMenu) mapMenu.style.display = 'block';
        if (crosshair) crosshair.style.display = 'none';
        document.body.classList.remove('pointer-lock-active'); // Ensure cursor is visible
        debugLog("Switched to Map View");
    } else {
        // Switch to First-Person View
        activeCamera = camera;
        if (mapMenu) mapMenu.style.display = 'none';
        if (crosshair) crosshair.style.display = 'block';
        debugLog("Switched to First-Person View");
    }
}
window.toggleMapView = toggleMapView; // Expose to other modules


// --- GAME GENERATION ---
function generateTrees(count) {
    const spawnRange = 200;
    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * spawnRange;
        const z = (Math.random() - 0.5) * spawnRange;
        const tree = createTree(new THREE.Vector3(x, 0, z));
        scene.add(tree);
        objects.push(tree);
    }
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
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // --- Updates that run regardless of view ---
    updateTrees(delta);
    // Add updates for other game systems
    if (typeof window.updateTheGray === 'function') window.updateTheGray(delta);
    if (typeof window.updateSpawner === 'function') window.updateSpawner(delta);
    if (typeof window.updateCuringMechanic === 'function') window.updateCuringMechanic(delta);

    const canUpdatePlayer = window.controls && window.controls.isLocked && !isMapViewActive;
    if (canUpdatePlayer) {
        if (typeof window.updatePlayer === 'function') window.updatePlayer(delta);
        if (typeof window.checkPickupCollisions === 'function') window.checkPickupCollisions();
    }
    
    // --- BUILDING INTERACTION LOGIC (Corrected) ---
    let canInteractWithBuilding = false;
    
    // Only check in First-Person Mode and if the player object exists
    if (canUpdatePlayer) { 
        const playerPosition = window.controls.getObject().position;

        for (const building of buildings) {
            const distanceToPlayer = playerPosition.distanceTo(building.position);

            if (distanceToPlayer < interactionDistance) {
                canInteractWithBuilding = true;
                buildDialog.style.display = 'block';

                if (building.state === 'blueprint') {
                    buildTitle.textContent = `${building.type} Blueprint`;
                    const resources = building.requiredResources[building.type];
                    let reqText = '<h4>Resources Needed:</h4>';
                    
                    for (const [resource, amount] of Object.entries(resources)) {
                        // Correctly check for player resources on the window object
                        let hasAmount = 0;
                        if (resource.toLowerCase() === 'wood') {
                            hasAmount = window.playerWood || 0;
                        } else if (resource.toLowerCase() === 'metal') {
                            // Note: 'playerMetal' is not yet implemented in player.js
                            hasAmount = 0; // Assuming 0 for now
                        }
                        const color = hasAmount >= amount ? 'lightgreen' : 'salmon';
                        reqText += `<p style="color: ${color};">${resource}: ${hasAmount} / ${amount}</p>`;
                    }
                    buildRequirements.innerHTML = reqText;

                } else if (building.state === 'complete') {
                    buildTitle.textContent = building.type;
                    buildRequirements.innerHTML = '<p>Press [E] to open production menu.</p>';
                }
                
                break; // Stop checking once we find a building to interact with
            }
        }
    }

    if (!canInteractWithBuilding) {
        buildDialog.style.display = 'none';
    }
    // --- END OF BUILDING LOGIC ---

    renderer.render(scene, activeCamera);
}

// --- START ---
document.addEventListener('DOMContentLoaded', init);