// units.js
// Player-controlled helper, scout, and soldier units with basic steering and command logic.

import {
    registerWorldObject,
    unregisterWorldObject,
    registerUnit,
    unregisterUnit,
    getSelectedUnits,
    clearUnitSelection,
    setSelectedUnits,
    getTerrainHeightAt
} from './runtime_state.js';

const UNIT_STATS = {
    helper: {
        speed: 4.6,
        maxHealth: 80,
        radius: 0.45,
        gatherRadius: 1.2,
        gatherCooldown: 0.6,
        gatherAmount: 1
    },
    scout: {
        speed: 6.1,
        maxHealth: 70,
        radius: 0.4,
        visionRadius: 26
    },
    soldier: {
        speed: 5.2,
        maxHealth: 120,
        radius: 0.5,
        attackRange: 2.4,
        attackCooldown: 0.85,
        attackDamage: 18
    }
};

export const UNIT_RECIPES = {
    helper: { wood: 25, metal: 10, energy: 0, water: 0, buildTime: 7 },
    scout: { wood: 20, metal: 20, energy: 3, water: 0, buildTime: 9 },
    soldier: { wood: 40, metal: 35, energy: 4, water: 0, buildTime: 11 }
};

function createUnitMaterial(type) {
    if (type === 'soldier') {
        return new THREE.MeshStandardMaterial({ color: 0x9ab6aa, roughness: 0.42, metalness: 0.42 });
    }
    if (type === 'scout') {
        return new THREE.MeshStandardMaterial({ color: 0x9ce7cf, roughness: 0.35, metalness: 0.22 });
    }
    return new THREE.MeshStandardMaterial({ color: 0xc9b48a, roughness: 0.65, metalness: 0.1 });
}

function createUnitMesh(type) {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(type === 'soldier' ? 0.42 : 0.34, type === 'soldier' ? 1.0 : 0.85, 5, 9),
        createUnitMaterial(type)
    );
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 1.05;
    group.add(body);

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshStandardMaterial({
            color: type === 'soldier' ? 0x72ffc9 : type === 'scout' ? 0x6df2ff : 0xffe38f,
            emissive: type === 'soldier' ? 0x1e7f5f : type === 'scout' ? 0x197c83 : 0x6f5a1c,
            emissiveIntensity: 0.8,
            roughness: 0.22,
            metalness: 0.1
        })
    );
    core.position.set(0, 1.35, 0.18);
    group.add(core);

    const selectRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.05, 8, 20),
        new THREE.MeshBasicMaterial({ color: 0x8affec, transparent: true, opacity: 0.0 })
    );
    selectRing.rotation.x = Math.PI / 2;
    selectRing.position.y = 0.08;
    group.add(selectRing);

    group.userData.core = core;
    group.userData.selectRing = selectRing;
    return group;
}

function makeOrder(type, payload = {}) {
    return { type, ...payload };
}

class UnitAgent {
    constructor(type, position, options = {}) {
        this.type = type;
        this.stats = UNIT_STATS[type];
        this.team = options.team || 'player';
        this.health = this.stats.maxHealth;
        this.mesh = createUnitMesh(type);
        this.mesh.position.copy(position);
        this.mesh.position.y = getTerrainHeightAt(position.x, position.z);
        this.mesh.userData.isUnit = true;
        this.mesh.userData.unitType = type;
        this.mesh.userData.unit = this;

        this.selected = false;
        this.order = makeOrder('idle');
        this.attackMode = false;
        this.cooldown = 0;
        this.carry = {
            type: 'wood',
            amount: 0
        };
    }

    setSelected(selected) {
        this.selected = selected;
        if (this.mesh.userData.selectRing) {
            this.mesh.userData.selectRing.material.opacity = selected ? 0.95 : 0.0;
        }
    }

    issueOrder(order) {
        this.order = order;
        if (order.type === 'attack') {
            this.attackMode = true;
        } else if (order.type !== 'idle') {
            this.attackMode = false;
        }
    }

