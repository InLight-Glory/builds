// player.js - Handles player logic, controls, and interactions.
import { checkCollisions } from './collisions.js';
import { Building }t from './building.js'; // Assuming building logic might be needed

// --- Player State & Configuration ---
const PLAYER_SPEED = 10.0;
const PLAYER_HEIGHT = 1.8;
const JUMP_FORCE = 8.0;
const GRAVITY = -20.0;
const MOUSE_SENSITIVITY = 0.002;

let controls, camera;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let isSprinting = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// --- Player Object & Stats ---
let player = {
    stats: {
        health: 100,
        maxHealth: 100,
        weight: 0,
        maxWeight: 50,
        ammo: 100,
        maxAmmo: 100,
        wood: 0
    },
    inventory: [],
    controls: null,
    camera: null
};
window.player = player; // Expose player object globally for easy access

// --- HUD Elements ---
let hudHealth, hudWeight, hudAmmo, hudWood;

// --- INITIALIZATION ---
export function initPlayer(cam, scene) {
    camera = cam;
    controls = new THREE.PointerLockControls(camera, document.body);
    player.controls = controls; // Link controls to player object
    scene.add(controls.getObject());

    // Initialize HUD elements
    hudHealth = document.getElementById('hud-health');
    hudWeight = document.getElementById('hud-weight');
    hudAmmo = document.getElementById('hud-ammo');
    hudWood = document.getElementById('hud-wood');

    // Make player object globally accessible
    window.controls = controls;
    window.playerInstance = player; // **CRITICAL FIX: Expose player instance for saving**

    // --- Event Listeners for Controls ---
    document.addEventListener('click', () => {
        if (!window.isMapViewActive) {
            controls.lock();
        }
    });

    controls.addEventListener('lock', () => {
        document.body.classList.add('pointer-lock-active');
        if(document.getElementById('map-menu')) document.getElementById('map-menu').style.display = 'none';
    });

    controls.addEventListener('unlock', () => {
        document.body.classList.remove('pointer-lock-active');
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    updateHUD(); // Initial HUD update
}

// --- HUD Management ---
export function updateHUD() {
    if (!player) return;
    const stats = player.stats;
    if (hudHealth) hudHealth.textContent = `${stats.health}/${stats.maxHealth}`;
    if (hudWeight) hudWeight.textContent = `${stats.weight}/${stats.maxWeight}`;
    if (hudAmmo) hudAmmo.textContent = `${stats.ammo}/${stats.maxAmmo}`;
    if (hudWood) hudWood.textContent = `${stats.wood}`;
}
player.updateHUD = updateHUD; // Attach method to player object

// --- EVENT HANDLERS for Movement ---
function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) velocity.y += JUMP_FORCE;
            canJump = false;
            break;
        case 'ShiftLeft':
            isSprinting = true;
            break;
        case 'KeyM':
            if (typeof window.toggleMapView === 'function') {
                window.toggleMapView();
            }
            break;
        case 'KeyE':
             handleInteraction();
             break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'ShiftLeft':
            isSprinting = false;
            break;
    }
}

// --- INTERACTION LOGIC ---
function handleInteraction() {
    if (!controls.isLocked || !window.buildings) return;

    const interactionDistance = 10;
    const playerPosition = controls.getObject().position;

    for (const building of window.buildings) {
        if (building.state === 'blueprint') {
            const distanceToBuilding = playerPosition.distanceTo(building.position);
            if (distanceToBuilding < interactionDistance) {
                depositResources(building);
                return; // Interact with the first building in range and stop
            }
        }
    }
}

function depositResources(building) {
    console.log(`Interacting with ${building.type} blueprint.`);
    const required = building.requiredResources[building.type];
    let depositedSomething = false;

    for (const [resource, amount] of Object.entries(required)) {
        const needed = amount - (building.depositedResources[resource] || 0);
        if (needed > 0 && player.stats[resource] > 0) {
            const toDeposit = Math.min(needed, player.stats[resource]);
            
            player.stats[resource] -= toDeposit;
            building.depositedResources[resource] = (building.depositedResources[resource] || 0) + toDeposit;
            
            console.log(`Deposited ${toDeposit} ${resource}.`);
            depositedSomething = true;
        }
    }

    if (depositedSomething) {
        building.updateAppearance(); // Update visuals if needed
        building.checkCompletion(); // Check if construction can be finished
        updateHUD(); // Update player's HUD
    } else {
        console.log("You don't have the required resources.");
        // Optional: Show a message to the player on the UI
    }
}


// --- UPDATE LOOP ---
export function updatePlayer(delta) {
    if (!controls.isLocked) {
        // If controls are not locked, ensure player doesn't move
        velocity.x = 0;
        velocity.z = 0;
        return;
    }

    const speed = isSprinting ? PLAYER_SPEED * 1.8 : PLAYER_SPEED;

    // Stop momentum
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // Ensure consistent movement speed in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    // Apply movement
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    // Gravity
    velocity.y += GRAVITY * delta;
    controls.getObject().position.y += velocity.y * delta;

    // Simple collision with the ground
    if (controls.getObject().position.y < PLAYER_HEIGHT) {
        velocity.y = 0;
        controls.getObject().position.y = PLAYER_HEIGHT;
        canJump = true;
    }
}