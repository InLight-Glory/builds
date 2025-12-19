import { Vessel } from './vessels/Vessel.js';
import { TargetDummy } from './npcs/TargetDummy.js';
import { Projectile } from './abilities/Projectile.js';

// --- SETUP ---
const keysPressed = {};
window.addEventListener('keydown', (event) => { keysPressed[event.key.toLowerCase()] = true; });
window.addEventListener('keyup', (event) => { keysPressed[event.key.toLowerCase()] = false; });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e272e);

const aspect = window.innerWidth / window.innerHeight;
const d = 25;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
const cameraOffset = new THREE.Vector3(25, 25, 25);
camera.position.copy(cameraOffset);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(50, 60, 25);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- MAP & SCENERY ---
const mapSize = 250;
const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('https://threejs.org/examples/textures/terrain/grasslight-big.jpg');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
// --- BUSHES ---
const bushGeometry = new THREE.SphereGeometry(2, 16, 16);
const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x218c5a });
const bushPositions = [
    [-30, 2, -30],
    [40, 2, 20],
    [-60, 2, 50],
    [70, 2, -40],
    [0, 2, 60],
    [-80, 2, 0],
    [80, 2, 80]
];
bushPositions.forEach(pos => {
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(pos[0], pos[1], pos[2]);
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
});

// --- CHARACTER CONFIG ---
const availableCharacters = [
    { id: 'red', name: 'Red', type: 'guardian', color: 0xd63031, desc: 'Tanky Defender' },
    { id: 'blue', name: 'Blue', type: 'marksman', color: 0x0984e3, desc: 'Ranged DPS' },
    { id: 'yellow', name: 'Yellow', type: 'marksman', color: 0xfdcb6e, desc: 'Speedy Scout' },
    { id: 'orange', name: 'Orange', type: 'guardian', color: 0xe17055, desc: 'Brawler' },
    { id: 'purple', name: 'Purple', type: 'guardian', color: 0x6c5ce7, desc: 'Balanced' }, // Using guardian model for now
    { id: 'black', name: 'Black', type: 'marksman', color: 0x2d3436, desc: 'Stealth Ops' },
    { id: 'pink', name: 'Pink', type: 'guardian', color: 0xe84393, desc: 'Support' }
];

let selectedCharacterIds = [];
let vessels = [];
let activeVesselIndex = 0;
let activeVessel;
let isGameStarted = false;

// --- SELECTION UI LOGIC ---
const selectionScreen = document.getElementById('character-selection-screen');
const characterGrid = document.getElementById('character-grid');
const startGameBtn = document.getElementById('start-game-btn');
const cooldownContainer = document.getElementById('cooldown-container');
const statsContainer = document.getElementById('stats-container');

function initSelectionScreen() {
    availableCharacters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.id = char.id;
        card.onclick = () => toggleSelection(char.id);

        const preview = document.createElement('div');
        preview.className = 'character-preview';
        preview.style.backgroundColor = '#' + char.color.toString(16).padStart(6, '0');

        const name = document.createElement('div');
        name.className = 'character-name';
        name.textContent = char.name;

        const type = document.createElement('div');
        type.className = 'character-type';
        type.textContent = char.desc;

        card.appendChild(preview);
        card.appendChild(name);
        card.appendChild(type);
        characterGrid.appendChild(card);
    });

    startGameBtn.onclick = tryStartGame;
}

function toggleSelection(id) {
    const card = document.querySelector(`.character-card[data-id="${id}"]`);

    if (selectedCharacterIds.includes(id)) {
        selectedCharacterIds = selectedCharacterIds.filter(cid => cid !== id);
        card.classList.remove('selected');
    } else {
        if (selectedCharacterIds.length < 2) {
            selectedCharacterIds.push(id);
            card.classList.add('selected');
        } else {
            // Optional: Auto-deselect the first one to allow quick swapping
            // For now, just restricting to 2 max is fine or user has to deselect first
            // Let's implement "Replace oldest" behavior for better UX?
            // Actually, let's stick to simple "Deselect one to pick another" for clarity first
            // Or, just notify user they picked max. 
            // Let's do nothing if max reached to keep it simple, user sees visual feedback.
        }
    }

    if (selectedCharacterIds.length === 2) {
        startGameBtn.classList.add('active');
        startGameBtn.style.cursor = 'pointer';
    } else {
        startGameBtn.classList.remove('active');
        startGameBtn.style.cursor = 'not-allowed';
    }
}

function tryStartGame() {
    if (selectedCharacterIds.length === 2) {
        startGame();
    }
}

// --- GAME STATE ---
let isPaused = false;
let projectiles = [];

// --- GAME LOGIC & UI ---
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const mouseWorldPosition = new THREE.Vector3();

// Create a target dummy
const dummy = new TargetDummy(scene, new THREE.Vector3(0, 3, -15));
const damageableNpcs = [dummy];

