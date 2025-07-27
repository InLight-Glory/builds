class TheGraySpawner {
    constructor() {
        this.grays = [];
        this.spawnInterval = 5000; // 5 seconds for testing
        this.lastSpawnTime = 0;
        console.log("TheGraySpawner created.");
    }

    update(scene, playerPosition) {
        const now = Date.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            this.lastSpawnTime = now;
            
            // --- FIX ---
            // Instead of 'new TheGray()', we now call the global 'createTheGray()' function.
            // This function handles creating the enemy and adding it to the scene and objects array.
            if (typeof createTheGray === 'function') {
                const randomAngle = Math.random() * Math.PI * 2;
                const spawnDistance = 20; // Spawn 20 units away from the player
                const spawnX = playerPosition.x + Math.cos(randomAngle) * spawnDistance;
                const spawnZ = playerPosition.z + Math.sin(randomAngle) * spawnDistance;
                const spawnPosition = new THREE.Vector3(spawnX, 0.9, spawnZ);
                
                createTheGray(spawnPosition);
            } else {
                console.error("Spawner Error: createTheGray function is not defined.");
            }
        }
        
        // The updateTheGray function in thegray.js already handles updating all enemies,
        // so we don't need to loop through them here. This spawner's only job is to spawn.
    }

    // --- NEW: Method to get all active enemies for saving ---
    getActiveEnemies() {
        // We find the enemies in the global objects array
        return window.objects.filter(obj => obj.userData && obj.userData.isTheGray);
    }

    // --- NEW: Method to recreate enemies from a save file ---
    recreateEnemies(enemyData, scene) {
        // First, remove any existing enemies
        const existingGrays = this.getActiveEnemies();
        existingGrays.forEach(gray => {
            if(gray.parent) gray.parent.remove(gray);
        });

        // Now, create new enemies based on the loaded data
        enemyData.forEach(data => {
            const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
            const gray = createTheGray(position);
            if (gray) {
                gray.health = data.health;
                // You can add more properties to restore here (e.g., isStunned)
            }
        });
    }
}