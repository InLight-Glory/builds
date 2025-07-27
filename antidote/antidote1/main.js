/**
 * BlueprintManager.js
 * Handles the RTS-style placement of building blueprints.
 */

const blueprintManager = (function() {
    let activeBlueprintType = null;
    let placementMesh = null; // The "ghost" building that follows the mouse
    let placedBlueprints = []; // A list of all blueprints placed in the world

<<<<<<< HEAD
    const blueprintGeometries = {
        'wall': new THREE.BoxGeometry(4, 2, 0.5)
    };
    const placementMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true
=======
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
>>>>>>> parent of 7d47982 (update attempt)
    });

    function initialize(scene) {
        // Create the placement mesh but don't add it to the scene yet
        placementMesh = new THREE.Mesh(new THREE.BoxGeometry(), placementMaterial);
        placementMesh.visible = false;
        scene.add(placementMesh);
    }
<<<<<<< HEAD

    function setActiveBlueprint(type, scene) {
        if (activeBlueprintType === type) {
            // If clicking the same button, deactivate build mode
            activeBlueprintType = null;
            placementMesh.visible = false;
            return null;
        }

        activeBlueprintType = type;
        if (blueprintGeometries[type]) {
            placementMesh.geometry.dispose(); // Clean up old geometry
            placementMesh.geometry = blueprintGeometries[type];
            placementMesh.visible = true;
        }
        return activeBlueprintType;
    }

    function update(mouseWorldPosition) {
        if (placementMesh && placementMesh.visible) {
            // Snap to a grid (e.g., of size 1)
            placementMesh.position.x = Math.round(mouseWorldPosition.x);
            placementMesh.position.y = 1; // Set y-position based on building height
            placementMesh.position.z = Math.round(mouseWorldPosition.z);
=======
    
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
>>>>>>> parent of 7d47982 (update attempt)
        }
    }

    function placeBlueprint(scene) {
        if (!activeBlueprintType) return;

        // Create a new mesh for the placed blueprint
        const blueprintMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2, opacity: 0.6, transparent: true });
        const newBlueprintMesh = new THREE.Mesh(blueprintGeometries[activeBlueprintType], blueprintMaterial);
        newBlueprintMesh.position.copy(placementMesh.position);
        
        scene.add(newBlueprintMesh);
        
        const blueprintData = {
            type: activeBlueprintType,
            position: { x: newBlueprintMesh.position.x, y: newBlueprintMesh.position.y, z: newBlueprintMesh.position.z },
            mesh: newBlueprintMesh // Keep a reference to the mesh
        };
        placedBlueprints.push(blueprintData);

        console.log(`Placed blueprint: ${activeBlueprintType} at`, blueprintData.position);
    }
    
    function getPlacedBlueprints() {
        return placedBlueprints.map(bp => ({ type: bp.type, position: bp.position }));
    }
    
    function recreateBlueprints(blueprintData, scene) {
        // Clear existing blueprints
        placedBlueprints.forEach(bp => scene.remove(bp.mesh));
        placedBlueprints = [];
        
        blueprintData.forEach(data => {
            const blueprintMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2, opacity: 0.6, transparent: true });
            const newBlueprintMesh = new THREE.Mesh(blueprintGeometries[data.type], blueprintMaterial);
            newBlueprintMesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(newBlueprintMesh);
            placedBlueprints.push({ ...data, mesh: newBlueprintMesh });
        });
    }


    // Public API
    return {
        initialize,
        setActiveBlueprint,
        update,
        placeBlueprint,
        getPlacedBlueprints,
        recreateBlueprints
    };
})();
