import { shrinkTree } from './tree.js';
import { collectPickup } from './pickup.js';

// player.js - Handles player state, controls, movement, and input

// --- PLAYER CONSTANTS ---
const PLAYER_COLLIDER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const PLAYER_DEPTH = 0.6;
const PLAYER_SPEED = 5.0;
const PLAYER_JUMP_VELOCITY = 7.0;
const GRAVITY = -19.6;
const SHOOT_DAMAGE = 25;
const SPRINT_MULTIPLIER = 2.0;
const INTERACTION_RANGE = 5.0; // Max distance to interact with buildings
window.GRAVITY = GRAVITY;
window.SHOOT_DAMAGE = SHOOT_DAMAGE;

// --- PLAYER STATE ---
let playerVelocity = new THREE.Vector3();
let playerOnGround = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let eKeyPressed = false;
let rightMouseDown = false;
let isSprinting = false;
window.rightMouseDown = rightMouseDown;

// Player inventory object
const player = {
    health: 100,
    maxHealth: 100,
    weight: 0,
    maxWeight: 50,
    ammo: 100,
    maxAmmo: 100,
    wood: 500, // Start with some wood for testing
    metal: 200 // Start with some metal for testing
};
window.player = player; // Expose player object globally

// --- CORE COMPONENTS ---
let camera;
let controls;
let scene;
let objects;
let debugControlsLockElement;
let raycaster;

function initPlayer(_camera, _scene) {
    if (typeof window.debugLog === 'function') window.debugLog("Initializing Player...");
    else console.log("Initializing Player (debugLog not found)...");

    camera = _camera;
    scene = _scene;
    objects = window.objects;
    raycaster = new THREE.Raycaster();

    if (!camera) { console.error("Player Init: Camera is undefined!"); return; }
    if (!scene) { console.error("Player Init: Scene is undefined!"); return; }
    if (!objects) { console.error("Player Init: Global objects array is undefined!"); return; }

    camera.position.y = PLAYER_COLLIDER_HEIGHT;

    if (typeof THREE.PointerLockControls !== 'function') {
        console.error("THREE.PointerLockControls is not loaded!"); return;
    }
    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
    window.controls = controls;

    debugControlsLockElement = document.getElementById('debug-controls-locked');

    document.addEventListener('click', () => {
        if (controls && !controls.isLocked && !window.isMapViewActive) {
             controls.lock();
        }
    });

    if (controls) {
        controls.addEventListener('lock', () => {
            if (typeof window.debugLog === 'function') window.debugLog('Controls Locked');
            if (!window.isMapViewActive) {
                document.body.classList.add('pointer-lock-active');
            }
            if (debugControlsLockElement) debugControlsLockElement.textContent = 'true';
        });
        controls.addEventListener('unlock', () => {
            if (typeof window.debugLog === 'function') window.debugLog('Controls Unlocked');
            document.body.classList.remove('pointer-lock-active');
            if (debugControlsLockElement) debugControlsLockElement.textContent = 'false';
            if (rightMouseDown) {
                rightMouseDown = false;
                window.rightMouseDown = false;
                if (typeof window.requestAntidoteStop === 'function') {
                    window.requestAntidoteStop();
                }
            }
        });
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('mousedown', (event) => {
        if (controls && controls.isLocked && !window.isMapViewActive) {
            if (event.button === 0) { // Left Click
                if (typeof window.handleShoot === 'function') window.handleShoot();
            } else if (event.button === 2) { // Right Click
                event.preventDefault();
                rightMouseDown = true;
                window.rightMouseDown = true;
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(window.objects, true);
                for (const intersect of intersects) {
                    const hitObject = intersect.object;
                    if (hitObject.userData && hitObject.userData.isSubdueRect) {
                        if (typeof window.applyAntidotePulse === 'function') {
                            window.applyAntidotePulse(hitObject.userData.parentGray);
                        }
                        break;
                    }
                }
            }
        }
    });

     document.addEventListener('mouseup', (event) => {
        if (event.button === 2) {
            event.preventDefault();
            if (rightMouseDown) {
                 rightMouseDown = false;
                 window.rightMouseDown = false;
                 if (typeof window.requestAntidoteStop === 'function') {
                     window.requestAntidoteStop();
                 }
            }
        }
    });

    document.addEventListener('contextmenu', function(e) {
        if (controls && controls.isLocked && !window.isMapViewActive) {
            e.preventDefault();
        }
    });

    updateHUD(); // Initial HUD update
}

function onKeyDown(event) {
    if (event.code === 'KeyM') {
        if (typeof window.toggleMapView === 'function') {
            window.toggleMapView();
        }
        return;
    }

    if (window.isMapViewActive) return;

    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': isSprinting = true; break;
        case 'Space':
            if (canJump && playerOnGround) {
                playerVelocity.y = PLAYER_JUMP_VELOCITY;
                playerOnGround = false;
            }
            break;
        case 'KeyE':
            if (!eKeyPressed) {
                let interactionTarget = findClosestInteractable();
                if (interactionTarget && interactionTarget.mesh.userData.isBlueprint) {
                    if (typeof interactionTarget.depositResources === 'function') {
                        interactionTarget.depositResources(player);
                        updateHUD();
                    }
                } else {
                    if (typeof window.requestPatchApplicationStart === 'function') {
                        window.requestPatchApplicationStart();
                    }
                }
            }
            eKeyPressed = true;
            break;
        case 'Digit9':
            if (window.enableDebugLogs && typeof window.devSpawnTheGrayNearPlayer === 'function') {
                window.devSpawnTheGrayNearPlayer();
            }
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isSprinting = false; break;
        case 'KeyE':
            if (typeof window.requestPatchApplicationCancel === 'function') {
                window.requestPatchApplicationCancel();
            }
            eKeyPressed = false;
            break;
    }
}

