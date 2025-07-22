
import { createWoodPickup } from './pickup.js';

// tree.js - Handles tree creation and interaction

const TREE_SHRINK_FACTOR = 0.85; // Shrinks to 85% of original size


export function createTree(position) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    // Position relative to the group, not the world
    trunk.position.set(0, 2.5, 0); 
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.name = "TreeTrunk";

    // Leaves
    const leavesGeometry = new THREE.ConeGeometry(2, 6, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest Green
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    // Position relative to the group, not the world
    leaves.position.set(0, 7, 0);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    leaves.name = "TreeLeaves";

    const treeGroup = new THREE.Group();
    treeGroup.add(trunk);
    treeGroup.add(leaves);
    treeGroup.position.copy(position); // Group position is base of the tree

    treeGroup.userData = {
        isTree: true,
        originalScale: treeGroup.scale.clone(),
        originalTrunkColor: trunkMaterial.color.clone(),
        originalLeavesColor: leavesMaterial.color.clone(),
        originalY: position.y,
        clicks: 0,
        maxClicks: 5, // Tree turns into wood after 5 hits
        growthFactor: 1.0
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
            window.objects.push(woodPickup);
        }
    } else {
        // Tree is fully "harvested" or destroyed
        console.log("Tree fully harvested/destroyed. Removing.");
        // Remove tree from scene and objects array
        if (treeGroup.geometry) treeGroup.geometry.dispose();
        if (treeGroup.material) treeGroup.material.dispose();
        if (treeGroup.parent) treeGroup.parent.remove(treeGroup);

        if (window.objects) {
            const index = window.objects.indexOf(treeGroup);
            if (index > -1) {
                window.objects.splice(index, 1);
            }
        }
    }
}

const GROWTH_RATE = 1.0 / (45 * 60); // Full growth in 45 minutes

export function updateTrees(delta) {
    if (!window.objects) return;

    window.objects.forEach(object => {
        if (object.userData && object.userData.isTree) {
            if (object.userData.growthFactor < 1.0) {
                object.userData.growthFactor += GROWTH_RATE * delta;
                if (object.userData.growthFactor > 1.0) {
                    object.userData.growthFactor = 1.0;
                }
                object.scale.set(object.userData.growthFactor, object.userData.growthFactor, object.userData.growthFactor);
            }
        }
    });
}
