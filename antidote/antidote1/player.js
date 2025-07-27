// player.js (Rewritten from scratch for stability and clarity)

import { shrinkTree } from './tree.js';
import { collectPickup } from './pickup.js';

export class Player {
    constructor(camera, scene) {
        // --- Core Components & Constants ---
        this.camera = camera;
        this.scene = scene;
        this.objects = window.objects; 
        this.raycaster = new THREE.Raycaster();

        // Constants for easy tweaking
        this.SPEED = 5.0;
        this.JUMP_VELOCITY = 7.0;
        this.GRAVITY = -19.6;
        this.SPRINT_MULTIPLIER = 2.0;
        this.INTERACTION_RANGE = 5.0;
        this.HEIGHT = 1.8;
        this.WIDTH = 0.5;
        this.SHOOT_DAMAGE = 25; // NEW: Damage constant for shooting

        // --- State Variables ---
        this.velocity = new THREE.Vector3();
        this.onGround = false;
        this.canJump = true;

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            sprint: false,
            e_key: false,
            right_mouse: false
        };

        this.stats = {
            health: 100,
            maxHealth: 100,
            wood: 500,
            metal: 200
        };

        // --- Initialization ---
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());
        window.controls = this.controls;

        this.collider = new THREE.Box3();
        this.updateCollider();
        this.initEventListeners();
        this.updateHUD();
    }

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
            case 'KeyA': this.input.right = true; break;
            case 'KeyS': this.input.backward = true; break;
            case 'KeyD': this.input.left = true; break;
            case 'ShiftLeft': this.input.sprint = true; break;
            case 'Space':
                if (this.canJump && this.onGround) {
                    this.velocity.y = this.JUMP_VELOCITY;
                    this.onGround = false;
                }
                break;
            case 'KeyE':
                if (!this.input.e_key) this.handleInteraction();
                this.input.e_key = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.input.forward = false; break;
            case 'KeyA': this.input.right = false; break;
            case 'KeyS': this.input.backward = false; break;
            case 'KeyD': this.input.left = false; break;
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
        if (event.button === 0) this.handleShoot();
    }

    onMouseUp(event) {
        // Future use
    }

    update(delta) {
        if (!this.controls.isLocked) {
            this.velocity.x = 0;
            this.velocity.z = 0;
            return;
        }

        if (!this.onGround) {
            this.velocity.y += this.GRAVITY * delta;
        }

        const moveDirection = new THREE.Vector3(
            Number(this.input.right) - Number(this.input.left), 0,
            Number(this.input.forward) - Number(this.input.backward)
        ).normalize();

        const speed = this.input.sprint ? this.SPEED * this.SPRINT_MULTIPLIER : this.SPEED;
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const moveVector = new THREE.Vector3();
        if (moveDirection.z !== 0) {
            moveVector.add(cameraDirection.clone().multiplyScalar(moveDirection.z));
        }
        if (moveDirection.x !== 0) {
            const cameraRight = new THREE.Vector3().crossVectors(this.camera.up, cameraDirection);
            moveVector.add(cameraRight.multiplyScalar(moveDirection.x));
        }

        if (moveVector.length() > 0) moveVector.normalize().multiplyScalar(speed);
        this.velocity.x = moveVector.x;
        this.velocity.z = moveVector.z;

        const playerPosition = this.controls.getObject().position;
        playerPosition.x += this.velocity.x * delta;
        this.updateCollider();
        this.checkCollisions('x');
        playerPosition.z += this.velocity.z * delta;
        this.updateCollider();
        this.checkCollisions('z');
        this.onGround = false;
        playerPosition.y += this.velocity.y * delta;
        this.updateCollider();
        this.checkCollisions('y');

        if (this.onGround) this.velocity.y = 0;
        this.canJump = this.onGround;
        this.checkPickupCollisions();
    }

    updateCollider() {
        const pos = this.controls.getObject().position;
        this.collider.setFromCenterAndSize(
            new THREE.Vector3(pos.x, pos.y - this.HEIGHT / 2, pos.z),
            new THREE.Vector3(this.WIDTH, this.HEIGHT, this.WIDTH)
        );
    }
    
    checkCollisions(axis) {
        for (const object of this.objects) {
            if (!object.geometry || object.name === "Ground" || object === this.controls.getObject() || (object.userData && (object.userData.isTheGray || object.userData.isPickup))) {
                continue;
            }

            const objectAABB = new THREE.Box3().setFromObject(object);
            if (this.collider.intersectsBox(objectAABB)) {
                const playerPosition = this.controls.getObject().position;
                const overlap = new THREE.Vector3();
                this.collider.getCenter(overlap).sub(objectAABB.getCenter(new THREE.Vector3()));
                
                if (axis === 'y') {
                    if (this.velocity.y < 0) {
                        playerPosition.y = objectAABB.max.y + this.HEIGHT;
                        this.onGround = true;
                    } else if (this.velocity.y > 0) {
                        playerPosition.y = objectAABB.min.y - 0.01;
                    }
                    this.velocity.y = 0;
                } else {
                    const overlapX = (this.collider.max.x - this.collider.min.x) / 2 + (objectAABB.max.x - objectAABB.min.x) / 2 - Math.abs(overlap.x);
                    const overlapZ = (this.collider.max.z - this.collider.min.z) / 2 + (objectAABB.max.z - objectAABB.min.z) / 2 - Math.abs(overlap.z);
                    if (overlapX < overlapZ) {
                        if (axis === 'x') playerPosition.x += overlap.x > 0 ? overlapX : -overlapX;
                    } else {
                        if (axis === 'z') playerPosition.z += overlap.z > 0 ? overlapZ : -overlapZ;
                    }
                }
                this.updateCollider();
            }
        }
        
        if (axis === 'y' && this.collider.min.y < 0) {
            this.controls.getObject().position.y = this.HEIGHT;
            this.onGround = true;
        }
    }

    // UPDATED: This function now handles enemies as well as trees.
    handleShoot() {
        this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const intersects = this.raycaster.intersectObjects(this.objects, true);

        if (intersects.length > 0) {
            const firstHit = intersects[0].object;
            
            // Check if the hit object itself has a takeDamage method (like an enemy hit point)
            if (typeof firstHit.takeDamage === 'function') {
                firstHit.takeDamage(this.SHOOT_DAMAGE, 'player');
                return; 
            }

            // If not, check its parent (like hitting the body of The-Gray)
            if (firstHit.parent && typeof firstHit.parent.takeDamage === 'function') {
                firstHit.parent.takeDamage(this.SHOOT_DAMAGE, 'player');
                return;
            }

            // Fallback for tree logic
            let treeGroup = null;
            let currentTarget = firstHit;
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

    handleInteraction() {
        // Logic for 'E' key press, like interacting with buildings or stunned enemies
        // You can implement your interaction logic here.
        // For now, this is a stub to prevent syntax errors.
    }

    checkPickupCollisions() {
        // Optional: implement pickup collision logic here, or leave as a stub.
    }

    updateHUD() {
        // Optional: implement HUD update logic here, or leave as a stub.
    }
}