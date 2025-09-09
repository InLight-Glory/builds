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
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3436 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
// --- BUSHES ---
const bushGeometry = new THREE.SphereGeometry(2, 16, 16);
const bushMaterial = new THREE.MeshStandardMaterial({ color: 0x218c5a });
const bushPositions = [
    [-30, 1, -30],
    [40, 1, 20],
    [-60, 1, 50],
    [70, 1, -40],
    [0, 1, 60],
    [-80, 1, 0],
    [80, 1, 80]
];
bushPositions.forEach(pos => {
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(pos[0], pos[1], pos[2]);
    bush.castShadow = true;
    bush.receiveShadow = true;
    scene.add(bush);
});

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

// Create the player's Vessels
const vessel1 = new Vessel(scene, { type: 'marksman', color: 0x0984e3, size: 1.0, speed: 10, mapBounds: mapSize / 2 });
const vessel2 = new Vessel(scene, { type: 'guardian', color: 0xd63031, size: 1.2, speed: 7, mapBounds: mapSize / 2 });
let vessels = [vessel1, vessel2];
let activeVesselIndex = 0;
let activeVessel = vessels[activeVesselIndex];
vessels[1].mesh.visible = false;

const swapCooldown = 5.0;
let lastSwapTime = -swapCooldown;

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

let isChargingSecondary = false;
let chargeStartTime = 0;

window.addEventListener('mousedown', (event) => {
    if (isPaused) return;
    raycaster.setFromCamera(mouse, camera);
    const groundIntersects = raycaster.intersectObject(ground);
    let targetPosition = mouseWorldPosition.clone();
    if (groundIntersects.length > 0) {
        targetPosition = groundIntersects[0].point.clone();
    }
    if (event.button === 0) {
        // LMB: Quick attack
        const newProjectile = activeVessel.abilities.lmb.execute({
            scene: scene,
            target: targetPosition,
            clock: clock
        });
        if (newProjectile) {
            projectiles.push(newProjectile);
        }
    } else if (event.button === 2) {
        // RMB: Start charging secondary attack
        isChargingSecondary = true;
        chargeStartTime = clock.getElapsedTime();
    }
});

window.addEventListener('mouseup', (event) => {
    if (isPaused) return;
    if (event.button === 2 && isChargingSecondary) {
        // RMB released: Shoot charged secondary attack
        isChargingSecondary = false;
        const chargeDuration = clock.getElapsedTime() - chargeStartTime;
        raycaster.setFromCamera(mouse, camera);
        const groundIntersects = raycaster.intersectObject(ground);
        let targetPosition = mouseWorldPosition.clone();
        if (groundIntersects.length > 0) {
            targetPosition = groundIntersects[0].point.clone();
        }
        // If you have a secondary ability, call it here. Example:
        if (activeVessel.abilities.secondary) {
            const secondaryProjectile = activeVessel.abilities.secondary.execute({
                scene: scene,
                target: targetPosition,
                clock: clock,
                charge: chargeDuration
            });
            if (secondaryProjectile) {
                projectiles.push(secondaryProjectile);
            }
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

    activeVessel.update(deltaTime, keysPressed, camera, mouseWorldPosition);
    updateCooldownUI();
    updateStatsUI(activeVessel);

    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].update(deltaTime)) {
            projectiles.splice(i, 1);
        }
    }

    const targetPosition = activeVessel.mesh.position.clone().add(cameraOffset);
    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(activeVessel.mesh.position);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -d * newAspect;
    camera.right = d * newAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
