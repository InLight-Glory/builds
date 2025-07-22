// Antidote - main.js - Orchestrator
console.log("main.js: Script started");


// --- CONFIGURABLE VARIABLES (Game-Wide) ---
const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 1000;
const CUBE_HEALTH = 100;
const SHOOT_DAMAGE = 25;
const PARTICLE_COUNT = 15;
const PARTICLE_LIFETIME = 1.5;
const STUN_DURATION = 11.0;
const DEV_SPAWN_DISTANCE = 20.0;
const MAP_CAMERA_HEIGHT = 150; // NEW: Height for map camera
const MAP_VIEW_SIZE = 100; // NEW: How much area map camera sees

// --- DAY/NIGHT CYCLE CONFIG ---
const DAY_DURATION_MINUTES = 12;
const DAY_DURATION_SECONDS = DAY_DURATION_MINUTES * 60;

const MAP_OBJECT_LAYER = 1;

const skyColors = {
    dawn: new THREE.Color(0xFFB347), // Orange-ish
    day: new THREE.Color(0x87CEEB),  // Sky Blue
    dusk: new THREE.Color(0xDA70D6), // Orchid
    night: new THREE.Color(0x000033) // Dark Blue
};

const lightColors = {
    dawn: new THREE.Color(0xFFD700), // Gold
    day: new THREE.Color(0xFFFFFF),  // White
    dusk: new THREE.Color(0xFF6347), // Tomato
    night: new THREE.Color(0x404040) // Dark Gray
};

const lightIntensities = {
    dawn: 0.7,
    day: 0.9,
    dusk: 0.6,
    night: 0.1
};

// --- CORE THREE.JS COMPONENTS ---
let scene, camera, renderer;
let mapCamera; // NEW: Map camera
let activeCamera; // NEW: Track the currently active camera
let clock;
let ambientLight; // Declare ambientLight globally
let directionalLight; // Declare directionalLight globally
let mapRaycaster; // New raycaster for map mode clicks
let playerMapMarker; // Visual indicator for the player on the map

// --- GAME OBJECTS ---
let ground;
const objects = [];
const particles = [];

// --- UI ELEMENTS ---
let debugPositionElement;
let debugControlsLockElement;
let debugPanel;

// --- GAME STATE ---
let isMapViewActive = false; // NEW: Track map view state
window.isMapViewActive = isMapViewActive; // NEW: Export for player.js
let hasBaseBlueprint = false; // Track if a base blueprint exists

// --- LOGGING TOGGLE ---
let enableDebugLogs = true;
function debugLog(...args) {
    if (enableDebugLogs) console.log(...args);
}
window.debugLog = debugLog;
window.enableDebugLogs = enableDebugLogs;

document.addEventListener('keydown', (event) => {
    if (event.code === 'Backquote') {
        enableDebugLogs = !enableDebugLogs;
        window.enableDebugLogs = enableDebugLogs;
        console.log('Debug logs ' + (enableDebugLogs ? 'ENABLED' : 'DISABLED'));
        if (debugPanel) debugPanel.style.display = enableDebugLogs ? 'block' : 'none';
    }
});

// --- MODULE IMPORTS/WIRING ---
import * as Collisions from './collisions.js';
window.Collisions = Collisions;
import * as Level1 from './Level1.js';
window.Level1 = Level1;
import * as Trees from './trees.js';
window.Trees = Trees;
import * as Boulders from './boulders.js';
window.Boulders = Boulders;
import * as BaseBuilding from './base_building.js';
window.BaseBuilding = BaseBuilding;
import * as BuildManager from './build_manager.js';
window.BuildManager = BuildManager;
import * as RadialMenu from './radial_menu.js';
window.RadialMenu = RadialMenu;

// --- INITIALIZATION ---

