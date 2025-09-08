/**
 * This module is responsible for creating and managing the game map and scenery.
 */

export const mapSize = 250;
export let keystone;

/**
 * Creates decorative shrubs to populate the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
function createScenery(scene) {
    const shrubGeometry = new THREE.IcosahedronGeometry(0.8, 0);
    const shrubMaterial = new THREE.MeshStandardMaterial({ color: 0x27ae60, flatShading: true });

    const placementArea = mapSize * 0.65;

    for (let i = 0; i < 400; i++) {
        const shrub = new THREE.Mesh(shrubGeometry, shrubMaterial);

        shrub.scale.set(
            Math.random() * 0.5 + 0.7,
            Math.random() * 0.8 + 0.5,
            Math.random() * 0.5 + 0.7
        );

        shrub.position.set(
            (Math.random() - 0.5) * placementArea,
            (shrub.scale.y * 0.8) / 2,
            (Math.random() - 0.5) * placementArea
        );

        shrub.rotation.y = Math.random() * Math.PI;
        shrub.castShadow = true;
        scene.add(shrub);
    }
}

/**
 * Creates the main ground plane, boundary walls, and the central Keystone object.
 * @param {THREE.Scene} scene - The main Three.js scene.
 */
export function createMap(scene) {
    // Ground Plane with Texture
    const textureLoader = new THREE.TextureLoader();
    const groundTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(50, 50);

    const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
    const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.rotation.z = -Math.PI / 4;
    ground.receiveShadow = true;
    scene.add(ground);

    // Boundary Walls
    const wallHeight = 5;
    const wallThickness = 1;
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3d });
    const boundarySize = mapSize / 2;

    const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(mapSize, wallHeight, wallThickness), wallMaterial);
    wallNorth.position.set(0, wallHeight / 2, -boundarySize);
    scene.add(wallNorth);

    const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(mapSize, wallHeight, wallThickness), wallMaterial);
    wallSouth.position.set(0, wallHeight / 2, boundarySize);
    scene.add(wallSouth);

    const wallEast = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize), wallMaterial);
    wallEast.position.set(boundarySize, wallHeight / 2, 0);
    scene.add(wallEast);

    const wallWest = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize), wallMaterial);
    wallWest.position.set(-boundarySize, wallHeight / 2, 0);
    scene.add(wallWest);

    // Keystone
    const keystoneGeometry = new THREE.IcosahedronGeometry(5, 1);
    const keystoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x0abde3,
        emissive: 0x0abde3,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
    });
    keystone = new THREE.Mesh(keystoneGeometry, keystoneMaterial);
    keystone.position.set(-boundarySize * 0.8, 5, boundarySize * 0.8);
    keystone.castShadow = true;
    scene.add(keystone);

    createScenery(scene);
}

/**
 * Animates objects in the map, like the Keystone.
 * @param {number} deltaTime - The time elapsed since the last frame.
 * @param {number} elapsedTime - The total time elapsed since the start.
 */
export function animateMap(deltaTime, elapsedTime) {
    if (keystone) {
        keystone.rotation.y += deltaTime * 0.2;
        keystone.scale.setScalar(Math.sin(elapsedTime * 0.5) * 0.05 + 1);
    }
}
