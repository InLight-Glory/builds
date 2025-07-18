// A simple key state manager
const keysPressed = {};
window.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
});

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2d3436);

// Camera setup for an isometric view
const aspect = window.innerWidth / window.innerHeight;
const d = 20; // This value determines the "zoom" level of the camera
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(20, 20, 20); // Position the camera
camera.lookAt(scene.position); // Make it look at the center of the scene

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(30, 40, 20);
directionalLight.castShadow = true;
// Configure shadow properties for better quality
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground Plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x636e72 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate it to be flat
ground.receiveShadow = true;
scene.add(ground);

// Create the player's Vessel
const playerVessel = new Vessel(scene, 0x0984e3); // A nice blue color

// Game Loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    // Update game state
    playerVessel.update(deltaTime, keysPressed);

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