function createPlayerMarkerTexture() {
    const canvas = document.createElement('canvas');
    const size = 128; // Texture size, power of 2 is good practice
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2; // a little padding

    // Create radial gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.7)'); // Opaque cyan center
    gradient.addColorStop(0.6, 'rgba(0, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');   // Transparent edge

    // Fill circle with gradient
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw directional arrow on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Arrow points "up" on the canvas (negative Y direction), which corresponds to forward in the scene
    ctx.moveTo(centerX, 15); // Tip
    ctx.lineTo(centerX - 12, 45); // Bottom-left
    ctx.lineTo(centerX + 12, 45); // Bottom-right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

function init() {
    debugLog("main.js: init() - Initializing Antidote...");
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 500);
    window.scene = scene;

    mapRaycaster = new THREE.Raycaster(); // Initialize map raycaster

    // --- FPS Camera ---
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE);
    window.camera = camera;

    // --- Map Camera (Orthographic) --- // NEW
    const aspect = window.innerWidth / window.innerHeight;
    mapCamera = new THREE.OrthographicCamera(
        -MAP_VIEW_SIZE * aspect / 2, MAP_VIEW_SIZE * aspect / 2,
        MAP_VIEW_SIZE / 2, -MAP_VIEW_SIZE / 2,
        1, MAP_CAMERA_HEIGHT + 100 // Near, Far
    );
    mapCamera.position.y = MAP_CAMERA_HEIGHT;
    mapCamera.lookAt(0, 0, 0); // Initially look at origin, will follow player
    scene.add(mapCamera); // Add to scene so it's part of the graph

    // --- Camera Layer Setup ---
    camera.layers.disable(MAP_OBJECT_LAYER);
    mapCamera.layers.enable(MAP_OBJECT_LAYER);

    activeCamera = camera; // Start with FPS camera

    try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(renderer.domElement);
    } catch (e) { console.error("main.js: Failed to initialize WebGLRenderer.", e); return; }

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 75); directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.9, metalness: 0.1 });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = "GroundPlane";
    scene.add(ground);

    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffA500 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(5, 1, -10); cube.castShadow = true; cube.receiveShadow = true;
    cube.name = "TestCubeOrange";
    cube.userData = { health: CUBE_HEALTH, maxHealth: CUBE_HEALTH, isDestructible: true, originalColor: cubeMaterial.color.clone() };
    scene.add(cube); objects.push(cube);

    const cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial.clone());
    cube2.material.color.setHex(0x0000ff);
    cube2.position.set(-5, 1, -12); cube2.castShadow = true; cube2.receiveShadow = true;
    cube2.name = "TestCubeBlue";
    cube2.userData = { health: CUBE_HEALTH, maxHealth: CUBE_HEALTH, isDestructible: true, originalColor: cube2.material.color.clone() };
    scene.add(cube2); objects.push(cube2);
    window.objects = objects;

    debugPositionElement = document.getElementById('debug-position');
    debugControlsLockElement = document.getElementById('debug-controls-locked');
    debugPanel = document.getElementById('debug-panel');

    if (typeof window.initPlayer === 'function') {
        window.initPlayer(camera, scene);
    } else { console.error("Player module (initPlayer) not found!"); }

    // --- Player Map Marker ---
    const markerSize = 5; // The size of the marker on the map
    const markerGeometry = new THREE.PlaneGeometry(markerSize, markerSize);
    const markerMaterial = new THREE.MeshBasicMaterial({
        map: createPlayerMarkerTexture(),
        transparent: true,
        depthWrite: false // Prevents z-fighting issues with the ground
    });
    playerMapMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    playerMapMarker.rotation.order = 'YXZ'; // Set rotation order: Yaw, Pitch, Roll
    playerMapMarker.rotation.x = -Math.PI / 2; // Lay it flat on the ground (Pitch)
    playerMapMarker.layers.set(MAP_OBJECT_LAYER); // Set to map-only layer
    playerMapMarker.visible = false; // Initially hidden, shown when map is active
    scene.add(playerMapMarker);

    if (typeof window.initCuringMechanic === 'function') {
        window.initCuringMechanic();
    } else { console.error("Curing Mechanic module (initCuringMechanic) not found!"); }

    if (window.Level1 && typeof window.Level1.setupLevel1 === 'function') {
        window.Level1.setupLevel1(scene, window.objects);
    }

    if (typeof window.Trees.initTrees === 'function') {
        window.Trees.initTrees(scene, window.objects);
    } else { console.error("Trees module (initTrees) not found!"); }

    if (typeof window.Boulders.initBoulders === 'function') {
        window.Boulders.initBoulders(scene, window.objects);
    } else { console.error("Boulders module (initBoulders) not found!"); }

    if (typeof window.BaseBuilding.initBaseBuilding === 'function') {
        window.BaseBuilding.initBaseBuilding(scene, window.objects);
    } else { console.error("BaseBuilding module (initBaseBuilding) not found!"); }

    if (typeof window.RadialMenu.initRadialMenu === 'function') {
        window.RadialMenu.initRadialMenu();
    } else { console.error("RadialMenu module (initRadialMenu) not found!"); }

    if (typeof window.startTestSpawn === 'function') {
        window.startTestSpawn();
    } else { console.warn("Spawner test function (startTestSpawn) not found."); }

    window.addEventListener('resize', onWindowResize);

    if (debugPanel) debugPanel.style.display = enableDebugLogs ? 'block' : 'none';

    // Event listener for map mode clicks
    document.addEventListener('click', (event) => {
        if (window.isMapViewActive && event.button === 0) { // Left click in map view
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            mapRaycaster.setFromCamera(mouse, mapCamera);

            const intersects = mapRaycaster.intersectObject(ground); // Only intersect with the ground

            if (intersects.length > 0) {
                const intersect = intersects[0];
                const clickPosition = intersect.point;
                console.log("Map click at:", clickPosition);

                const selectedBlueprintType = window.BuildManager.getSelectedBlueprintType();

                if (selectedBlueprintType) {
                    if (selectedBlueprintType === 'base' && hasBaseBlueprint) {
                        console.log("Base blueprint already exists. Cannot place another.");
                    } else {
                        window.BaseBuilding.createBlueprint(clickPosition, selectedBlueprintType);
                        if (selectedBlueprintType === 'base') hasBaseBlueprint = true;
                        window.BuildManager.clearSelectedBlueprintType(); // Clear selection after placement
                    }
                } else {
                    console.log("No blueprint type selected.");
                }
            }
        }
    });

    animate();
}

