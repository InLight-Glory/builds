class TheGraySpawner {
    constructor() {
        this.grays = [];
        this.spawnInterval = 5000; // 5 seconds
        this.lastSpawnTime = 0;
    }

    update(scene, playerPosition) {
        const now = Date.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            this.lastSpawnTime = now;
            // Pass the player's current position to the constructor
            const gray = new TheGray(playerPosition);
            this.grays.push(gray);
            scene.add(gray.mesh);
        }

        this.grays.forEach(gray => gray.update(playerPosition));
    }

    // --- NEW: Method to get all active enemies for saving ---
    getActiveEnemies() {
        return this.grays;
    }

    // --- NEW: Method to recreate enemies from a save file ---
    recreateEnemies(enemyData, scene) {
        // First, remove any existing enemies from the scene and clear the array
        this.grays.forEach(gray => scene.remove(gray.mesh));
        this.grays = [];

        // Now, create new enemies based on the loaded data
        enemyData.forEach(data => {
            // We pass null for playerPosition because we will set it manually
            const gray = new TheGray(null);
            gray.health = data.health;
            gray.mesh.position.set(data.position.x, data.position.y, data.position.z);
            
            this.grays.push(gray);
            scene.add(gray.mesh);
        });
    }
}
