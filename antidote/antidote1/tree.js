
import { createWoodPickup } from './pickup.js';

// tree.js - Handles tree creation and interaction

const TREE_SHRINK_FACTOR = 0.85; // Shrinks to 85% of original size
const TREE_CHUNK_SIZE = 80;
const TREE_LOAD_RADIUS = 3;
const TREES_PER_CHUNK = 14;

const treeChunks = new Map();
const activeTrees = new Set();

let treeScene = null;
let terrainHeightSampler = (x, z) => 0;
let registerObjectFn = null;
let unregisterObjectFn = null;

function chunkKey(cx, cz) {
    return `${cx},${cz}`;
}

function seededRandom(seed) {
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return value - Math.floor(value);
}

function worldChunk(positionValue) {
    return Math.floor(positionValue / TREE_CHUNK_SIZE);
}

function registerTreeObject(tree) {
    if (typeof registerObjectFn === 'function') {
        registerObjectFn(tree, { collidable: true, type: 'tree' });
    } else if (window.objects && !window.objects.includes(tree)) {
        window.objects.push(tree);
    }
}

function unregisterTreeObject(tree) {
    if (typeof unregisterObjectFn === 'function') {
        unregisterObjectFn(tree);
        return;
    }
    if (window.objects) {
        const index = window.objects.indexOf(tree);
        if (index > -1) {
            window.objects.splice(index, 1);
        }
    }
}

function createChunkTrees(cx, cz) {
    const trees = [];
    const baseX = cx * TREE_CHUNK_SIZE;
    const baseZ = cz * TREE_CHUNK_SIZE;

    for (let i = 0; i < TREES_PER_CHUNK; i++) {
        const seed = (cx * 73856093) ^ (cz * 19349663) ^ (i * 83492791);
        const rx = seededRandom(seed + 0.13);
        const rz = seededRandom(seed + 0.67);
        const x = baseX + rx * TREE_CHUNK_SIZE;
        const z = baseZ + rz * TREE_CHUNK_SIZE;

        const minSpacing = 8.5;
        const tooClose = trees.some((existing) => existing.position.distanceToSquared(new THREE.Vector3(x, existing.position.y, z)) < minSpacing * minSpacing);
        if (tooClose) continue;

        const y = terrainHeightSampler(x, z);
        const tree = createTree(new THREE.Vector3(x, y, z));
        tree.userData.chunkKey = chunkKey(cx, cz);
        trees.push(tree);
    }

    trees.forEach((tree) => {
        treeScene.add(tree);
        registerTreeObject(tree);
        activeTrees.add(tree);
    });

    return trees;
}

function disposeTree(tree) {
    if (!tree) return;
    tree.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
            if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose());
            else node.material.dispose();
        }
    });
    if (tree.parent) tree.parent.remove(tree);
    unregisterTreeObject(tree);
    activeTrees.delete(tree);
}

function createTreeChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    if (treeChunks.has(key)) return;
    const trees = createChunkTrees(cx, cz);
    treeChunks.set(key, trees);
}

function removeTreeChunk(key) {
    const trees = treeChunks.get(key);
    if (!trees) return;
    trees.forEach((tree) => disposeTree(tree));
    treeChunks.delete(key);
}

export function initTreeStreaming(options = {}) {
    treeScene = options.scene || window.scene;
    terrainHeightSampler = typeof options.getHeightAt === 'function' ? options.getHeightAt : terrainHeightSampler;
    registerObjectFn = typeof options.registerObject === 'function' ? options.registerObject : null;
    unregisterObjectFn = typeof options.unregisterObject === 'function' ? options.unregisterObject : null;
}

export function updateTreeStreaming(playerPosition) {
    if (!treeScene || !playerPosition) return;

    const centerChunkX = worldChunk(playerPosition.x);
    const centerChunkZ = worldChunk(playerPosition.z);
    const keep = new Set();

    for (let dz = -TREE_LOAD_RADIUS; dz <= TREE_LOAD_RADIUS; dz++) {
        for (let dx = -TREE_LOAD_RADIUS; dx <= TREE_LOAD_RADIUS; dx++) {
            const cx = centerChunkX + dx;
            const cz = centerChunkZ + dz;
            const key = chunkKey(cx, cz);
            keep.add(key);
            if (!treeChunks.has(key)) {
                createTreeChunk(cx, cz);
            }
        }
    }

    Array.from(treeChunks.keys()).forEach((key) => {
        if (!keep.has(key)) {
            removeTreeChunk(key);
        }
    });
}

export function getActiveTrees() {
    return Array.from(activeTrees);
}