// --- MAP TOGGLE FUNCTION --- // NEW
function toggleMapView() {
    isMapViewActive = !isMapViewActive;
    window.isMapViewActive = isMapViewActive; // Update global flag
    debugLog("Map View Toggled:", isMapViewActive);

    if (isMapViewActive) {
        // Switch to Map View
        activeCamera = mapCamera;
        if(window.controls) window.controls.unlock(); // Ensure controls are unlocked
        document.body.classList.remove('pointer-lock-active'); // Ensure cursor is visible
        if (playerMapMarker) playerMapMarker.visible = true;
        // We will update map camera position in animate loop
    } else {
        // Switch to FPS View
        activeCamera = camera;
        if(window.controls) window.controls.lock(); // Try to lock controls
        // Note: PointerLockControls.lock() requires user interaction,
        // it might not lock immediately, but player.js handles clicks.
        if (typeof window.RadialMenu.hideRadialMenu === 'function') {
            window.RadialMenu.hideRadialMenu(); // Hide radial menu if it's open
        }
        if (playerMapMarker) playerMapMarker.visible = false;
    }
}
window.toggleMapView = toggleMapView; // Export for player.js


// --- DEV TOOL ---
// ... (No changes here)
function devSpawnTheGrayNearPlayer() {
    if (!window.controls || !window.createTheGray) {
        debugLog("Dev Spawn: Controls or createTheGray not ready."); return;
    }
    const playerPosition = window.controls.getObject().position;
    const randomAngle = Math.random() * Math.PI * 2;
    const spawnX = playerPosition.x + Math.cos(randomAngle) * DEV_SPAWN_DISTANCE;
    const spawnZ = playerPosition.z + Math.sin(randomAngle) * DEV_SPAWN_DISTANCE;
    const spawnPosition = new THREE.Vector3(spawnX, 0.9, spawnZ);
    debugLog("Dev Spawn: Attempting to spawn The-Gray at", spawnPosition);
    window.createTheGray(spawnPosition);
}
window.devSpawnTheGrayNearPlayer = devSpawnTheGrayNearPlayer;

