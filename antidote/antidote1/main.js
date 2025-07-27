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
let graySpawner; // NEW: Variable for the enemy spawner
window.buildings = buildings;
const interactionDistance = 10;

// --- UI ELEMENTS ---
let buildDialog, buildTitle, buildRequirements;

// --- GAME STATE ---
let isMapViewActive = false;
window.isMapViewActive = isMapViewActive;
let selectedBlueprintType = null;

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
    document.body.appendChild(renderer.domElement);
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
    ground.name = "Ground";
    scene.add(ground);
    objects.push(ground);

    // --- Player & Game Systems ---
    if (typeof window.initPlayer === 'function') window.initPlayer(camera, scene);
    graySpawner = new TheGraySpawner(); // NEW: Instantiate the spawner

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', onDocumentMouseDown);
    animate();
}

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

function onDocumentMouseDown(event) {
    if (isMapViewActive && event.button === 0 && selectedBlueprintType) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, mapCamera);
        const intersects = raycaster.intersectObject(scene.getObjectByName("Ground"));
        if (intersects.length > 0) {
            const intersectPoint = intersects[0].point;
            selectedBlueprintType = null;
        }
    }
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const canUpdatePlayer = window.controls && window.controls.isLocked;

    // Safely get player position for the spawner
    const playerPosition = window.playerInstance ? window.playerInstance.controls.getObject().position : new THREE.Vector3();

    if (canUpdatePlayer) {
        if (typeof window.updatePlayer === 'function') {
            window.updatePlayer(delta);
        }
    }
    
    // NEW: Update the enemy spawner and all enemies it manages
    if (graySpawner) {
        graySpawner.update(scene, playerPosition);
    }
    
    if(typeof window.updateTrees === 'function'){
        window.updateTrees(delta);
    }

    renderer.render(scene, activeCamera);
}

// --- STARTUP ---
document.addEventListener('DOMContentLoaded', init);