    moveTowards(target, delta, speedMultiplier = 1) {
        if (!target) return;

        const desired = new THREE.Vector3(
            target.x - this.mesh.position.x,
            0,
            target.z - this.mesh.position.z
        );
        const distance = desired.length();
        if (distance < 0.01) return;

        desired.normalize();
        const speed = this.stats.speed * speedMultiplier;
        const step = Math.min(distance, speed * delta);

        this.mesh.position.x += desired.x * step;
        this.mesh.position.z += desired.z * step;
        this.mesh.position.y = getTerrainHeightAt(this.mesh.position.x, this.mesh.position.z);
        this.mesh.lookAt(this.mesh.position.x + desired.x, this.mesh.position.y, this.mesh.position.z + desired.z);
    }

    distanceTo(target) {
        if (!target) return Number.POSITIVE_INFINITY;
        return this.mesh.position.distanceTo(target);
    }

    update(delta, context) {
        this.cooldown = Math.max(0, this.cooldown - delta);

        if (this.type === 'soldier') {
            this.updateSoldier(delta, context);
        } else if (this.type === 'helper') {
            this.updateHelper(delta, context);
        } else if (this.type === 'scout') {
            this.updateScout(delta, context);
        }

        if (this.mesh.userData.core && this.mesh.userData.core.material) {
            this.mesh.userData.core.material.emissiveIntensity = 0.66 + Math.sin(performance.now() * 0.004 + this.mesh.position.x * 0.04) * 0.22;
        }
    }

    updateSoldier(delta, context) {
        let targetEnemy = null;

        if (this.order.type === 'attack' && this.order.targetObject && this.order.targetObject.parent) {
            targetEnemy = this.order.targetObject;
        }

        if (!targetEnemy && this.attackMode) {
            targetEnemy = context.findClosestEnemy(this.mesh.position, 36);
            if (targetEnemy) {
                this.order = makeOrder('attack', { targetObject: targetEnemy });
            }
        }

        if (!targetEnemy && this.order.type === 'attack' && this.order.targetPosition) {
            this.moveTowards(this.order.targetPosition, delta, 1);
            if (this.distanceTo(this.order.targetPosition) < 1.2) {
                this.order = makeOrder('idle');
            }
            return;
        }

        if (targetEnemy && targetEnemy.userData && targetEnemy.userData.health > 0) {
            const distance = this.mesh.position.distanceTo(targetEnemy.position);
            if (distance > this.stats.attackRange) {
                this.moveTowards(targetEnemy.position, delta, 1);
            } else if (this.cooldown <= 0) {
                if (typeof targetEnemy.takeDamage === 'function') {
                    targetEnemy.takeDamage(this.stats.attackDamage, 'soldier');
                }
                this.cooldown = this.stats.attackCooldown;
            }
            return;
        }

        if (this.order.type === 'move' || this.order.type === 'explore') {
            this.moveTowards(this.order.targetPosition, delta, 1);
            if (this.distanceTo(this.order.targetPosition) < 1.4) {
                if (this.order.type !== 'explore') {
                    this.order = makeOrder('idle');
                }
            }
            return;
        }

        if (this.attackMode) {
            const nearby = context.findClosestEnemy(this.mesh.position, 30);
            if (nearby) {
                this.order = makeOrder('attack', { targetObject: nearby });
            }
        }
    }

    updateHelper(delta, context) {
        const targetResource = this.order.resourceType || 'wood';
        this.carry.type = targetResource;

        if (this.carry.amount > 0) {
            const storage = context.findClosestStorage(this.mesh.position);
            if (storage) {
                this.moveTowards(storage.position, delta, 1);
                if (this.distanceTo(storage.position) < 3) {
                    storage.depositToStorage(this.carry.type, this.carry.amount);
                    this.carry.amount = 0;
                }
            }
            return;
        }

        if (!this.order.targetObject || !this.order.targetObject.parent) {
            const nearestPickup = context.findClosestPickup(this.mesh.position, targetResource, 70);
            if (nearestPickup) {
                this.order = makeOrder('gather', {
                    resourceType: targetResource,
                    targetObject: nearestPickup
                });
            } else if (this.order.targetPosition) {
                this.moveTowards(this.order.targetPosition, delta, 1);
            }
            return;
        }

        const pickup = this.order.targetObject;
        this.moveTowards(pickup.position, delta, 1);
        if (this.distanceTo(pickup.position) < this.stats.gatherRadius && this.cooldown <= 0) {
            const amount = pickup.userData?.value || this.stats.gatherAmount;
            this.carry.amount += amount;
            context.collectPickupForUnit(pickup);
            this.order.targetObject = null;
            this.cooldown = this.stats.gatherCooldown;
        }
    }

