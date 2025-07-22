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
const SPRINT_MULTIPLIER = 2.0; // New sprint multiplier
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
let isSprinting = false; // New sprint state variable
window.rightMouseDown = rightMouseDown;

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
        // Only lock if not in map view
        if (controls && !controls.isLocked && !window.isMapViewActive) {
             controls.lock();
        }
    });

    if (controls) {
        controls.addEventListener('lock', () => {
            if (typeof window.debugLog === 'function') window.debugLog('Controls Locked');
            // Only add class if not in map view (though lock shouldn't happen then)
            if (!window.isMapViewActive) {
                document.body.classList.add('pointer-lock-active');
            }
            if (debugControlsLockElement) debugControlsLockElement.textContent = 'true';
        });
        controls.addEventListener('unlock', () => {
            if (typeof window.debugLog === 'function') window.debugLog('Controls Unlocked');
            document.body.classList.remove('pointer-lock-active'); // Always remove on unlock
            if (debugControlsLockElement) debugControlsLockElement.textContent = 'false';
            if (rightMouseDown) {
                console.log("[PLAYER.JS] Controls unlocked, forcing right mouse UP.");
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
        // Ensure not in map view before handling game clicks
        if (controls && controls.isLocked && !window.isMapViewActive) {
            if (event.button === 0) {
                if (typeof window.handleShoot === 'function') window.handleShoot();
            } else if (event.button === 2) {
                event.preventDefault();
                console.log("[PLAYER.JS] Right MOUSE DOWN detected.");
                rightMouseDown = true;
                window.rightMouseDown = true;
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(window.objects, true);
                for (const intersect of intersects) {
                    const hitObject = intersect.object;
                    if (hitObject.userData && hitObject.userData.isSubdueRect &&
                        hitObject.userData.parentGray && hitObject.userData.parentGray.userData &&
                        hitObject.userData.parentGray.userData.isPatchPlaced)
                    {
                        console.log("[PLAYER.JS] Raycast HIT patch. Calling applyAntidotePulse.");
                        if (typeof window.applyAntidotePulse === 'function') {
                            window.applyAntidotePulse(hitObject.userData.parentGray);
                        }
                        break;
                    }
                }
            }
        } else if (window.isMapViewActive) {
             console.log("[PLAYER.JS] Click in Map View (TODO: Handle Map Clicks)");
             // TODO: Add map interaction logic here (raycasting from map camera)
        }
    });

     document.addEventListener('mouseup', (event) => {
        // Handle mouse up regardless of map view to ensure flags are reset
        if (event.button === 2) {
            event.preventDefault();
            console.log("[PLAYER.JS] Right MOUSE UP detected.");
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
        // Prevent context menu only if controls are locked (FPS mode)
        if (controls && controls.isLocked && !window.isMapViewActive) {
            e.preventDefault();
        }
    });
}

function onKeyDown(event) {
    // NEW: Check for Map Toggle Key 'M'
    if (event.code === 'KeyM') {
        if (typeof window.toggleMapView === 'function') {
            window.toggleMapView();
        }
        return; // Don't process other keys if toggling map
    }

    // NEW: If map is active, ignore movement keys
    if (window.isMapViewActive) {
        return;
    }

    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': isSprinting = true; break; // Handle Left Shift for sprinting
        case 'Space':
            if (canJump && playerOnGround) {
                playerVelocity.y = PLAYER_JUMP_VELOCITY;
                playerOnGround = false;
            }
            break;
        case 'KeyE':
            if (!eKeyPressed && typeof window.requestPatchApplicationStart === 'function') {
                window.requestPatchApplicationStart();
            }
            eKeyPressed = true;
            break;
        case 'Digit9': // Dev spawn key
            if (window.enableDebugLogs && typeof window.devSpawnTheGrayNearPlayer === 'function') {
                window.devSpawnTheGrayNearPlayer();
            }
            break;
    }
}

function onKeyUp(event) {
    // No need to check for map view here, setting false is always safe
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': isSprinting = false; break; // Handle Left Shift for sprinting
        case 'KeyE':
            if (typeof window.requestPatchApplicationCancel === 'function') {
                window.requestPatchApplicationCancel();
            }
            eKeyPressed = false;
            break;
    }
}

