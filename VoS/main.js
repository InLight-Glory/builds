import { Vessel } from './vessels/Vessel.js';
import { createMap, animateMap, mapSize } from './modules/map.js';
import { initUI, updateCooldownUI, updateScore } from './modules/ui.js';
import { createOrbs, animateOrbs, orbs, createOrbCollectionParticles } from './modules/collectibles.js';

// --- SETUP ---

// Key state manager
const keysPressed = {};
window.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e272e);

// Camera
const aspect = window.innerWidth / window.innerHeight;
const d = 25;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
const cameraOffset = new THREE.Vector3(25, 25, 25);
camera.position.copy(cameraOffset);
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(50, 60, 25);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// --- INITIALIZE MODULES ---
createMap(scene);
initUI();
createOrbs(scene, 20, mapSize);


// --- GAME LOGIC ---
const clock = new THREE.Clock(); 
let score = 0;

// Create the player's Vessels
const vessel1 = new Vessel(scene, {
    type: 'marksman',
    color: 0x0984e3,
    size: 1.0,
    speed: 10,
    mapBounds: mapSize / 2
});
const vessel2 = new Vessel(scene, {
    type: 'guardian',
    color: 0xd63031,
    size: 1.2,
    speed: 7,
    mapBounds: mapSize / 2
});

// Swap mechanic variables
let vessels = [vessel1, vessel2];
let activeVesselIndex = 0;
let activeVessel = vessels[activeVesselIndex];
vessels[1].mesh.visible = false;

const swapCooldown = 5.0;
let lastSwapTime = -swapCooldown;

// Listen for the swap key press
window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'shift') {
        const now = clock.getElapsedTime();
        if (now - lastSwapTime >= swapCooldown) {
            const oldVessel = vessels[activeVesselIndex];
            const position = oldVessel.mesh.position.clone();
            const quaternion = oldVessel.mesh.quaternion.clone();
            oldVessel.mesh.visible = false;
            activeVesselIndex = (activeVesselIndex + 1) % vessels.length;
            activeVessel = vessels[activeVesselIndex];
            activeVessel.mesh.position.copy(position);
            activeVessel.mesh.quaternion.copy(quaternion);
            activeVessel.mesh.visible = true;
            lastSwapTime = now;
        }
    }
});

/**
 * Checks for collisions between the active vessel and any collectible orbs.
 */
function checkCollisions() {
    // Create a bounding box for the active vessel for collision detection.
    const vesselBox = new THREE.Box3().setFromObject(activeVessel.mesh);

    // Iterate backwards through the orbs array so we can safely remove items.
    for (let i = orbs.length - 1; i >= 0; i--) {
        const orb = orbs[i];
        const orbBox = new THREE.Box3().setFromObject(orb);

        // Check if the vessel's bounding box intersects with the orb's bounding box.
        if (vesselBox.intersectsBox(orbBox)) {
            const orbPosition = orb.position.clone();

            // If collision, remove the orb from the scene and the array.
            scene.remove(orb);
            orbs.splice(i, 1);

            // Update the score and UI.
            score++;
            updateScore(score);

            // Trigger a particle effect at the orb's last position.
            createOrbCollectionParticles(scene, orbPosition);
        }
    }
}


// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Animate modules
    animateMap(deltaTime, elapsedTime);
    animateOrbs(deltaTime);

    // Update game logic
    activeVessel.update(deltaTime, keysPressed, camera);
    checkCollisions();

    // Update UI
    updateCooldownUI(clock, lastSwapTime, swapCooldown);

    // Camera follows the active player
    const targetPosition = activeVessel.mesh.position.clone().add(cameraOffset);
    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(activeVessel.mesh.position);

    // Render the scene
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -d * newAspect;
    camera.right = d * newAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game loop
animate();