function findClosestInteractable() {
    if (!controls) return null;
    const playerPosition = controls.getObject().position;
    let closestObject = null;
    let minDistanceSq = INTERACTION_RANGE * INTERACTION_RANGE;

    if (window.buildings) {
        for (const building of window.buildings) {
            if (building.state === 'blueprint') {
                const distanceSq = playerPosition.distanceToSquared(building.position);
                if (distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    closestObject = building;
                }
            }
        }
    }
    if (closestObject) return closestObject;

    return null;
}

function getPlayerAABB(position) {
    if (!position || isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        console.error("getPlayerAABB received invalid position:", position);
        return new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    }
    return new THREE.Box3(
        new THREE.Vector3(position.x - PLAYER_WIDTH / 2, position.y - PLAYER_COLLIDER_HEIGHT, position.z - PLAYER_DEPTH / 2),
        new THREE.Vector3(position.x + PLAYER_WIDTH / 2, position.y, position.z + PLAYER_DEPTH / 2)
    );
}

function updatePlayer(delta) {
    if (!controls || !camera || !objects) return;
    const playerObject = controls.getObject();
    if (!playerObject) return;
    const playerPosition = playerObject.position;
    if (!playerPosition) return;
    if (!playerOnGround) playerVelocity.y += GRAVITY * delta;

    // --- MOVEMENT CALCULATION ---
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    playerObject.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    cameraForward.normalize();
    // FIX: Correct right vector calculation
    cameraRight.crossVectors(cameraForward, playerObject.up).normalize();

    let inputForward = 0;
    let inputRight = 0;
    if (moveForward) inputForward += 1;
    if (moveBackward) inputForward -= 1;
    if (moveLeft) inputRight -= 1;
    if (moveRight) inputRight += 1;

    const currentSpeed = isSprinting ? PLAYER_SPEED * SPRINT_MULTIPLIER : PLAYER_SPEED;
    
    // Use corrected cameraRight
    const targetDx = (cameraForward.x * inputForward + cameraRight.x * inputRight) * currentSpeed * delta;
    const targetDz = (cameraForward.z * inputForward + cameraRight.z * inputRight) * currentSpeed * delta;
    const targetDy = playerVelocity.y * delta;

    // --- COLLISION DETECTION ---
    playerPosition.x += targetDx;
    let playerAABB = getPlayerAABB(playerPosition);
    for (const object of objects) {
        if (!object || (object.userData && (object.userData.isTheGray || object.userData.isPickup))) continue;
        const objectAABB = new THREE.Box3().setFromObject(object);
        if (playerAABB.intersectsBox(objectAABB)) {
            playerPosition.x -= targetDx;
            break;
        }
    }

    playerPosition.z += targetDz;
    playerAABB = getPlayerAABB(playerPosition);
    for (const object of objects) {
        if (!object || (object.userData && (object.userData.isTheGray || object.userData.isPickup))) continue;
        const objectAABB = new THREE.Box3().setFromObject(object);
        if (playerAABB.intersectsBox(objectAABB)) {
            playerPosition.z -= targetDz;
            break;
        }
    }

    // --- VERTICAL COLLISION & GRAVITY ---
    playerOnGround = false;
    playerPosition.y += targetDy;
    playerAABB = getPlayerAABB(playerPosition);

    if (playerAABB.min.y < 0) {
        playerPosition.y -= playerAABB.min.y;
        if (playerVelocity.y < 0) playerVelocity.y = 0;
        playerOnGround = true;
    }
    
    playerAABB = getPlayerAABB(playerPosition);
    for (const object of objects) {
        if (!object || (object.userData && (object.userData.isTheGray || object.userData.isPickup))) continue;
        const objectAABB = new THREE.Box3().setFromObject(object);
        if (playerAABB.intersectsBox(objectAABB)) {
            if (targetDy < 0 && playerAABB.min.y >= objectAABB.max.y - 0.1) {
                playerPosition.y = objectAABB.max.y + PLAYER_COLLIDER_HEIGHT;
                if (playerVelocity.y < 0) playerVelocity.y = 0;
                playerOnGround = true;
            } else if (targetDy > 0 && playerAABB.max.y <= objectAABB.min.y + 0.1) {
                playerPosition.y = objectAABB.min.y - 0.01;
                if (playerVelocity.y > 0) playerVelocity.y = 0;
            }
            playerAABB = getPlayerAABB(playerPosition);
            break;
        }
    }
    canJump = playerOnGround;
}