// --- THE-GRAY REMOVAL UTILITY ---
// ... (No changes here)
function removeTheGray(theGrayInstance) {
    if (!theGrayInstance || !theGrayInstance.userData || !theGrayInstance.userData.isTheGray) {
        debugLog("Attempted to remove an invalid The-Gray instance."); return;
    }
    debugLog("Removing The-Gray:", theGrayInstance.name);
    if (theGrayInstance.userData.hitPoints && Array.isArray(theGrayInstance.userData.hitPoints)) {
        [...theGrayInstance.userData.hitPoints].forEach(hp => {
            if (hp.geometry) hp.geometry.dispose();
            if (hp.material) hp.material.dispose();
            theGrayInstance.remove(hp);
        });
        theGrayInstance.userData.hitPoints = [];
    }
    if (theGrayInstance.userData.stunCounterMesh) {
        const scm = theGrayInstance.userData.stunCounterMesh;
        if (scm.material && scm.material.map) scm.material.map.dispose();
        if (scm.material) scm.material.dispose();
        theGrayInstance.remove(scm);
        theGrayInstance.userData.stunCounterMesh = null;
    }
    if (theGrayInstance.userData.subdueRectangle) { // Patch mesh
        const sr = theGrayInstance.userData.subdueRectangle;
        if (sr.geometry) sr.geometry.dispose();
        if (sr.material) sr.material.dispose();
        theGrayInstance.remove(sr);
        theGrayInstance.userData.subdueRectangle = null;
    }

    if (theGrayInstance.geometry) theGrayInstance.geometry.dispose();
    if (theGrayInstance.material) theGrayInstance.material.dispose();
    scene.remove(theGrayInstance);
    const index = objects.indexOf(theGrayInstance);
    if (index > -1) objects.splice(index, 1);
}
window.removeTheGray = removeTheGray;


// --- SPAWN NOTIFICATION ---
function showTheGraySpawnNotification() { /* ... */ }
window.showTheGraySpawnNotification = showTheGraySpawnNotification;

// --- PARTICLES ---
// ... (No changes here)
function updateParticles(delta) {
    const grav = (typeof window.GRAVITY !== 'undefined') ? window.GRAVITY : -19.6; // Get from player.js
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.userData.life -= delta;
        if (p.userData.life <= 0) {
            if(p.geometry) p.geometry.dispose();
            if(p.material) p.material.dispose();
            scene.remove(p);
            particles.splice(i, 1);
        } else {
            p.userData.velocity.y += grav * 0.5 * delta;
            p.position.addScaledVector(p.userData.velocity, delta);
            if(p.material && typeof p.material.opacity !== 'undefined') {
                p.material.opacity = Math.max(0, p.userData.life / PARTICLE_LIFETIME);
            }
        }
    }
}