function startGame() {
    isGameStarted = true;
    selectionScreen.style.display = 'none';
    cooldownContainer.style.display = 'flex'; // Show HUD
    statsContainer.style.display = 'block';   // Show HUD

    // Instantiate selected vessels
    const char1 = availableCharacters.find(c => c.id === selectedCharacterIds[0]);
    const char2 = availableCharacters.find(c => c.id === selectedCharacterIds[1]);

    const v1 = new Vessel(scene, {
        type: char1.type,
        color: char1.color,
        size: char1.type === 'guardian' ? 1.2 : 1.0,
        speed: char1.type === 'guardian' ? 7 : 10,
        mapBounds: mapSize / 2
    });

    const v2 = new Vessel(scene, {
        type: char2.type,
        color: char2.color,
        size: char2.type === 'guardian' ? 1.2 : 1.0,
        speed: char2.type === 'guardian' ? 7 : 10,
        mapBounds: mapSize / 2
    });

    vessels = [v1, v2];
    activeVesselIndex = 0;
    activeVessel = vessels[activeVesselIndex];
    vessels[1].mesh.visible = false;

    // Start loop
    animate();
}

const swapCooldown = 5.0;
let lastSwapTime = -swapCooldown;

// Initialize Selection Screen
initSelectionScreen();

// --- UI Elements ---
const cooldownFill = document.getElementById('cooldown-fill');
const cooldownText = document.getElementById('cooldown-text');
const statLevel = document.getElementById('stat-level');
const statHealth = document.getElementById('stat-health');
const statMana = document.getElementById('stat-mana');
const statAd = document.getElementById('stat-ad');
const statArmor = document.getElementById('stat-armor');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');

// --- EVENT LISTENERS ---
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

resumeButton.addEventListener('click', () => {
    togglePause();
});

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'escape') {
        togglePause();
    }
    if (isPaused) return;

    if (key === 'shift') {
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
    if (key === 'l') {
        activeVessel.levelUp();
    }
});

window.addEventListener('mousedown', (event) => {
    if (isPaused) return;

    let abilityToExecute;
    if (event.button === 0) { // Left-click
        abilityToExecute = activeVessel.abilities.lmb;
    } else if (event.button === 2) { // Right-click
        abilityToExecute = activeVessel.abilities.rmb;
    }

    if (abilityToExecute) {
        const newProjectile = abilityToExecute.execute({
            scene: scene,
            mouseWorldPosition: mouseWorldPosition,
            clock: clock
        });

        if (newProjectile) {
            projectiles.push(newProjectile);
        }
    }
});

// --- FUNCTIONS ---
function togglePause() {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'flex' : 'none';
}

function updateCooldownUI() {
    const now = clock.getElapsedTime();
    const timeSinceSwap = now - lastSwapTime;
    if (timeSinceSwap < swapCooldown) {
        const progress = timeSinceSwap / swapCooldown;
        cooldownFill.style.transform = `translateY(${(1 - progress) * 100}%)`;
        cooldownText.textContent = (swapCooldown - timeSinceSwap).toFixed(1);
    } else {
        cooldownFill.style.transform = 'translateY(100%)';
        cooldownText.textContent = 'SHIFT';
    }
}

function updateStatsUI(vessel) {
    statLevel.textContent = vessel.level;
    statHealth.textContent = `${Math.round(vessel.stats.currentHealth)} / ${Math.round(vessel.stats.maxHealth)}`;
    statMana.textContent = `${Math.round(vessel.stats.currentMana)} / ${Math.round(vessel.stats.maxMana)}`;
    statAd.textContent = vessel.stats.attackDamage.toFixed(1);
    statArmor.textContent = vessel.stats.armor.toFixed(1);
}

// --- GAME LOOP ---
function animate() {
    if (!isGameStarted) return; // Stop if not started

    requestAnimationFrame(animate);

    if (isPaused) {
        return;
    }

    const deltaTime = clock.getDelta();

    raycaster.setFromCamera(mouse, camera);
    const groundIntersects = raycaster.intersectObject(ground);
    if (groundIntersects.length > 0) {
        mouseWorldPosition.copy(groundIntersects[0].point);
    }

    if (activeVessel) {
        activeVessel.update(deltaTime, keysPressed, camera, mouseWorldPosition);
        updateCooldownUI();
        updateStatsUI(activeVessel);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].update(deltaTime, damageableNpcs)) {
            projectiles.splice(i, 1);
        }
    }

    if (activeVessel) {
        const targetPosition = activeVessel.mesh.position.clone().add(cameraOffset);
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(activeVessel.mesh.position);
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -d * newAspect;
    camera.right = d * newAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Remove direct call to animate(), it's called by startGame now
// Selection screen is already initialized above and will call startGame()

