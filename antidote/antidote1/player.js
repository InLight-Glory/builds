// player.js (Rewritten from scratch for stability and clarity)

// This script encapsulates all logic for the player character, including:
// - First-person controls using PointerLockControls
// - Physics-based movement (WASD, sprint, jump) with gravity
// - Collision detection with the environment
// - Interactions with other game objects (shooting, collecting, building)
// - Managing player state (health, inventory) and updating the HUD

import { shrinkTree } from './tree.js';
import { collectPickup } from './pickup.js';
import { checkFloorCollision, checkWallCollision, updateColliderFromPose } from './collisions.js';

const SHOOT_DAMAGE = 25;

// --- Player Class ---
// Using a class organizes all related variables and functions, preventing global scope pollution
// and making the code easier to manage and debug.
class Player {
    constructor(camera, scene) {
        // --- Core Components & Constants ---
        this.camera = camera;
        this.scene = scene;
        this.objects = window.objects; // Reference to the global list of collidable objects
        this.getObjects = () => (typeof window.getCollidableObjects === 'function' ? window.getCollidableObjects() : window.objects);
        this.raycaster = new THREE.Raycaster();

        // Constants for easy tweaking
        this.SPEED = 5.0;
        this.JUMP_VELOCITY = 7.0;
        this.GRAVITY = -19.6;
        this.SPRINT_MULTIPLIER = 2.0;
        this.INTERACTION_RANGE = 5.0;
        this.HEIGHT = 1.8;
        this.WIDTH = 0.5;

        // --- State Variables ---
        this.velocity = new THREE.Vector3();
        this.onGround = false;
        this.canJump = true;
        this.walkCycle = 0;
        this.viewKick = 0;

        // Input state flags
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            e_key: false,
            right_mouse: false
        };

        // Player stats and inventory
        this.stats = {
            health: 100,
            maxHealth: 100,
            wood: 500,
            metal: 200,
            water: 50,
            energy: 50
        };

