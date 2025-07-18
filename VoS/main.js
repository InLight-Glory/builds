// --- SETUP ---

// Key state manager
const keysPressed = {};
window.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e272e); // A darker, moodier background

// Camera
const aspect = window.innerWidth / window.innerHeight;
const d = 25; // Zoom out a bit to see more of the larger map
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
const cameraOffset = new THREE.Vector3(25, 25, 25); // Increase camera offset for the larger view
camera.position.copy(cameraOffset);
camera.lookAt(scene.position);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(50, 60, 25); // Adjust light position for the larger map
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096; // Increase shadow map resolution for better quality
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

// --- MAP & SCENERY ---
const mapSize = 250; // Significantly increase map size

// Ground Plane with Texture
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50); // How many times the texture repeats

const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.rotation.z = -Math.PI / 4; // Rotate to create the diamond shape
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
const keystone = new THREE.Mesh(keystoneGeometry, keystoneMaterial);
// Position in the S.W. corner
keystone.position.set(-boundarySize * 0.8, 5, boundarySize * 0.8);
keystone.castShadow = true;
scene.add(keystone);


function createScenery() {
    const shrubGeometry = new THREE.IcosahedronGeometry(0.8, 0); // Use a more organic shape
    const shrubMaterial = new THREE.MeshStandardMaterial({ color: 0x27ae60, flatShading: true });
    
    // We place shrubs inside a square area that fits within the rotated diamond plane
    const placementArea = mapSize * 0.65; 

    for (let i = 0; i < 400; i++) { // Add more shrubs
        const shrub = new THREE.Mesh(shrubGeometry, shrubMaterial);
        
        // Randomly scale each shrub to make them look unique
        shrub.scale.set(
            Math.random() * 0.5 + 0.7,
            Math.random() * 0.8 + 0.5,
            Math.random() * 0.5 + 0.7
        );

        shrub.position.set(
            (Math.random() - 0.5) * placementArea,
            (shrub.scale.y * 0.8) / 2, // Adjust height based on scale
            (Math.random() - 0.5) * placementArea
        );
        
        shrub.rotation.y = Math.random() * Math.PI; // Randomly rotate
        shrub.castShadow = true;
        scene.add(shrub);
    }
}
createScenery();


// --- GAME LOGIC & UI ---
const clock = new THREE.Clock(); 

// UI Elements
const cooldownFill = document.getElementById('cooldown-fill');
const cooldownText = document.getElementById('cooldown-text');

// Create the player's Vessels
const vessel1 = new Vessel(scene, { color: 0x0984e3, size: 1.0, speed: 10, mapBounds: mapSize / 2 });
const vessel2 = new Vessel(scene, { color: 0xd63031, size: 1.3, speed: 7, mapBounds: mapSize / 2 });

// Swap mechanic variables
let vessels = [vessel1, vessel2];
let activeVesselIndex = 0;
let activeVessel = vessels[activeVesselIndex];
vessels[1].mesh.visible = false; // Start with the second vessel hidden

const swapCooldown = 5.0; // 5 seconds
let lastSwapTime = -swapCooldown; // Allow swapping immediately at the start

// Listen for the swap key press
window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'shift') {
        const now = clock.getElapsedTime();
        if (now - lastSwapTime >= swapCooldown) {
            const oldVessel = vessels[activeVesselIndex];
            const position = oldVessel.mesh.position.clone();
            const quaternion = oldVessel.mesh.quaternion.clone();
            oldVessel.mesh.visible = false;
            activeVesselIndex = (activeVesselIndex + 1) % vessels.length;
            activeVessel = vessels[activeVesselIndex];
            activeVessel.mesh.position.copy(position);
            activeVessel.mesh.quaternion.copy(quaternion);
            activeVessel.mesh.visible = true;
            lastSwapTime = now;
        }
    }
});

function updateCooldownUI() {
    const now = clock.getElapsedTime();
    const timeSinceSwap = now - lastSwapTime;
    if (timeSinceSwap < swapCooldown) {
        const progress = timeSinceSwap / swapCooldown;
        const fillHeight = (1 - progress) * 100;
        cooldownFill.style.transform = `translateY(${fillHeight}%)`;
        const timeLeft = swapCooldown - timeSinceSwap;
        cooldownText.textContent = timeLeft.toFixed(1);
    } else {
        cooldownFill.style.transform = 'translateY(100%)';
        cooldownText.textContent = 'SHIFT';
    }
}


// --- GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Animate the keystone to give it a "rippling" effect
    keystone.rotation.y += deltaTime * 0.2;
    keystone.scale.setScalar(Math.sin(elapsedTime * 0.5) * 0.05 + 1);

    // Update game logic
    activeVessel.update(deltaTime, keysPressed, camera);
    updateCooldownUI();

    // Camera follows the active player
    const targetPosition = activeVessel.mesh.position.clone().add(cameraOffset);
    camera.position.lerp(targetPosition, 0.1); // Use lerp for smooth camera movement
    camera.lookAt(activeVessel.mesh.position);

    // Render the scene
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -d * newAspect;
    camera.right = d * newAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game loop
animate();