// ... (getPlayerAABB, updatePlayer, handleShoot - NO CHANGES)
function getPlayerAABB(position) {
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number' ||
        isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
        console.error("getPlayerAABB received invalid position:", position);
        return new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    }
    if (typeof THREE === 'undefined' || typeof THREE.Box3 !== 'function' || typeof THREE.Vector3 !== 'function') {
        console.error("THREE.Box3 or THREE.Vector3 is not available in getPlayerAABB!");
        return new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
    }
    return new THREE.Box3(
        new THREE.Vector3(position.x - PLAYER_WIDTH / 2, position.y - PLAYER_COLLIDER_HEIGHT, position.z - PLAYER_DEPTH / 2),
        new THREE.Vector3(position.x + PLAYER_WIDTH / 2, position.y, position.z + PLAYER_DEPTH / 2)
    );
}

function updatePlayer(delta) {
    // This function is now only called when controls are locked and map isn't active
    if (!controls || !camera || !objects) return;

    const playerObject = controls.getObject();
    if (!playerObject) { console.error("updatePlayer: playerObject (controls.getObject()) is null."); return;}
    const playerPosition = playerObject.position;
    if (!playerPosition) { console.error("updatePlayer: playerPosition is null."); return;}

    if (!playerOnGround) playerVelocity.y += GRAVITY * delta;

    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    playerObject.getWorldDirection(cameraForward);
    cameraForward.y = 0; cameraForward.normalize();
    cameraRight.crossVectors(playerObject.up, cameraForward).normalize();

    let inputForward = 0; let inputRight = 0;
    if (moveForward) inputForward += 1; if (moveBackward) inputForward -= 1;
    if (moveLeft) inputRight -= 1; if (moveRight) inputRight += 1;

    const currentSpeed = isSprinting ? PLAYER_SPEED * SPRINT_MULTIPLIER : PLAYER_SPEED;

    const targetDx = (cameraForward.x * inputForward * currentSpeed - cameraRight.x * inputRight * currentSpeed) * delta;
    const targetDz = (cameraForward.z * inputForward * currentSpeed - cameraRight.z * inputRight * currentSpeed) * delta;
    const targetDy = playerVelocity.y * delta;

    playerPosition.x += targetDx;
    let playerAABB = getPlayerAABB(playerPosition);
    if (typeof playerAABB === 'undefined') { console.error("playerAABB is undefined after getPlayerAABB (X-axis)!"); return; }
    for (const object of objects) {
        if (!object) { console.warn("Skipping null/undefined object in X-collision"); continue; }
        if (object.userData && object.userData.isTheGray) continue;
        const objectAABB = new THREE.Box3().setFromObject(object);
        if (playerAABB.intersectsBox(objectAABB)) { playerPosition.x -= targetDx; break; }
    }

    playerPosition.z += targetDz;
    playerAABB = getPlayerAABB(playerPosition);
    if (typeof playerAABB === 'undefined') { console.error("playerAABB is undefined after getPlayerAABB (Z-axis)!"); return; }
    for (const object of objects) {
        if (!object) { console.warn("Skipping null/undefined object in Z-collision"); continue; }
        if (object.userData && object.userData.isTheGray) continue;
        const objectAABB = new THREE.Box3().setFromObject(object);
        if (playerAABB.intersectsBox(objectAABB)) { playerPosition.z -= targetDz; break; }
    }

    playerOnGround = false;
    playerPosition.y += targetDy;
    playerAABB = getPlayerAABB(playerPosition);
    if (typeof playerAABB === 'undefined') { console.error("playerAABB is undefined after getPlayerAABB (Y-axis initial)!"); return; }
    if (playerAABB.min.y < 0) {
        playerPosition.y -= playerAABB.min.y;
        if (playerVelocity.y < 0) playerVelocity.y = 0;
        playerOnGround = true;
    }
    playerAABB = getPlayerAABB(playerPosition);
    if (typeof playerAABB === 'undefined') { console.error("playerAABB is undefined after ground collision getPlayerAABB (Y-axis)!"); return; }

    for (const object of objects) {
        if (!object) { console.warn("Skipping null/undefined object in Y-collision"); continue; }
        if (object.userData && object.userData.isTheGray) continue;
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
            if (typeof playerAABB === 'undefined') { console.error("playerAABB is undefined after object collision getPlayerAABB (Y-axis)!"); return; }
            break;
        }
    }
    canJump = playerOnGround;
}

