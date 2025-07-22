// player.js - Handles player state, controls, movement, and input

// --- PLAYER CONSTANTS ---
const PLAYER_COLLIDER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const PLAYER_DEPTH = 0.6;
const PLAYER_SPEED = 8.0;
const SPRINT_MULTIPLIER = 3; // Player moves 29 times faster when sprinting
const PLAYER_JUMP_VELOCITY = 7.0;
const GRAVITY = -19.6;
const SHOOT_DAMAGE = 25;
window.GRAVITY = GRAVITY;
window.SHOOT_DAMAGE = SHOOT_DAMAGE;

const INTERACTION_RANGE = 5; // Max distance to interact with objects

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
window.rightMouseDown = rightMouseDown;
let isSprinting = false; // New variable for sprint mechanic

let playerInventory = { wood: 0, stone: 0 };
window.playerInventory = playerInventory;

// --- CORE COMPONENTS ---
let camera;
let controls;
let scene;
let objects;
let debugControlsLockElement;
let raycaster;

function initPlayer(_camera, _scene) {
    if (typeof window.debugLog === 'function') window.debugLog("Initializing Player...");
    else console.log("Initializing Player (debugLog not found)....");

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
                // Left click - Shoot or Pickup
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
                const intersects = raycaster.intersectObjects(window.objects, true);
                if (intersects.length > 0) {
                    const firstHit = intersects[0];
                    const hitObject = firstHit.object;

                    if (hitObject.userData && hitObject.userData.isResource && hitObject.userData.type === 'wood') {
                        // Pickup wood resource
                        pickupResource(hitObject);
                    } else if (hitObject.userData && hitObject.userData.isBoulder) {
                        // Damage boulder
                        if (typeof window.Boulders.damageBoulder === 'function') {
                            window.Boulders.damageBoulder(hitObject);
                        }
                    } else {
                        // Shoot
                        if (typeof window.handleShoot === 'function') window.handleShoot();
                    }
                } else {
                    // No hit, just shoot (if that's the default behavior)
                    if (typeof window.handleShoot === 'function') window.handleShoot();
                }
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

function pickupResource(resourceMesh) {
    if (!resourceMesh.userData.isResource) return;

    const resourceType = resourceMesh.userData.type;
    const resourceValue = resourceMesh.userData.value || 1;

    if (window.playerInventory[resourceType] !== undefined) {
        window.playerInventory[resourceType] += resourceValue;
        console.log(`Picked up ${resourceValue} ${resourceType}. Total: ${window.playerInventory[resourceType]}`);
        // Update HUD
        if (typeof window.updateHUD === 'function') {
            window.updateHUD(null, null, window.playerInventory.wood, window.playerInventory.stone); // Pass wood and stone count
        }
    } else {
        console.warn(`Unknown resource type: ${resourceType}`);
    }

    // Remove resource from scene
    scene.remove(resourceMesh);
    const index = objects.indexOf(resourceMesh);
    if (index > -1) objects.splice(index, 1);
    if (resourceMesh.geometry) resourceMesh.geometry.dispose();
    if (resourceMesh.material) resourceMesh.material.dispose();
}

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

function findClosestBlueprint() {
    let closestBlueprint = null;
    let minDistance = Infinity;

    const playerPosition = controls.getObject().position;

    for (const obj of objects) {
        if (obj.userData && obj.userData.isBlueprint && !obj.userData.isComplete) {
            const distance = playerPosition.distanceTo(obj.position);
            if (distance < INTERACTION_RANGE && distance < minDistance) {
                minDistance = distance;
                closestBlueprint = obj;
            }
        }
    }
    return closestBlueprint;
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
        switch (event.code) {
            case 'KeyB':
                if (typeof window.RadialMenu.showRadialMenu === 'function') {
                    // Show the radial menu in the center of the screen
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    window.RadialMenu.showRadialMenu(centerX, centerY, (blueprintType) => {
                        window.BuildManager.setSelectedBlueprintType(blueprintType);
                    });
                }
                break;
            // Add other map-view-only keys here in the future
        }
        return; // Ignore movement keys
    }

    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': isSprinting = true; break; // Sprint
        case 'Space':
            if (canJump && playerOnGround) {
                playerVelocity.y = PLAYER_JUMP_VELOCITY;
                playerOnGround = false;
            }
            break;
        case 'KeyE':
            // Handle resource deposit for blueprints
            const blueprint = findClosestBlueprint();
            if (blueprint && typeof window.BaseBuilding.depositResources === 'function') {
                let depositedWood = 0;
                let depositedStone = 0;

                // Deposit wood
                if (window.playerInventory.wood > 0) {
                    const amountToDeposit = Math.min(window.playerInventory.wood, blueprint.userData.requiredWood - blueprint.userData.woodDeposited);
                    if (amountToDeposit > 0) {
                        depositedWood = window.BaseBuilding.depositResources(blueprint, 'wood', amountToDeposit);
                        window.playerInventory.wood -= depositedWood;
                    }
                }

                // Deposit stone
                if (window.playerInventory.stone > 0) {
                    const amountToDeposit = Math.min(window.playerInventory.stone, blueprint.userData.requiredStone - blueprint.userData.stoneDeposited);
                    if (amountToDeposit > 0) {
                        depositedStone = window.BaseBuilding.depositResources(blueprint, 'stone', amountToDeposit);
                        window.playerInventory.stone -= depositedStone;
                    }
                }

                if (depositedWood > 0 || depositedStone > 0) {
                    console.log(`Deposited ${depositedWood} wood and ${depositedStone} stone into blueprint.`);
                    if (typeof window.updateHUD === 'function') {
                        window.updateHUD(null, null, window.playerInventory.wood, window.playerInventory.stone);
                    }
                } else {
                    console.log("No resources to deposit or blueprint already complete.");
                }
            } else if (!eKeyPressed && typeof window.requestPatchApplicationStart === 'function') {
                // Existing E key logic (for curing mechanic)
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
        case 'ShiftLeft': isSprinting = false; break; // Stop Sprint
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
    console.log('handleShoot() - Fired! SHOOT_DAMAGE:', window.SHOOT_DAMAGE);
    raycaster.setFromCamera(new THREE.Vector2(0, 0), window.camera);
    const intersects = raycaster.intersectObjects(window.objects, true);
    if (intersects.length > 0) {
        const firstHit = intersects[0];
        const hitObject = firstHit.object;

        if (hitObject.userData && hitObject.userData.isTree) {
            if (typeof window.Trees.damageTree === 'function') {
                window.Trees.damageTree(hitObject, window.SHOOT_DAMAGE || 25);
            }
        } else if (typeof hitObject.takeDamage === 'function') {
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