    updateScout(delta, context) {
        if (this.order.type === 'move' || this.order.type === 'explore') {
            this.moveTowards(this.order.targetPosition, delta, 1.1);
            if (this.distanceTo(this.order.targetPosition) < 1.2) {
                if (this.order.type === 'move') {
                    this.order = makeOrder('idle');
                }
            }
        }

        if (context.fog) {
            context.fog.revealAt(this.mesh.position, this.stats.visionRadius, true);
        }
    }
}

export function createUnitSystem(scene, dependencies = {}) {
    const units = [];
    const raycaster = new THREE.Raycaster();

    function context() {
        return {
            fog: dependencies.getFog ? dependencies.getFog() : null,
            findClosestEnemy(position, radius) {
                if (!dependencies.getObjects) return null;
                const objects = dependencies.getObjects();
                let nearest = null;
                let nearestDistSq = radius * radius;
                objects.forEach((object) => {
                    if (!object.userData?.isTheGray || object.userData?.isSubdued) return;
                    const distSq = object.position.distanceToSquared(position);
                    if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearest = object;
                    }
                });
                return nearest;
            },
            findClosestStorage(position) {
                if (!dependencies.getBuildings) return null;
                const buildings = dependencies.getBuildings();
                let nearest = null;
                let nearestDistSq = Number.POSITIVE_INFINITY;
                buildings.forEach((building) => {
                    if (!building || building.state !== 'complete') return;
                    const distSq = building.position.distanceToSquared(position);
                    if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearest = building;
                    }
                });
                return nearest;
            },
            findClosestPickup(position, resourceType, radius) {
                if (!dependencies.getObjects) return null;
                const objects = dependencies.getObjects();
                let nearest = null;
                let nearestDistSq = radius * radius;
                objects.forEach((object) => {
                    if (!object.userData?.isPickup) return;
                    if (resourceType && object.userData.type !== resourceType) return;
                    const distSq = object.position.distanceToSquared(position);
                    if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearest = object;
                    }
                });
                return nearest;
            },
            collectPickupForUnit(pickup) {
                if (!pickup) return;
                pickup.traverse((node) => {
                    if (node.geometry) node.geometry.dispose();
                    if (node.material) {
                        if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
                        else node.material.dispose();
                    }
                });
                if (pickup.parent) pickup.parent.remove(pickup);
                unregisterWorldObject(pickup);
            }
        };
    }

    function spawnUnit(type, position, options = {}) {
        if (!UNIT_STATS[type]) return null;
        const unit = new UnitAgent(type, position, options);
        scene.add(unit.mesh);
        units.push(unit);
        registerWorldObject(unit.mesh, {
            collidable: true,
            type: 'unit'
        });
        registerUnit(unit);
        return unit;
    }

    function removeUnit(unit) {
        if (!unit) return;
        unit.mesh.traverse((node) => {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
                if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
                else node.material.dispose();
            }
        });
        if (unit.mesh.parent) unit.mesh.parent.remove(unit.mesh);
        unregisterWorldObject(unit.mesh);
        unregisterUnit(unit);
        const index = units.indexOf(unit);
        if (index >= 0) units.splice(index, 1);
    }

    function update(delta) {
        const ctx = context();
        for (const unit of units) {
            unit.update(delta, ctx);
        }
    }

    function setSelection(unitsToSelect) {
        units.forEach((unit) => unit.setSelected(false));
        clearUnitSelection();
        unitsToSelect.forEach((unit) => {
            unit.setSelected(true);
        });
        setSelectedUnits(unitsToSelect);
    }

    function getUnitIntersections(camera, mouseNdc, recursive = true) {
        const meshes = units.map((unit) => unit.mesh);
        raycaster.setFromCamera(mouseNdc, camera);
        return raycaster.intersectObjects(meshes, recursive);
    }

    function getSelection() {
        return getSelectedUnits().filter((unit) => units.includes(unit));
    }

    function makeMoveOrder(targetPosition, explicitType = null) {
        return makeOrder(explicitType || 'move', {
            targetPosition: targetPosition.clone()
        });
    }

    function issueOrderForSelection(orderFactory) {
        const selected = getSelection();
        selected.forEach((unit) => {
            const order = orderFactory(unit);
            if (order) {
                unit.issueOrder(order);
            }
        });
    }

    function resolveGroundTarget(camera, mouseNdc) {
        raycaster.setFromCamera(mouseNdc, camera);
        if (dependencies.terrainManager && typeof dependencies.terrainManager.intersectRay === 'function') {
            const hits = dependencies.terrainManager.intersectRay(raycaster);
            if (hits.length > 0) {
                return hits[0].point.clone();
            }
        }
        const origin = raycaster.ray.origin;
        const dir = raycaster.ray.direction;
        if (Math.abs(dir.y) < 0.0001) return null;
        const t = -origin.y / dir.y;
        if (t <= 0) return null;
        return origin.clone().add(dir.clone().multiplyScalar(t));
    }

    function pickCommandTarget(camera, mouseNdc) {
        raycaster.setFromCamera(mouseNdc, camera);
        if (dependencies.getObjects) {
            const objects = dependencies.getObjects();
            const hits = raycaster.intersectObjects(objects, true);
            if (hits.length > 0) {
                for (const hit of hits) {
                    let node = hit.object;
                    while (node) {
                        if (node.userData?.isTheGray) {
                            return { type: 'enemy', object: node, point: hit.point.clone() };
                        }
                        if (node.userData?.isPickup) {
                            return { type: 'pickup', object: node, point: hit.point.clone() };
                        }
                        node = node.parent;
                    }
                }
            }
        }

        const point = resolveGroundTarget(camera, mouseNdc);
        if (!point) return null;
        return { type: 'ground', point };
    }

    function toMouseNdc(event, isMapView) {
        if (!isMapView) {
            return new THREE.Vector2(0, 0);
        }
        return new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
    }

    function handlePointerDown(event, options = {}) {
        const {
            camera,
            isMapView = false
        } = options;

        if (!camera) return false;

        const mouseNdc = toMouseNdc(event, isMapView);

        if (event.button === 0) {
            const intersections = getUnitIntersections(camera, mouseNdc, true);
            if (intersections.length > 0) {
                let node = intersections[0].object;
                while (node && !node.userData?.isUnit) {
                    node = node.parent;
                }
                if (node && node.userData?.unit) {
                    setSelection([node.userData.unit]);
                    return true;
                }
            }
            if (isMapView) {
                setSelection([]);
                return false;
            }
            return false;
        }

        if (event.button === 2) {
            const selected = getSelection();
            if (selected.length === 0) return false;

            const target = pickCommandTarget(camera, mouseNdc);
            if (!target) return false;

            if (target.type === 'enemy') {
                issueOrderForSelection((unit) => {
                    if (unit.type === 'soldier') {
                        return makeOrder('attack', { targetObject: target.object });
                    }
                    return makeMoveOrder(target.point);
                });
                return true;
            }

            if (target.type === 'pickup') {
                issueOrderForSelection((unit) => {
                    if (unit.type === 'helper') {
                        return makeOrder('gather', {
                            targetObject: target.object,
                            resourceType: target.object.userData?.type || 'wood',
                            targetPosition: target.object.position.clone()
                        });
                    }
                    if (unit.type === 'scout') {
                        return makeOrder('explore', { targetPosition: target.point.clone() });
                    }
                    return makeMoveOrder(target.point.clone());
                });
                return true;
            }

            if (target.type === 'ground') {
                issueOrderForSelection((unit) => {
                    if (unit.type === 'scout') {
                        return makeOrder('explore', { targetPosition: target.point.clone() });
                    }
                    if (unit.type === 'soldier' && unit.attackMode) {
                        return makeOrder('attack', { targetPosition: target.point.clone() });
                    }
                    return makeMoveOrder(target.point.clone());
                });
                return true;
            }
        }

        return false;
    }

    return {
        spawnUnit,
        removeUnit,
        update,
        handlePointerDown,
        getUnits: () => units,
        getSelection,
        clearSelection: () => setSelection([])
    };
}