function handleShoot() {
    if (!window.controls || !window.camera || !window.objects) return;
    console.log('handleShoot() - Fired!');
    raycaster.setFromCamera(new THREE.Vector2(0, 0), window.camera);
    const intersects = raycaster.intersectObjects(window.objects, true);
    console.log("Raycast intersects:", intersects);
    if (intersects.length > 0) {
        const firstHit = intersects[0];
        console.log("First hit object:", firstHit.object);
        let targetObject = firstHit.object;

        // Traverse up the hierarchy to find the main tree group
        let treeGroup = null;
        while (targetObject) {
            if (targetObject.userData && targetObject.userData.isTree) {
                treeGroup = targetObject;
                break;
            }
            targetObject = targetObject.parent;
        }

        if (treeGroup) { // If a tree group was found
            console.log("Hit is a tree! Calling shrinkTree.");
            console.log("Tree userData:", treeGroup.userData);
            shrinkTree(treeGroup);
            return; // Stop further processing if it's a tree
        }
        if (typeof hitObject.takeDamage === 'function') {
            hitObject.takeDamage(window.SHOOT_DAMAGE || 25, 'player');
        } else if (hitObject.parent && typeof hitObject.parent.takeDamage === 'function') {
            hitObject.parent.takeDamage(window.SHOOT_DAMAGE || 25, 'player');
        } else if (hitObject.userData && typeof hitObject.userData.takeDamage === 'function') {
            hitObject.userData.takeDamage(window.SHOOT_DAMAGE || 25, 'player');
        } else if (hitObject.userData && typeof hitObject.userData.health === 'number') {
            if (window.Collisions && typeof window.Collisions.damageBlock === 'function') {
                window.Collisions.damageBlock(hitObject, window.SHOOT_DAMAGE || 25);
            } else {
                hitObject.userData.health -= (window.SHOOT_DAMAGE || 25);
                if (hitObject.material && hitObject.userData.originalColor) {
                    const healthPercent = Math.max(0, hitObject.userData.health / hitObject.userData.maxHealth);
                    hitObject.material.color.copy(hitObject.userData.originalColor).lerp(new THREE.Color(1, 0, 0), 1 - healthPercent);
                }
                if (hitObject.userData.health <= 0) {
                    if (hitObject.parent) hitObject.parent.remove(hitObject);
                    if (hitObject.geometry) hitObject.geometry.dispose();
                    if (hitObject.material) hitObject.material.dispose();
                }
            }
        }
    }
}
window.initPlayer = initPlayer;
window.updatePlayer = updatePlayer;
window.handleShoot = handleShoot;

// Function to check for collisions with pickup items
function checkPickupCollisions() {
    console.log("checkPickupCollisions entered.");
    console.log("Current window.objects:", window.objects);
    if (!controls || !window.objects) return;

    const playerCollider = getPlayerAABB(controls.getObject().position);
    console.log("Player Collider:", playerCollider.min, playerCollider.max);

    for (let i = window.objects.length - 1; i >= 0; i--) {
        const object = window.objects[i];
        console.log("Checking object:", object.name, "userData:", object.userData);
        if (object.userData && object.userData.isPickup) {
            console.log("Found pickup object:", object.name);
            const pickupCollider = new THREE.Box3().setFromObject(object);
            pickupCollider.expandByScalar(1.0); // Expand by 1.0 units in all directions (more reasonable)
            console.log("Pickup Collider (expanded):", pickupCollider.min, pickupCollider.max);
            console.log("Intersection result:", playerCollider.intersectsBox(pickupCollider));
            if (playerCollider.intersectsBox(pickupCollider)) {
                console.log("Collision detected! Calling collectPickup.");
                collectPickup(object);
            }
        }
    }
}
window.checkPickupCollisions = checkPickupCollisions;

