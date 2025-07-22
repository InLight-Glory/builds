// base_building.js
import { BLUEPRINT_CONFIG } from './blueprints_config.js';

let scene;
let objects;

export function initBaseBuilding(_scene, _objects) {
    scene = _scene;
    objects = _objects;
}

export function createBlueprint(position, type) {
    const config = BLUEPRINT_CONFIG[type];
    if (!config) {
        console.error(`No blueprint config found for type: ${type}`);
        return null;
    }

    const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
    const material = new THREE.MeshBasicMaterial({ color: 0x808080, transparent: true, opacity: 0.50 });
    const blueprint = new THREE.Mesh(geometry, material);

    blueprint.position.set(position.x, config.height / 2, position.z);
    blueprint.name = `${config.name}Blueprint`;
    blueprint.userData = {
        isBlueprint: true,
        blueprintType: type,
        woodDeposited: 0,
        stoneDeposited: 0,
        requiredWood: config.requiredWood,
        requiredStone: config.requiredStone,
        isComplete: false
    };
    scene.add(blueprint);
    objects.push(blueprint);
    console.log(`${config.name} blueprint placed at`, position);
    return blueprint;
    return blueprint;
}

export function depositResources(blueprintMesh, resourceType, amount) {
    if (!blueprintMesh.userData.isBlueprint || blueprintMesh.userData.isComplete) return false;

    let deposited = 0;
    if (resourceType === 'wood') {
        const needed = blueprintMesh.userData.requiredWood - blueprintMesh.userData.woodDeposited;
        deposited = Math.min(amount, needed);
        blueprintMesh.userData.woodDeposited += deposited;
    } else if (resourceType === 'stone') {
        const needed = blueprintMesh.userData.requiredStone - blueprintMesh.userData.stoneDeposited;
        deposited = Math.min(amount, needed);
        blueprintMesh.userData.stoneDeposited += deposited;
    }

    if (deposited > 0) {
        console.log(`Deposited ${deposited} ${resourceType} into blueprint. Wood: ${blueprintMesh.userData.woodDeposited}/${blueprintMesh.userData.requiredWood}, Stone: ${blueprintMesh.userData.stoneDeposited}/${blueprintMesh.userData.requiredStone}`);
        updateBlueprintAppearance(blueprintMesh);
        checkCompletion(blueprintMesh);
    }
    return deposited;
}

function updateBlueprintAppearance(blueprintMesh) {
    const totalRequired = blueprintMesh.userData.requiredWood + blueprintMesh.userData.requiredStone;
    const totalDeposited = blueprintMesh.userData.woodDeposited + blueprintMesh.userData.stoneDeposited;
    const progress = totalDeposited / totalRequired;

    // Make it less transparent as progress increases
    blueprintMesh.material.opacity = 0.5 + (0.5 * progress);

    // Optional: Change color slightly as it gets built
    // blueprintMesh.material.color.setHex(0x808080).lerp(new THREE.Color(0xAAAAAA), progress);
}

function checkCompletion(blueprintMesh) {
    if (blueprintMesh.userData.woodDeposited >= blueprintMesh.userData.requiredWood &&
        blueprintMesh.userData.stoneDeposited >= blueprintMesh.userData.requiredStone) {
        blueprintMesh.userData.isComplete = true;
        blueprintMesh.material.opacity = 1.0; // Fully opaque
        blueprintMesh.material.color.setHex(0xAAAAAA); // Final color
        console.log("Base blueprint completed!");
        // Optionally, replace with a final, solid base model
    }
}
