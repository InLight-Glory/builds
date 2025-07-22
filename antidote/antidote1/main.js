// Antidote - main.js - Orchestrator
console.log("main.js: Script started");

import { createTree, updateTrees } from './tree.js';
import { Building } from './building.js'; 

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
let mapCamera, activeCamera, raycaster;

// --- GAME OBJECTS ---
const objects = [];
const buildings = []; 
window.buildings = buildings; // Expose to player.js
const interactionDistance = 10;

// --- UI ELEMENTS ---
let buildDialog, buildTitle, buildRequirements;

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
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 500);
    window.scene = scene;
    window.objects = objects;

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
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);
    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 75);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // --- Ground ---
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = "Ground"; // Give it a name for raycasting
    scene.add(ground);
    objects.push(ground); // Add ground to objects so raycaster can hit it

    // --- UI Element References ---
    buildDialog = document.getElementById('build-dialog');
    buildTitle = document.getElementById('build-title');
    buildRequirements = document.getElementById('build-requirements');

    // --- Player & Game Systems ---
    if (typeof window.initPlayer === 'function') window.initPlayer(camera, scene);
    if (typeof window.initCuringMechanic === 'function') window.initCuringMechanic();
    generateTrees(50);
    
    // Test blueprint placement (optional, can be removed)
    // placeBlueprint(new THREE.Vector3(15, 0, 15), 'Base');

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', onDocumentMouseDown);
    setupBuildMenu();
    animate();
}

// NEW FUNCTION: Handles clicks in map mode to place blueprints
function onDocumentMouseDown(event) {
    if (isMapViewActive && event.button === 0 && selectedBlueprintType) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, mapCamera);
        const intersects = raycaster.intersectObject(scene.getObjectByName("Ground"));
        if (intersects.length > 0) {
            const intersectPoint = intersects[0].point;
            placeBlueprint(intersectPoint, selectedBlueprintType);
            selectedBlueprintType = null; // Deselect after placing
            document.querySelectorAll('.build-menu-button').forEach(b => b.style.borderColor = 'white'); // Reset button styles
        }
    }
}

// NEW FUNCTION: Sets up listeners for the build menu buttons
function setupBuildMenu() {
    document.querySelectorAll('.build-menu-button').forEach(button => {
        button.addEventListener('click', () => {
            selectedBlueprintType = button.dataset.type; // e.g., 'Base' or 'Barracks'
            // Visual feedback for selection
            document.querySelectorAll('.build-menu-button').forEach(b => b.style.borderColor = 'white');
            button.style.borderColor = 'cyan';
            debugLog("Selected blueprint:", selectedBlueprintType);
        });
    });
}

// --- BLUEPRINT PLACEMENT ---
function placeBlueprint(position, type) {
    const newBuilding = new Building(position, type);
    scene.add(newBuilding.mesh);
    buildings.push(newBuilding);
    objects.push(newBuilding.mesh);
    debugLog(`Placed ${type} blueprint at`, position);
}
window.placeBlueprint = placeBlueprint;

// --- VIEW TOGGLING ---
function toggleMapView() {
    isMapViewActive = !isMapViewActive;
    window.isMapViewActive = isMapViewActive;
    const mapMenu = document.getElementById('map-menu');
    const crosshair = document.getElementById('crosshair');
    if (isMapViewActive) {
        activeCamera = mapCamera;
        if (window.controls && window.controls.isLocked) window.controls.unlock();
        if (mapMenu) mapMenu.style.display = 'block';
        if (crosshair) crosshair.style.display = 'none';
        document.body.classList.remove('pointer-lock-active');
        debugLog("Switched to Map View");
    } else {
        activeCamera = camera;
        if (mapMenu) mapMenu.style.display = 'none';
        if (crosshair) crosshair.style.display = 'block';
        selectedBlueprintType = null; // Clear selection when leaving map view
        debugLog("Switched to First-Person View");
    }
}
window.toggleMapView = toggleMapView;

// --- GAME GENERATION ---
function generateTrees(count) {
    // ... (no changes in this function)
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
    // ... (no changes in this function)
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    mapCamera.left = -MAP_VIEW_SIZE * aspect / 2;
    mapCamera.right = -MAP_VIEW_SIZE * aspect / 2;
    mapCamera.top = MAP_VIEW_SIZE / 2;
    mapCamera.bottom = -MAP_VIEW_SIZE / 2;
    mapCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // --- System Updates ---
    updateTrees(delta);
    if (typeof window.updateTheGray === 'function') window.updateTheGray(delta);
    if (typeof window.updateSpawner === 'function') window.updateSpawner(delta);
    if (typeof window.updateCuringMechanic === 'function') window.updateCuringMechanic(delta);

    const canUpdatePlayer = window.controls && window.controls.isLocked && !isMapViewActive;
    if (canUpdatePlayer) {
        if (typeof window.updatePlayer === 'function') window.updatePlayer(delta);
        if (typeof window.checkPickupCollisions === 'function') window.checkPickupCollisions();
    }
    
    // --- BUILDING INTERACTION LOGIC (Corrected and Simplified) ---
    let canInteractWithBuilding = false;
    if (canUpdatePlayer && window.player) { 
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
                    // Logic for interacting with completed buildings
                }
            }
        }
    }
    if (!canInteractWithBuilding && buildDialog.style.display !== 'none') {
        buildDialog.style.display = 'none';
    }
    // --- END OF BUILDING LOGIC ---

    renderer.render(scene, activeCamera);
}

// --- START ---
document.addEventListener('DOMContentLoaded', init);