// building.js

import { UNIT_RECIPES } from './units.js';

const BUILDING_UNIT_ROLES = {
    Base: ['helper', 'scout'],
    Barracks: ['soldier'],
    Refinery: []
};

class Building {
    constructor(position, type) {
        this.position = position.clone();
        this.type = type; // e.g., 'Barracks', 'Refinery'
        this.state = 'blueprint'; // 'blueprint', 'constructing', 'complete'
        this.completionReported = false;
        this.mesh = null; // Will be created in initMesh
        this.visualGroup = new THREE.Group();
        this.animators = [];
        this.storageCapacity = {
            wood: 600,
            metal: 600,
            water: 350,
            energy: 350
        };
        this.storage = {
            wood: 0,
            metal: 0,
            water: 0,
            energy: 0
        };
        this.productionQueue = [];
        this.activeProduction = null;
        this.autoQueueTimer = 0;
        this.autoQueueIndex = 0;
        this.rallyOffset = new THREE.Vector3(8, 0, 0);
        
        this.requiredResources = {
            'Barracks': { wood: 150, metal: 50, energy: 8 },
            'Refinery': { wood: 50, metal: 200, water: 10 },
            'Base': { wood: 100, metal: 100, energy: 6, water: 6 }
        };

        this.depositedResources = {
            wood: 0,
            metal: 0,
            water: 0,
            energy: 0
        };

        this.initMesh();
    }

    initMesh() {
        const geometry = new THREE.BoxGeometry(5.8, 0.35, 5.8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x6de7dc,
            emissive: 0x1f6b68,
            emissiveIntensity: 0.85,
            transparent: true,
            opacity: 0.38,
            roughness: 0.35,
            metalness: 0.22
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.add(this.visualGroup);
        
        // Link the mesh back to this class instance for interaction
        this.mesh.userData.isBlueprint = true;
        this.mesh.userData.isBuildingSolid = true;
        this.mesh.userData.building = this; 
        this.buildBlueprintVisual();
    }

    clearVisuals() {
        while (this.visualGroup.children.length > 0) {
            const child = this.visualGroup.children.pop();
            this.visualGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
                else child.material.dispose();
            }
        }
        this.animators = [];
    }

