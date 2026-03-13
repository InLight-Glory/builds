// collisions.js - Shared collision utilities for player, units, and world objects.

const _tmpObjectAABB = new THREE.Box3();
const _tmpCenterA = new THREE.Vector3();
const _tmpCenterB = new THREE.Vector3();

export function shouldCollideWithObject(object, options = {}) {
    if (!object || !object.visible) return false;
    if (options.self && object === options.self) return false;
    if (options.self && object.parent === options.self) return false;
    if (object.name === 'Ground') return false;
    if (object.userData?.isPickup) return false;
    if (object.userData?.collisionMode === 'ghost') return false;
    if (object.userData?.isTheGray && options.collideWithEnemies === false) return false;

    if (object.userData?.isTree || object.userData?.isBlueprint || object.userData?.isBuildingSolid) {
        return true;
    }

    if (object.userData?.isTheGray || object.userData?.isUnit) {
        return true;
    }

    if (object.userData?.isTerrainChunk) {
        return false;
    }

    return !!object.geometry;
}

export function updateColliderFromPose(collider, position, size, centerOffset = new THREE.Vector3()) {
    const center = new THREE.Vector3().copy(position).add(centerOffset);
    collider.setFromCenterAndSize(center, size);
}

function resolveHorizontalAxis(collider, objectAABB, position, axis) {
    const axisSize = axis === 'x'
        ? (collider.max.x - collider.min.x)
        : (collider.max.z - collider.min.z);
    const objectSize = axis === 'x'
        ? (objectAABB.max.x - objectAABB.min.x)
        : (objectAABB.max.z - objectAABB.min.z);

    const centerA = collider.getCenter(_tmpCenterA);
    const centerB = objectAABB.getCenter(_tmpCenterB);
    const delta = axis === 'x' ? centerA.x - centerB.x : centerA.z - centerB.z;
    const penetration = (axisSize * 0.5) + (objectSize * 0.5) - Math.abs(delta);

    if (penetration <= 0) return;

    if (axis === 'x') {
        position.x += delta >= 0 ? penetration : -penetration;
    } else {
        position.z += delta >= 0 ? penetration : -penetration;
    }
}

function resolveVerticalAxis(objectAABB, position, velocity, body, result) {
    if (velocity.y <= 0) {
        // Align collider bottom to object top.
        position.y = objectAABB.max.y - body.centerOffset.y + body.size.y * 0.5;
        result.hitGround = true;
    } else {
        // Align collider top to object bottom.
        position.y = objectAABB.min.y - body.centerOffset.y - body.size.y * 0.5;
    }
    velocity.y = 0;
}

export function resolveKinematicCollisions(params) {
    const {
        axis,
        position,
        velocity,
        collider,
        body,
        objects,
        options = {}
    } = params;

    const result = {
        hitGround: false,
        hitObject: false
    };

    if (!Array.isArray(objects) || objects.length === 0) {
        return result;
    }

    for (const object of objects) {
        if (!shouldCollideWithObject(object, options)) {
            continue;
        }

        _tmpObjectAABB.setFromObject(object);
        if (!_tmpObjectAABB.isEmpty() && collider.intersectsBox(_tmpObjectAABB)) {
            result.hitObject = true;
            if (axis === 'y') {
                resolveVerticalAxis(_tmpObjectAABB, position, velocity, body, result);
            } else {
                resolveHorizontalAxis(collider, _tmpObjectAABB, position, axis);
            }

            updateColliderFromPose(collider, position, body.size, body.centerOffset);
        }
    }

    if (axis === 'y' && typeof options.getGroundHeight === 'function') {
        const groundHeight = options.getGroundHeight(position.x, position.z);
        if (Number.isFinite(groundHeight)) {
            const colliderBottom = position.y + body.centerOffset.y - body.size.y * 0.5;
            if (colliderBottom < groundHeight) {
                position.y = groundHeight - body.centerOffset.y + body.size.y * 0.5;
                velocity.y = Math.max(0, velocity.y);
                result.hitGround = true;
                updateColliderFromPose(collider, position, body.size, body.centerOffset);
            }
        }
    }

    return result;
}

export function checkFloorCollision(collider, objects, options = {}) {
    return resolveKinematicCollisions({
        axis: 'y',
        position: options.position,
        velocity: options.velocity,
        collider,
        body: options.body,
        objects,
        options
    });
}

export function checkWallCollision(collider, objects, options = {}) {
    return resolveKinematicCollisions({
        axis: options.axis || 'x',
        position: options.position,
        velocity: options.velocity,
        collider,
        body: options.body,
        objects,
        options
    });
}

export function checkRampCollision(collider, objects, options = {}) {
    return checkFloorCollision(collider, objects, options);
}

export function checkLadderCollision() {
    return { hitGround: false, hitObject: false };
}

export function checkCeilingCollision(collider, objects, options = {}) {
    return resolveKinematicCollisions({
        axis: 'y',
        position: options.position,
        velocity: options.velocity,
        collider,
        body: options.body,
        objects,
        options
    });
}

// Utility for block damage and color lerp
export function damageBlock(block, damage) {
    // Block health and maxHealth are stored in userData
    // You can adjust these defaults as needed
    const DEFAULT_BLOCK_HEALTH = 125;
    const DEFAULT_BLOCK_MAX_HEALTH = 200;
    if (!block || !block.userData) return;
    if (typeof block.userData.health !== 'number') block.userData.health = DEFAULT_BLOCK_HEALTH;
    if (typeof block.userData.maxHealth !== 'number') block.userData.maxHealth = DEFAULT_BLOCK_MAX_HEALTH;
    block.userData.health -= damage;
    // Color lerp to red as health decreases
    if (block.material && block.userData.originalColor && typeof block.userData.maxHealth === 'number') {
        const healthPercent = Math.max(0, block.userData.health / block.userData.maxHealth);
        block.material.color.copy(block.userData.originalColor).lerp(new THREE.Color(1, 0, 0), 1 - healthPercent);
    }
    if (block.userData.health <= 0) {
        if (block.parent) block.parent.remove(block);
        if (block.geometry) block.geometry.dispose();
        if (block.material) block.material.dispose();
    }
}

// Add more collision types as needed
