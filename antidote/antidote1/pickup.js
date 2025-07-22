// pickup.js - Handles creation and collection of in-game pick-up items

// Function to create a wood pick-up item
export function createWoodPickup(position) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const material = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Sienna brown
    const woodPickup = new THREE.Mesh(geometry, material);

    woodPickup.position.copy(position);
    woodPickup.userData = {
        isPickup: true,
        type: 'wood',
        value: 1 // Each wood pickup gives 1 wood
    };
    woodPickup.name = "WoodPickup";

    return woodPickup;
}

// Function to handle collection of a pick-up item
export function collectPickup(pickupObject) {
    console.log("collectPickup entered for:", pickupObject.name);
    if (!pickupObject.userData || !pickupObject.userData.isPickup) {
        console.warn("Attempted to collect a non-pickup object.");
        return;
    }

    // Add to player's inventory (assuming playerWood is globally accessible or passed)
    if (window.addPlayerWood) {
        console.log(`Before collection: playerWood = ${window.playerWood}`);
        window.addPlayerWood(pickupObject.userData.value);
        console.log(`Collected ${pickupObject.userData.value} ${pickupObject.userData.type}. Total wood: ${window.playerWood}`);
    } else {
        console.warn("addPlayerWood function not available. Cannot collect wood.");
    }

    // Remove from scene
    if (pickupObject.geometry) pickupObject.geometry.dispose();
    if (pickupObject.material) pickupObject.material.dispose();
    if (pickupObject.parent) pickupObject.parent.remove(pickupObject);

    // Remove from global objects array in main.js
    if (window.objects) {
        const index = window.objects.indexOf(pickupObject);
        if (index > -1) {
            window.objects.splice(index, 1);
        }
    }
}