function handleShoot() {
    if (!window.controls || !window.camera || !window.objects) return;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), window.camera);
    const intersects = raycaster.intersectObjects(window.objects, true);
    if (intersects.length > 0) {
        const firstHit = intersects[0];
        let hitObject = firstHit.object;
        let treeGroup = null;
        let currentTarget = hitObject;
        while (currentTarget) {
            if (currentTarget.userData && currentTarget.userData.isTree) {
                treeGroup = currentTarget;
                break;
            }
            currentTarget = currentTarget.parent;
        }
        if (treeGroup) {
            shrinkTree(treeGroup);
            return;
        }
        if (typeof hitObject.takeDamage === 'function') {
            hitObject.takeDamage(window.SHOOT_DAMAGE || 25, 'player');
        } else if (hitObject.parent && typeof hitObject.parent.takeDamage === 'function') {
            hitObject.parent.takeDamage(window.SHOOT_DAMAGE || 25, 'player');
        }
    }
}

function checkPickupCollisions() {
    if (!controls || !window.objects) return;
    const playerCollider = getPlayerAABB(controls.getObject().position);
    for (let i = window.objects.length - 1; i >= 0; i--) {
        const object = window.objects[i];
        if (object.userData && object.userData.isPickup) {
            const pickupCollider = new THREE.Box3().setFromObject(object);
            if (playerCollider.intersectsBox(pickupCollider)) {
                collectPickup(object);
                updateHUD();
            }
        }
    }
}

function updateHUD() {
    const healthElement = document.getElementById('hud-health');
    const weightElement = document.getElementById('hud-weight');
    const ammoElement = document.getElementById('hud-ammo');
    const woodElement = document.getElementById('hud-wood');
    const metalElement = document.getElementById('hud-metal'); // Assuming you add a metal display
    if (healthElement) healthElement.textContent = `${player.health}/${player.maxHealth}`;
    if (weightElement) weightElement.textContent = `${player.weight}/${player.maxWeight}`;
    if (ammoElement) ammoElement.textContent = `${player.ammo}/${player.maxAmmo}`;
    if (woodElement) woodElement.textContent = `${player.wood}`;
    if (metalElement) metalElement.textContent = `${player.metal}`;
}

window.initPlayer = initPlayer;
window.updatePlayer = updatePlayer;
window.handleShoot = handleShoot;
window.checkPickupCollisions = checkPickupCollisions;