// --- WINDOW ---
function onWindowResize() {
    if (!camera || !mapCamera || !renderer) return; // UPDATED Check both cameras
    const aspect = window.innerWidth / window.innerHeight;

    // Update FPS Camera
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    // Update Map Camera
    mapCamera.left = -MAP_VIEW_SIZE * aspect / 2;
    mapCamera.right = MAP_VIEW_SIZE * aspect / 2;
    mapCamera.top = MAP_VIEW_SIZE / 2;
    mapCamera.bottom = -MAP_VIEW_SIZE / 2;
    mapCamera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- ANIMATE ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    const canUpdatePlayer = window.controls && window.controls.isLocked && !isMapViewActive;

    if (canUpdatePlayer) {
        if (typeof window.updatePlayer === 'function') window.updatePlayer(delta);
    }

    // Update these even if map is open or controls unlocked, but maybe not if paused (future)
    if (typeof window.updateTheGray === 'function') window.updateTheGray(delta);
    if (typeof window.updateCuringMechanic === 'function') window.updateCuringMechanic(delta);
    if (typeof window.updateSpawner === 'function') window.updateSpawner(delta);

    updateParticles(delta);

    // --- Day/Night Cycle Update ---
    const totalElapsedTime = clock.getElapsedTime();
    const timeOfDayFactor = (totalElapsedTime % DAY_DURATION_SECONDS) / DAY_DURATION_SECONDS;

    // Interpolate sky color
    let currentSkyColor;
    let currentLightColor;
    let currentLightIntensity;

    if (timeOfDayFactor < 0.25) { // Dawn (0.0 to 0.25)
        const factor = timeOfDayFactor / 0.25;
        currentSkyColor = skyColors.dawn.clone().lerp(skyColors.day, factor);
        currentLightColor = lightColors.dawn.clone().lerp(lightColors.day, factor);
        currentLightIntensity = lightIntensities.dawn + (lightIntensities.day - lightIntensities.dawn) * factor;
    } else if (timeOfDayFactor < 0.5) { // Day (0.25 to 0.5)
        const factor = (timeOfDayFactor - 0.25) / 0.25;
        currentSkyColor = skyColors.day.clone().lerp(skyColors.dusk, factor);
        currentLightColor = lightColors.day.clone().lerp(lightColors.dusk, factor);
        currentLightIntensity = lightIntensities.day + (lightIntensities.dusk - lightIntensities.day) * factor;
    } else if (timeOfDayFactor < 0.75) { // Dusk (0.5 to 0.75)
        const factor = (timeOfDayFactor - 0.5) / 0.25;
        currentSkyColor = skyColors.dusk.clone().lerp(skyColors.night, factor);
        currentLightColor = lightColors.dusk.clone().lerp(lightColors.night, factor);
        currentLightIntensity = lightIntensities.dusk + (lightIntensities.night - lightIntensities.dusk) * factor;
    } else { // Night (0.75 to 1.0)
        const factor = (timeOfDayFactor - 0.75) / 0.25;
        currentSkyColor = skyColors.night.clone().lerp(skyColors.dawn, factor);
        currentLightColor = lightColors.night.clone().lerp(lightColors.dawn, factor);
        currentLightIntensity = lightIntensities.night + (lightIntensities.dawn - lightIntensities.night) * factor;
    }

    scene.background.copy(currentSkyColor);
    scene.fog.color.copy(currentSkyColor);
    directionalLight.color.copy(currentLightColor);
    directionalLight.intensity = currentLightIntensity;

    // Update map camera position if active
    if (isMapViewActive && window.controls) {
        const playerPos = window.controls.getObject().position;
        mapCamera.position.x = playerPos.x;
        mapCamera.position.z = playerPos.z;
        mapCamera.lookAt(playerPos.x, 0, playerPos.z);
        mapCamera.updateProjectionMatrix(); // Might be needed if changing lookAt/pos often
    }

    // Update player map marker position and rotation
    if (playerMapMarker && window.controls) {
        const playerObject = window.controls.getObject();
        playerMapMarker.position.copy(playerObject.position);
        playerMapMarker.position.y = 0.1; // Keep it just above the ground to avoid z-fighting
        // The player's yaw is stored in the controls object's rotation.
        // Because we set rotation order to 'YXZ', this correctly applies yaw.
        playerMapMarker.rotation.y = playerObject.rotation.y;
    }


    if (scene && activeCamera && renderer) renderer.render(scene, activeCamera); // UPDATED use activeCamera

    // Update Debug Info
    if (debugPositionElement && window.controls) { // Show position even if locked/map
        const pos = window.controls.getObject().position;
        debugPositionElement.textContent = `X:${pos.x.toFixed(2)}, Y:${pos.y.toFixed(2)}, Z:${pos.z.toFixed(2)}`;
    }
    if (debugControlsLockElement && window.controls) {
         debugControlsLockElement.textContent = window.controls.isLocked ? 'true' : 'false';
    }
}

// --- START ---
document.addEventListener('DOMContentLoaded', init);