    addPylon(x, z, height, color) {
        const pylon = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, height, 0.35),
            new THREE.MeshStandardMaterial({
                color: 0x9ae7ff,
                emissive: color,
                emissiveIntensity: 0.7,
                roughness: 0.3,
                metalness: 0.7
            })
        );
        pylon.position.set(x, height / 2, z);
        pylon.castShadow = true;
        this.visualGroup.add(pylon);
        this.animators.push({
            mesh: pylon,
            phase: Math.random() * Math.PI * 2,
            type: 'pulse'
        });
    }

    buildBlueprintVisual() {
        this.clearVisuals();

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(2.25, 0.08, 12, 40),
            new THREE.MeshBasicMaterial({ color: 0x8af9ff, transparent: true, opacity: 0.75 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.28;
        this.visualGroup.add(ring);
        this.animators.push({ mesh: ring, phase: Math.random() * Math.PI * 2, type: 'spin' });

        const beacon = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.55, 6.5, 10, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xa9ffff, transparent: true, opacity: 0.24, side: THREE.DoubleSide })
        );
        beacon.position.y = 3.1;
        this.visualGroup.add(beacon);
        this.animators.push({ mesh: beacon, phase: Math.random() * Math.PI * 2, type: 'beacon' });

        this.addPylon(-2.1, -2.1, 2.4, 0x59fff0);
        this.addPylon(2.1, -2.1, 2.8, 0x59fff0);
        this.addPylon(-2.1, 2.1, 2.7, 0x59fff0);
        this.addPylon(2.1, 2.1, 2.2, 0x59fff0);
    }

    buildBaseVisual() {
        const baseDeck = new THREE.Mesh(
            new THREE.CylinderGeometry(2.8, 3.3, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x6d8d78, roughness: 0.7, metalness: 0.16 })
        );
        baseDeck.position.y = 0.7;
        baseDeck.castShadow = true;
        this.visualGroup.add(baseDeck);

        const dome = new THREE.Mesh(
            new THREE.CylinderGeometry(2.2, 2.6, 2.4, 8),
            new THREE.MeshStandardMaterial({ color: 0xdbe9dd, roughness: 0.4, metalness: 0.3 })
        );
        dome.position.y = 2.3;
        dome.castShadow = true;
        this.visualGroup.add(dome);

        const cap = new THREE.Mesh(
            new THREE.ConeGeometry(1.75, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x7effd1, emissive: 0x146f58, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.35 })
        );
        cap.position.y = 4.1;
        cap.castShadow = true;
        this.visualGroup.add(cap);

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const node = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 2.3, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x32564d, emissive: 0x58e9bc, emissiveIntensity: 0.5, roughness: 0.45 })
            );
            node.position.set(Math.cos(angle) * 2.2, 1.5, Math.sin(angle) * 2.2);
            node.castShadow = true;
            this.visualGroup.add(node);
        }
    }

    buildBarracksVisual() {
        const foundation = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 1.1, 4.4),
            new THREE.MeshStandardMaterial({ color: 0x5b6557, roughness: 0.85, metalness: 0.1 })
        );
        foundation.position.y = 0.6;
        foundation.castShadow = true;
        this.visualGroup.add(foundation);

        const body = new THREE.Mesh(
            new THREE.BoxGeometry(4.6, 2.5, 3.8),
            new THREE.MeshStandardMaterial({ color: 0xaab89e, roughness: 0.55, metalness: 0.22 })
        );
        body.position.y = 2.2;
        body.castShadow = true;
        this.visualGroup.add(body);

        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(3.3, 1.8, 4),
            new THREE.MeshStandardMaterial({ color: 0x394536, roughness: 0.8, metalness: 0.08 })
        );
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 4.0;
        roof.castShadow = true;
        this.visualGroup.add(roof);

        const signal = new THREE.Mesh(
            new THREE.BoxGeometry(0.35, 3.2, 0.35),
            new THREE.MeshStandardMaterial({ color: 0x31524b, emissive: 0x91ffe7, emissiveIntensity: 0.6, roughness: 0.25 })
        );
        signal.position.set(2.1, 3.2, -1.6);
        signal.castShadow = true;
        this.visualGroup.add(signal);
    }

    buildRefineryVisual() {
        const pad = new THREE.Mesh(
            new THREE.BoxGeometry(5.2, 0.9, 5.2),
            new THREE.MeshStandardMaterial({ color: 0x4d514e, roughness: 0.9, metalness: 0.15 })
        );
        pad.position.y = 0.45;
        pad.castShadow = true;
        this.visualGroup.add(pad);

        const tankA = new THREE.Mesh(
            new THREE.CylinderGeometry(1.05, 1.2, 3.5, 16),
            new THREE.MeshStandardMaterial({ color: 0xb4c0bb, roughness: 0.35, metalness: 0.65 })
        );
        tankA.position.set(-1.2, 2.0, 0);
        tankA.castShadow = true;
        this.visualGroup.add(tankA);

        const tankB = tankA.clone();
        tankB.position.x = 1.25;
        this.visualGroup.add(tankB);

        const stack = new THREE.Mesh(
            new THREE.CylinderGeometry(0.38, 0.48, 5.3, 12),
            new THREE.MeshStandardMaterial({ color: 0x2f3434, roughness: 0.8, metalness: 0.45 })
        );
        stack.position.set(0, 3.1, -1.55);
        stack.castShadow = true;
        this.visualGroup.add(stack);

        const pipe = new THREE.Mesh(
            new THREE.TorusGeometry(1.4, 0.15, 8, 22, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x89f0dd, emissive: 0x2ea38d, emissiveIntensity: 0.75, roughness: 0.3, metalness: 0.55 })
        );
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(0, 2.3, 1.4);
        this.visualGroup.add(pipe);
        this.animators.push({ mesh: pipe, phase: Math.random() * Math.PI * 2, type: 'pulse' });
    }

    buildCompleteVisual() {
        this.clearVisuals();
        if (this.type === 'Base') this.buildBaseVisual();
        else if (this.type === 'Barracks') this.buildBarracksVisual();
        else if (this.type === 'Refinery') this.buildRefineryVisual();
    }

    // NEW METHOD: Handles taking resources from the player
    depositResources(player) {
        if (!player) return;

        if (this.state === 'complete') {
            this.depositToStorageFromPlayer(player);
            return;
        }

        if (this.state !== 'blueprint') return;

        console.log("Attempting to deposit resources...");
        const required = this.requiredResources[this.type];
        let depositedSomething = false;

        for (const resource in required) {
            if (player[resource] > 0) {
                const needed = required[resource] - this.depositedResources[resource];
                if (needed > 0) {
                    const amountToDeposit = Math.min(player[resource], needed);
                    
                    this.depositedResources[resource] += amountToDeposit;
                    player[resource] -= amountToDeposit;
                    
                    console.log(`Deposited ${amountToDeposit} ${resource}.`);
                    depositedSomething = true;
                }
            }
        }

        if (depositedSomething) {
            this.updateAppearance();
            this.checkCompletion();
        }
    }

    depositToStorage(resource, amount) {
        if (this.state !== 'complete') return 0;
        if (typeof this.storage[resource] !== 'number' || typeof amount !== 'number' || amount <= 0) return 0;
        const capacity = this.storageCapacity[resource] ?? Number.POSITIVE_INFINITY;
        const free = Math.max(0, capacity - this.storage[resource]);
        const accepted = Math.min(free, amount);
        this.storage[resource] += accepted;
        return accepted;
    }

    depositToStorageFromPlayer(player) {
        const resources = ['wood', 'metal', 'water', 'energy'];
        let totalMoved = 0;

        resources.forEach((resource) => {
            if (typeof player[resource] !== 'number' || player[resource] <= 0) return;
            const accepted = this.depositToStorage(resource, player[resource]);
            if (accepted > 0) {
                player[resource] -= accepted;
                totalMoved += accepted;
            }
        });

        if (totalMoved > 0 && typeof window.pushGameNotice === 'function') {
            window.pushGameNotice(`${this.type} storage +${totalMoved} resources`, 'info');
        }
    }

    canPayRecipe(recipe) {
        const resources = ['wood', 'metal', 'water', 'energy'];
        return resources.every((resource) => {
            const required = recipe[resource] ?? 0;
            return this.storage[resource] >= required;
        });
    }

    payRecipe(recipe) {
        const resources = ['wood', 'metal', 'water', 'energy'];
        resources.forEach((resource) => {
            const required = recipe[resource] ?? 0;
            if (required > 0) {
                this.storage[resource] = Math.max(0, this.storage[resource] - required);
            }
        });
    }

    queueUnit(unitType, isAuto = false) {
        if (this.state !== 'complete') return false;

        const allowedUnits = BUILDING_UNIT_ROLES[this.type] || [];
        if (!allowedUnits.includes(unitType)) return false;

        if (this.productionQueue.length >= 5) return false;

        const recipe = UNIT_RECIPES[unitType];
        if (!recipe) return false;
        if (!this.canPayRecipe(recipe)) return false;

        this.payRecipe(recipe);
        this.productionQueue.push({
            unitType,
            timeRemaining: recipe.buildTime
        });

        if (!isAuto && typeof window.pushGameNotice === 'function') {
            window.pushGameNotice(`${this.type} queued ${unitType}.`, 'info');
        }
        return true;
    }

    getSpawnPosition() {
        const angle = Math.random() * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        return new THREE.Vector3(
            this.position.x + Math.cos(angle) * radius,
            this.position.y,
            this.position.z + Math.sin(angle) * radius
        );
    }

    updateProduction(delta) {
        if (this.state !== 'complete') return;

        this.autoQueueTimer -= delta;
        if (this.autoQueueTimer <= 0) {
            this.autoQueueTimer = 2.0;

            const roles = BUILDING_UNIT_ROLES[this.type] || [];
            if (roles.length > 0 && this.productionQueue.length < 2 && !this.activeProduction) {
                const role = roles[this.autoQueueIndex % roles.length];
                if (this.queueUnit(role, true)) {
                    this.autoQueueIndex += 1;
                }
            }
        }

        if (!this.activeProduction && this.productionQueue.length > 0) {
            this.activeProduction = this.productionQueue.shift();
        }

        if (!this.activeProduction) return;

        this.activeProduction.timeRemaining -= delta;
        if (this.activeProduction.timeRemaining <= 0) {
            const spawnPos = this.getSpawnPosition();
            if (typeof window.spawnPlayerUnit === 'function') {
                window.spawnPlayerUnit(this.activeProduction.unitType, spawnPos, this);
            }
            if (typeof window.pushGameNotice === 'function') {
                window.pushGameNotice(`${this.type} deployed ${this.activeProduction.unitType}.`, 'success');
            }
            this.activeProduction = null;
        }
    }
    
    updateAppearance() {
        const required = this.requiredResources[this.type];
        const totalRequired = Object.values(required).reduce((a, b) => a + b, 0);
        const totalDeposited = Object.values(this.depositedResources).reduce((a, b) => a + b, 0);
        
        if (totalRequired > 0) {
            const progress = totalDeposited / totalRequired;
            this.mesh.material.opacity = 0.5 + (0.5 * progress);
            this.mesh.material.emissiveIntensity = 0.45 + (0.45 * progress);
        }
    }

    checkCompletion() {
        const required = this.requiredResources[this.type];
        const isComplete = Object.keys(required).every(
            resource => this.depositedResources[resource] >= required[resource]
        );

        if (isComplete) {
            this.finishConstruction(false);
        }
    }

    finishConstruction(silent = false) {
        this.state = 'complete';
        this.mesh.userData.isBlueprint = false; // No longer a blueprint
        this.mesh.material.color.set(0x3f5248);
        this.mesh.material.emissive.set(0x0d1714);
        this.mesh.material.emissiveIntensity = 0.18;
        this.mesh.material.opacity = 0.16;
        const buildingGeometry = new THREE.BoxGeometry(6.2, 8.2, 6.2);
        this.mesh.geometry.dispose();
        this.mesh.geometry = buildingGeometry;
        this.buildCompleteVisual();
        if (!silent && !this.completionReported && typeof window.onBuildingCompleted === 'function') {
            this.completionReported = true;
            window.onBuildingCompleted(this.type);
        } else if (silent) {
            this.completionReported = true;
        }
        console.log(`${this.type} construction complete!`);
    }

    update(delta, elapsedTime) {
        this.updateProduction(delta);

        this.animators.forEach((animator) => {
            if (!animator.mesh) return;
            if (animator.type === 'spin') {
                animator.mesh.rotation.z += delta * 0.65;
            } else if (animator.type === 'beacon') {
                animator.mesh.scale.y = 0.92 + Math.sin(elapsedTime * 2.4 + animator.phase) * 0.08;
                animator.mesh.material.opacity = 0.2 + Math.sin(elapsedTime * 2.2 + animator.phase) * 0.06;
            } else if (animator.type === 'pulse') {
                animator.mesh.material.emissiveIntensity = 0.55 + Math.sin(elapsedTime * 3.0 + animator.phase) * 0.2;
            }
        });
    }
}

export { Building };