// Player Stats (Placeholder - to be integrated with actual game logic)
let playerHealth = 100;
let playerMaxHealth = 100;
let playerWeight = 0;
let playerMaxWeight = 50;
let playerAmmo = 100;
let playerMaxAmmo = 100;
let playerWood = 0;
let playerMaxWood = 9999; // Arbitrary large number for now

// Functions to update player stats (called by other game logic)
function setPlayerHealth(value) {
    playerHealth = Math.max(0, Math.min(value, playerMaxHealth));
    updateHUD(); // Update HUD
}

function addPlayerHealth(value) {
    setPlayerHealth(playerHealth + value);
}

function removePlayerHealth(value) {
    setPlayerHealth(playerHealth - value);
}

function setPlayerWeight(value) {
    playerWeight = Math.max(0, Math.min(value, playerMaxWeight));
    updateHUD(); // Update HUD
}

function addPlayerWeight(value) {
    setPlayerWeight(playerWeight + value);
}

function removePlayerWeight(value) {
    setPlayerWeight(playerWeight - value);
}

function setPlayerAmmo(value) {
    playerAmmo = Math.max(0, Math.min(value, playerMaxAmmo));
    updateHUD(); // Update HUD
}

function addPlayerAmmo(value) {
    setPlayerAmmo(playerAmmo + value);
}

function removePlayerAmmo(value) {
    setPlayerAmmo(playerAmmo - value);
}

function addPlayerWood(value) {
    console.log(`addPlayerWood called with value: ${value}`);
    console.log(`playerWood before: ${playerWood}`);
    playerWood = Math.max(0, Math.min(playerWood + value, playerMaxWood));
    console.log(`playerWood after: ${playerWood}`);
    updateHUD();
}

// Add this function to be accessible from other modules
window.addPlayerWood = addPlayerWood;

// HUD Update Function
function updateHUD() {
    console.log("updateHUD called.");
    const healthElement = document.getElementById('hud-health');
    const weightElement = document.getElementById('hud-weight');
    const ammoElement = document.getElementById('hud-ammo');
    const woodElement = document.getElementById('hud-wood');

    console.log("woodElement:", woodElement);
    console.log("playerWood value for HUD:", playerWood);

    if (healthElement) {
        healthElement.textContent = `${playerHealth}/${playerMaxHealth}`;
    }
    if (weightElement) {
        weightElement.textContent = `${playerWeight}/${playerMaxWeight}`;
    }
    if (ammoElement) {
        ammoElement.textContent = `${playerAmmo}/${playerMaxAmmo}`;
    }
    if (woodElement) {
        woodElement.textContent = `${playerWood}`;
    }
}

// Export current stats (read-only for other modules)
Object.defineProperty(window, 'playerHealth', { get: () => playerHealth });
Object.defineProperty(window, 'playerMaxHealth', { get: () => playerMaxHealth });
Object.defineProperty(window, 'playerWeight', { get: () => playerWeight });
Object.defineProperty(window, 'playerMaxWeight', { get: () => playerMaxWeight });
Object.defineProperty(window, 'playerAmmo', { get: () => playerAmmo });
Object.defineProperty(window, 'playerMaxAmmo', { get: () => playerMaxAmmo });
Object.defineProperty(window, 'playerWood', { get: () => playerWood });
Object.defineProperty(window, 'playerMaxWood', { get: () => playerMaxWood });