export function createTree(position) {
    const trunkGeometry = new THREE.CylinderGeometry(0.42, 0.72, 5.8, 10);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6c4524, roughness: 0.92 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(0, 2.9, 0);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.name = "TreeTrunk";

    const treeGroup = new THREE.Group();
    treeGroup.add(trunk);
    treeGroup.position.copy(position); // Group position is base of the tree

    const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0x3f7e39,
        roughness: 0.84
    });

    const leafClusters = [
        { pos: [0, 7.2, 0], scale: [1.9, 1.7, 1.9] },
        { pos: [1.2, 6.4, 0.7], scale: [1.35, 1.3, 1.35] },
        { pos: [-1.1, 6.2, -0.4], scale: [1.28, 1.25, 1.28] },
        { pos: [0.3, 5.8, -1.2], scale: [1.1, 1.15, 1.1] }
    ];

    leafClusters.forEach((cluster, index) => {
        const leaves = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.4, 1),
            leavesMaterial
        );
        leaves.position.set(cluster.pos[0], cluster.pos[1], cluster.pos[2]);
        leaves.scale.set(cluster.scale[0], cluster.scale[1], cluster.scale[2]);
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        leaves.name = index === 0 ? "TreeLeaves" : `TreeLeaves_${index}`;
        treeGroup.add(leaves);
    });

    for (let i = 0; i < 3; i++) {
        const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.18, 2.2, 6),
            trunkMaterial
        );
        branch.position.set((i - 1) * 0.8, 4.8 + i * 0.5, i === 1 ? 0.7 : -0.6);
        branch.rotation.z = i === 1 ? -0.9 : 0.8 - i * 0.3;
        branch.rotation.x = i === 1 ? 0.2 : -0.2;
        branch.castShadow = true;
        treeGroup.add(branch);
    }

    treeGroup.userData = {
        isTree: true,
        originalScale: treeGroup.scale.clone(),
        originalTrunkColor: trunkMaterial.color.clone(),
        originalLeavesColor: leavesMaterial.color.clone(),
        originalY: position.y,
        clicks: 0,
        maxClicks: 5, // Tree turns into wood after 5 hits
        growthFactor: 1.0,
        swayOffset: Math.random() * Math.PI * 2
    };

    return treeGroup;
}

export function shrinkTree(treeGroup) {
    if (!treeGroup.userData.isTree) {
        console.warn("Attempted to shrink a non-tree object.");
        return;
    }

    treeGroup.userData.clicks++;
    console.log("shrinkTree called for:", treeGroup.name);
    console.log(`Tree clicks: ${treeGroup.userData.clicks}/${treeGroup.userData.maxClicks}`);

    // Change color to indicate damage
    const damageFactor = treeGroup.userData.clicks / treeGroup.userData.maxClicks;
    const trunk = treeGroup.children.find(obj => obj.name === "TreeTrunk");
    const leaves = treeGroup.children.find(obj => obj.name === "TreeLeaves");

    if (trunk && trunk.material && treeGroup.userData.originalTrunkColor) {
        const damagedColor = treeGroup.userData.originalTrunkColor.clone().lerp(new THREE.Color(0x8B0000), damageFactor); // Dark Red
        trunk.material.color.copy(damagedColor);
    }
    if (leaves && leaves.material && treeGroup.userData.originalLeavesColor) {
        const damagedColor = treeGroup.userData.originalLeavesColor.clone().lerp(new THREE.Color(0x556B2F), damageFactor); // Dark Olive Green
        leaves.material.color.copy(damagedColor);
    }

    if (treeGroup.userData.clicks <= treeGroup.userData.maxClicks) {
        // Shrink the tree by reducing its growth factor
        treeGroup.userData.growthFactor *= TREE_SHRINK_FACTOR;
        treeGroup.scale.set(treeGroup.userData.growthFactor, treeGroup.userData.growthFactor, treeGroup.userData.growthFactor);
        treeGroup.position.y = treeGroup.userData.originalY; // Keep tree on the ground
        console.log(`Tree shrunk to ${treeGroup.userData.growthFactor.toFixed(2)} growth factor.`);
        // Spawn wood pick-ups here
        const numPickups = 5;
        const spawnRadius = 0.1; // 0.1 unit away
        const baseHeight = 0.25; // Y position slightly above ground

        for (let i = 0; i < numPickups; i++) {
            const angle = Math.random() * Math.PI * 2; // Random angle
            const xOffset = Math.cos(angle) * spawnRadius;
            const zOffset = Math.sin(angle) * spawnRadius;

            const pickupPosition = new THREE.Vector3(
                treeGroup.position.x + xOffset,
                treeGroup.userData.originalY + baseHeight, // Use originalY for ground level
                treeGroup.position.z + zOffset
            );
            const woodPickup = createWoodPickup(pickupPosition);
            window.scene.add(woodPickup);
            if (typeof window.registerWorldObject === 'function') {
                window.registerWorldObject(woodPickup, { collidable: false, type: 'pickup' });
            } else {
                window.objects.push(woodPickup);
            }
        }
    } else {
        // Tree is fully "harvested" or destroyed
        console.log("Tree fully harvested/destroyed. Removing.");
        // Remove tree from scene and objects array
        if (treeGroup.geometry) treeGroup.geometry.dispose();
        if (treeGroup.material) treeGroup.material.dispose();
        if (treeGroup.parent) treeGroup.parent.remove(treeGroup);

        unregisterTreeObject(treeGroup);
        activeTrees.delete(treeGroup);
        const key = treeGroup.userData?.chunkKey;
        if (key && treeChunks.has(key)) {
            const chunkTrees = treeChunks.get(key).filter((tree) => tree !== treeGroup);
            treeChunks.set(key, chunkTrees);
        }
    }
}

const GROWTH_RATE = 1.0 / (45 * 60); // Full growth in 45 minutes

export function updateTrees(delta) {
    activeTrees.forEach((object) => {
        if (object.userData && object.userData.isTree) {
            if (object.userData.growthFactor < 1.0) {
                object.userData.growthFactor += GROWTH_RATE * delta;
                if (object.userData.growthFactor > 1.0) {
                    object.userData.growthFactor = 1.0;
                }
                object.scale.set(object.userData.growthFactor, object.userData.growthFactor, object.userData.growthFactor);
            }
            object.rotation.z = Math.sin(performance.now() * 0.00045 + object.userData.swayOffset) * 0.014;
        }
    });
}
