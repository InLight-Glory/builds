// thegray-spawner.js
// Handles spawning and despawning of The-Gray enemies

// --- CONFIGURABLE SPAWNER CONSTANTS ---
const THE_GRAY_BASE_SPAWN_INTERVAL = 35;
const THE_GRAY_MIN_SPAWN_INTERVAL = 8;
const THE_GRAY_BASE_MAX_COUNT = 5;
const THE_GRAY_SPAWN_DISTANCE = 200.0;
const THE_GRAY_SPAWN_HEIGHT = 0.9;

let theGraySpawnTimer = THE_GRAY_BASE_SPAWN_INTERVAL;

function getDirectorValues() {
    const snapshot = typeof window.getZoneSnapshot === 'function' ? window.getZoneSnapshot() : null;
    const contamination = snapshot?.metrics?.contamination ?? 100;
    const dangerFactor = contamination / 100;
    const spawnInterval = Math.max(
        THE_GRAY_MIN_SPAWN_INTERVAL,
        THE_GRAY_BASE_SPAWN_INTERVAL - (dangerFactor * 22)
    );
    const maxCount = THE_GRAY_BASE_MAX_COUNT + Math.floor(dangerFactor * 5);
    return { spawnInterval, maxCount };
}

function countActiveTheGray() {
    return window.objects ? window.objects.filter(obj => obj.userData && obj.userData.isTheGray).length : 0;
}

function spawnOneTheGray() {
    if (!window.controls || !window.createTheGray || !window.debugLog) {
         console.error("Spawner: Missing required global objects (controls, createTheGray, debugLog). Cannot spawn.");
         return;
    }

    const playerPosition = window.controls.getObject().position;
    const randomAngle = Math.random() * Math.PI * 2;
    const spawnX = playerPosition.x + Math.cos(randomAngle) * THE_GRAY_SPAWN_DISTANCE;
    const spawnZ = playerPosition.z + Math.sin(randomAngle) * THE_GRAY_SPAWN_DISTANCE;
    const terrainHeight = typeof window.getTerrainHeightAt === 'function'
        ? window.getTerrainHeightAt(spawnX, spawnZ)
        : 0;
    const spawnPosition = new THREE.Vector3(spawnX, terrainHeight + THE_GRAY_SPAWN_HEIGHT, spawnZ);

    window.debugLog("Spawner: Attempting to spawn The-Gray at", spawnPosition);
    window.createTheGray(spawnPosition);

    if (window.showTheGraySpawnNotification) {
        window.showTheGraySpawnNotification();
    }
}

function despawnFarthestTheGray() {
    if (!window.controls || !window.objects || !window.removeTheGray || !window.debugLog) {
        console.error("Spawner: Missing required global objects for despawning. Cannot despawn.");
        return;
    }

    const playerPosition = window.controls.getObject().position;
    let farthestGray = null;
    let maxDistanceSq = -1;

    window.objects.forEach(obj => {
        if (obj.userData && obj.userData.isTheGray) {
            const distanceSq = obj.position.distanceToSquared(playerPosition);
            if (distanceSq > maxDistanceSq) {
                maxDistanceSq = distanceSq;
                farthestGray = obj;
            }
        }
    });

    if (farthestGray) {
        window.debugLog("Spawner: Max count reached. Despawning farthest The-Gray:", farthestGray.name);
        window.removeTheGray(farthestGray);
    }
}

function updateSpawner(delta) {
    const director = getDirectorValues();
    theGraySpawnTimer -= delta;
    if (theGraySpawnTimer <= 0) {
        theGraySpawnTimer = director.spawnInterval;
        const currentGrayCount = countActiveTheGray();
        if (window.debugLog) window.debugLog("Spawner: Timer up! Current The-Gray count:", currentGrayCount);

        if (currentGrayCount < director.maxCount) {
            spawnOneTheGray();
        } else {
            despawnFarthestTheGray();
            spawnOneTheGray();
        }
    }
}

function startTestSpawn() {
    setTimeout(() => {
        spawnOneTheGray();
        if (window.debugLog) window.debugLog('Spawned a The-Gray after 5 seconds for testing.');
    }, 5000);
}

window.updateSpawner = updateSpawner;
window.spawnOneTheGray = spawnOneTheGray; // Keep for potential manual calls or if other modules need it
window.startTestSpawn = startTestSpawn;