        // --- Initialization ---
        // Set up PointerLockControls for FPS view
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());
        window.rightMouseDown = false;
        this.viewModel = this.createViewModel();
        this.camera.add(this.viewModel);
        
        // Expose a reference to the controls for other scripts (like main.js)
        window.controls = this.controls;

        // Create the player's collision bounding box
        this.collider = new THREE.Box3();
        this.body = {
            size: new THREE.Vector3(this.WIDTH, this.HEIGHT, this.WIDTH),
            centerOffset: new THREE.Vector3(0, -this.HEIGHT / 2, 0)
        };
        this.updateCollider();

        // Set up all event listeners for input
        this.initEventListeners();

        // Perform initial HUD update
        this.updateHUD();
    }

    // --- Event Listeners ---
    // Centralizes all input handling setup
    initEventListeners() {
        document.addEventListener('click', () => {
            if (!this.controls.isLocked && !window.isMapViewActive) {
                this.controls.lock();
            }
        });

        this.controls.addEventListener('lock', () => {
            document.body.classList.add('pointer-lock-active');
        });

        this.controls.addEventListener('unlock', () => {
            document.body.classList.remove('pointer-lock-active');
            // Reset input states on unlock to prevent sticky keys
            Object.keys(this.input).forEach(key => this.input[key] = false);
        });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    }

    onKeyDown(event) {
        if (event.code === 'KeyM') {
            if (typeof window.toggleMapView === 'function') window.toggleMapView();
            return;
        }
        if (window.isMapViewActive) return;

        switch (event.code) {
            case 'KeyW': this.input.forward = true; break;
            case 'KeyA': this.input.left = true; break;
            case 'KeyS': this.input.backward = true; break;
            case 'KeyD': this.input.right = true; break;
            case 'ShiftLeft': this.input.sprint = true; break;
            case 'KeyR':
                if (typeof window.requestRestorationPulse === 'function') {
                    const result = window.requestRestorationPulse(this.stats);
                    if (result && result.message) {
                        window.lastInteractionMessage = result.message;
                    }
                    this.updateHUD();
                }
                break;
            case 'Space':
                if (this.canJump && this.onGround) {
                    this.velocity.y = this.JUMP_VELOCITY;
                    this.onGround = false;
                }
                break;
            case 'KeyE':
                if (!this.input.e_key) {
                    this.handleInteraction();
                }
                this.input.e_key = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.input.forward = false; break;
            case 'KeyA': this.input.left = false; break;
            case 'KeyS': this.input.backward = false; break;
            case 'KeyD': this.input.right = false; break;
            case 'ShiftLeft': this.input.sprint = false; break;
            case 'KeyE':
                if (typeof window.requestPatchApplicationCancel === 'function') {
                    window.requestPatchApplicationCancel();
                }
                this.input.e_key = false;
                break;
        }
    }

    onMouseDown(event) {
        if (!this.controls.isLocked || window.isMapViewActive) return;

        if (window.unitSystem && typeof window.unitSystem.handlePointerDown === 'function') {
            const consumed = window.unitSystem.handlePointerDown(event, {
                camera: this.camera,
                isMapView: false
            });
            if (consumed) {
                event.preventDefault();
                return;
            }
        }

        if (event.button === 0) { // Left Click
            this.handleShoot();
        } else if (event.button === 2) { // Right Click
            event.preventDefault();
            this.input.right_mouse = true;
            window.rightMouseDown = true;
            if (typeof window.applyAntidotePulse === 'function') {
                const patchTarget = this.findPatchTarget();
                if (patchTarget) {
                    window.applyAntidotePulse(patchTarget);
                }
            }
        }
    }

    onMouseUp(event) {
        if (event.button === 2) {
            this.input.right_mouse = false;
            window.rightMouseDown = false;
            if (typeof window.requestAntidoteStop === 'function') {
                window.requestAntidoteStop();
            }
        }
    }

    // --- Core Update Loop (called from main.js) ---
    update(delta) {
        if (!this.controls.isLocked) {
            // Ensure velocity doesn't carry over when paused
            this.velocity.x = 0;
            this.velocity.z = 0;
            return;
        }

        // Apply gravity
        if (!this.onGround) {
            this.velocity.y += this.GRAVITY * delta;
        }

        // --- Movement Calculation (Stable & Non-Mutating) ---
        const moveDirection = new THREE.Vector3(
            Number(this.input.right) - Number(this.input.left),
            0,
            Number(this.input.forward) - Number(this.input.backward)
        ).normalize();

        const speed = this.input.sprint ? this.SPEED * this.SPRINT_MULTIPLIER : this.SPEED;
        
        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        // Calculate movement vector relative to camera
        const moveVector = new THREE.Vector3();
        if (moveDirection.z !== 0) {
            moveVector.add(cameraDirection.clone().multiplyScalar(moveDirection.z));
        }
        if (moveDirection.x !== 0) {
            const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, this.camera.up);
            moveVector.add(cameraRight.multiplyScalar(moveDirection.x));
        }

        // Normalize to prevent faster diagonal movement, then apply speed
        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(speed);
        }

        this.velocity.x = moveVector.x;
        this.velocity.z = moveVector.z;
        
        // --- Collision Detection ---
        this.objects = this.getObjects() || [];
        const playerPosition = this.controls.getObject().position;

        // Move and check X axis
        playerPosition.x += this.velocity.x * delta;
        this.updateCollider();
        checkWallCollision(this.collider, this.objects, {
            axis: 'x',
            position: playerPosition,
            velocity: this.velocity,
            body: this.body,
            self: this.controls.getObject(),
            collideWithEnemies: true,
            getGroundHeight: window.getTerrainHeightAt
        });

        // Move and check Z axis
        playerPosition.z += this.velocity.z * delta;
        this.updateCollider();
        checkWallCollision(this.collider, this.objects, {
            axis: 'z',
            position: playerPosition,
            velocity: this.velocity,
            body: this.body,
            self: this.controls.getObject(),
            collideWithEnemies: true,
            getGroundHeight: window.getTerrainHeightAt
        });
        
        // Move and check Y axis (gravity/jumping)
        this.onGround = false;
        playerPosition.y += this.velocity.y * delta;
        this.updateCollider();
        const floorHit = checkFloorCollision(this.collider, this.objects, {
            position: playerPosition,
            velocity: this.velocity,
            body: this.body,
            self: this.controls.getObject(),
            collideWithEnemies: true,
            getGroundHeight: window.getTerrainHeightAt
        });
        this.onGround = !!floorHit.hitGround;

        // Check if on ground after all collisions are resolved
        if (this.onGround) {
            this.velocity.y = 0;
        }
        this.canJump = this.onGround;

        // Check for pickups
        this.checkPickupCollisions();
        this.updateViewModel(delta, moveVector.length());
    }

    createViewModel() {
        const rig = new THREE.Group();
        rig.position.set(0.55, -0.62, -1.05);

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.24, 0.22, 0.95),
            new THREE.MeshStandardMaterial({
                color: 0x2b3531,
                roughness: 0.55,
                metalness: 0.52
            })
        );
        body.rotation.y = -0.12;
        rig.add(body);

        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.055, 0.8, 12),
            new THREE.MeshStandardMaterial({
                color: 0xa4b5ac,
                roughness: 0.3,
                metalness: 0.78
            })
        );
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(0.02, 0.02, -0.68);
        rig.add(barrel);

        const vial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.055, 0.32, 10),
            new THREE.MeshStandardMaterial({
                color: 0x7bffe1,
                emissive: 0x3bcab1,
                emissiveIntensity: 0.85,
                transparent: true,
                opacity: 0.82,
                roughness: 0.12,
                metalness: 0.18
            })
        );
        vial.position.set(-0.05, 0.12, -0.1);
        rig.add(vial);
        rig.userData.vial = vial;

        const grip = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.4, 0.2),
            new THREE.MeshStandardMaterial({
                color: 0x584836,
                roughness: 0.88,
                metalness: 0.05
            })
        );
        grip.position.set(-0.04, -0.28, 0.1);
        grip.rotation.z = 0.2;
        rig.add(grip);

        return rig;
    }

    updateViewModel(delta, movementMagnitude) {
        if (!this.viewModel) return;
        const isMoving = movementMagnitude > 0.05 && this.onGround;
        if (isMoving) {
            this.walkCycle += delta * (this.input.sprint ? 11 : 7);
        }

        const bobX = isMoving ? Math.sin(this.walkCycle) * 0.018 : 0;
        const bobY = isMoving ? Math.abs(Math.cos(this.walkCycle * 0.5)) * 0.025 : 0;
        this.viewKick = Math.max(0, this.viewKick - delta * 5.5);

        this.viewModel.position.x = 0.55 + bobX;
        this.viewModel.position.y = -0.62 - bobY + this.viewKick * 0.05;
        this.viewModel.rotation.z = -0.06 + bobX * 1.6 - this.viewKick * 0.12;
        this.viewModel.rotation.x = -0.08 + bobY * 0.6 + this.viewKick * 0.18;

        if (this.viewModel.userData.vial) {
            this.viewModel.userData.vial.material.emissiveIntensity = 0.7 + Math.sin(performance.now() * 0.004) * 0.18;
        }
    }

    // --- Collision Logic ---
    updateCollider() {
        const pos = this.controls.getObject().position;
        updateColliderFromPose(this.collider, pos, this.body.size, this.body.centerOffset);
    }

    // --- Interaction Logic ---
    handleShoot() {
        this.viewKick = Math.min(1, this.viewKick + 0.65);
        this.objects = this.getObjects() || [];
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, true);
        if (intersects.length > 0) {
            let hitObject = intersects[0].object;
            // Traverse up to find a parent with specific userData if needed
            if (typeof hitObject.takeDamage === 'function') {
                hitObject.takeDamage(SHOOT_DAMAGE, 'player');
            } else if (hitObject.parent && typeof hitObject.parent.takeDamage === 'function') {
                hitObject.parent.takeDamage(SHOOT_DAMAGE, 'player');
            } else {
                 // Check if it's a tree
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
                }
            }
        }
    }

    findPatchTarget() {
        this.objects = this.getObjects() || [];
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, true);
        for (const hit of intersects) {
            const obj = hit.object;
            if (obj && obj.userData && obj.userData.isSubdueRect && obj.userData.parentGray) {
                return obj.userData.parentGray;
            }
        }
        return null;
    }

    handleInteraction() {
        const playerPosition = this.controls.getObject().position;
        let closestBuilding = null;
        let minDistanceSq = this.INTERACTION_RANGE * this.INTERACTION_RANGE;

        if (window.buildings) {
            for (const building of window.buildings) {
                const distanceSq = playerPosition.distanceToSquared(building.position);
                if (distanceSq < minDistanceSq) {
                    minDistanceSq = distanceSq;
                    closestBuilding = building;
                }
            }
        }

        if (closestBuilding) {
            if (typeof closestBuilding.depositResources === 'function') {
                closestBuilding.depositResources(this.stats);
                this.updateHUD();
            }

            if (closestBuilding.state === 'complete' && typeof closestBuilding.queueUnit === 'function') {
                let queued = false;
                if (closestBuilding.type === 'Base') {
                    const typeToQueue = this.input.sprint ? 'scout' : 'helper';
                    queued = closestBuilding.queueUnit(typeToQueue);
                } else if (closestBuilding.type === 'Barracks') {
                    queued = closestBuilding.queueUnit('soldier');
                }

                if (queued && typeof window.pushGameNotice === 'function') {
                    window.pushGameNotice(`${closestBuilding.type} accepted production order.`, 'success');
                }
            }
        } else {
            // Fallback to curing mechanic if no building is in range
            if (typeof window.requestPatchApplicationStart === 'function') {
                window.requestPatchApplicationStart();
            }
        }
    }

    checkPickupCollisions() {
        this.objects = this.getObjects() || [];
        this.updateCollider();
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const object = this.objects[i];
            if (object.userData && object.userData.isPickup) {
                const pickupCollider = new THREE.Box3().setFromObject(object);
                if (this.collider.intersectsBox(pickupCollider)) {
                    collectPickup(object, this.stats);
                    this.updateHUD();
                }
            }
        }
    }

    // --- HUD Update ---
    updateHUD() {
        const woodElement = document.getElementById('hud-wood');
        const metalElement = document.getElementById('hud-metal');
        const waterElement = document.getElementById('hud-water');
        const energyElement = document.getElementById('hud-energy');
        if (woodElement) woodElement.textContent = this.stats.wood;
        if (metalElement) metalElement.textContent = this.stats.metal;
        if (waterElement) waterElement.textContent = this.stats.water;
        if (energyElement) energyElement.textContent = this.stats.energy;
        // Add other HUD elements here (health, ammo, etc.)
    }
}


// --- Global Integration ---
// This part ensures the new class works with your existing `main.js` file
let playerInstance;

function initPlayer(camera, scene) {
    playerInstance = new Player(camera, scene);
    // Expose the player instance globally if other scripts need deep access
    window.playerInstance = playerInstance; 
}

function updatePlayer(delta) {
    if (playerInstance) {
        playerInstance.update(delta);
    }
}

// Attach to window object to be called from main.js
window.initPlayer = initPlayer;
window.updatePlayer = updatePlayer;
