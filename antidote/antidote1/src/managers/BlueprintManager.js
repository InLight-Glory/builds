/**
 * BlueprintManager.js
 * Handles the RTS-style placement of building blueprints.
 */

const blueprintManager = (function() {
    let activeBlueprintType = null;
    let placementMesh = null; // The "ghost" building that follows the mouse
    let placedBlueprints = []; // A list of all blueprints placed in the world

    const blueprintGeometries = {
        'wall': new THREE.BoxGeometry(4, 2, 0.5)
    };
    const placementMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        transparent: true
    });

    function initialize(scene) {
        // Create the placement mesh but don't add it to the scene yet
        placementMesh = new THREE.Mesh(new THREE.BoxGeometry(), placementMaterial);
        placementMesh.visible = false;
        scene.add(placementMesh);
    }

    function setActiveBlueprint(type, scene) {
        if (activeBlueprintType === type) {
            // If clicking the same button, deactivate build mode
            activeBlueprintType = null;
            placementMesh.visible = false;
            return null;
        }

        activeBlueprintType = type;
        if (blueprintGeometries[type]) {
            placementMesh.geometry.dispose(); // Clean up old geometry
            placementMesh.geometry = blueprintGeometries[type];
            placementMesh.visible = true;
        }
        return activeBlueprintType;
    }

    function update(mouseWorldPosition) {
        if (placementMesh && placementMesh.visible) {
            // Snap to a grid (e.g., of size 1)
            placementMesh.position.x = Math.round(mouseWorldPosition.x);
            placementMesh.position.y = 1; // Set y-position based on building height
            placementMesh.position.z = Math.round(mouseWorldPosition.z);
        }
    }

    function placeBlueprint(scene) {
        if (!activeBlueprintType) return;

        // Create a new mesh for the placed blueprint
        const blueprintMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2, opacity: 0.6, transparent: true });
        const newBlueprintMesh = new THREE.Mesh(blueprintGeometries[activeBlueprintType], blueprintMaterial);
        newBlueprintMesh.position.copy(placementMesh.position);
        
        scene.add(newBlueprintMesh);
        
        const blueprintData = {
            type: activeBlueprintType,
            position: { x: newBlueprintMesh.position.x, y: newBlueprintMesh.position.y, z: newBlueprintMesh.position.z },
            mesh: newBlueprintMesh // Keep a reference to the mesh
        };
        placedBlueprints.push(blueprintData);

        console.log(`Placed blueprint: ${activeBlueprintType} at`, blueprintData.position);
    }
    
    function getPlacedBlueprints() {
        return placedBlueprints.map(bp => ({ type: bp.type, position: bp.position }));
    }
    
    function recreateBlueprints(blueprintData, scene) {
        // Clear existing blueprints
        placedBlueprints.forEach(bp => scene.remove(bp.mesh));
        placedBlueprints = [];
        
        blueprintData.forEach(data => {
            const blueprintMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2, opacity: 0.6, transparent: true });
            const newBlueprintMesh = new THREE.Mesh(blueprintGeometries[data.type], blueprintMaterial);
            newBlueprintMesh.position.set(data.position.x, data.position.y, data.position.z);
            scene.add(newBlueprintMesh);
            placedBlueprints.push({ ...data, mesh: newBlueprintMesh });
        });
    }


    // Public API
    return {
        initialize,
        setActiveBlueprint,
        update,
        placeBlueprint,
        getPlacedBlueprints,
        recreateBlueprints
    };
})();
