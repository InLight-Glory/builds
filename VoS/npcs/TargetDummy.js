export class TargetDummy {
    constructor(scene, position) {
        this.scene = scene;
        this.stats = {
            maxHealth: 1000,
            currentHealth: 1000,
            armor: 30,
        };

        // Main group for the dummy
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);

        // Body of the dummy
        const bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        this.mesh.add(body);

        // Health bar background
        const healthBarBGGeometry = new THREE.PlaneGeometry(4, 0.4);
        const healthBarBGMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.healthBarBG = new THREE.Mesh(healthBarBGGeometry, healthBarBGMaterial);
        this.healthBarBG.position.y = 4.5;
        this.mesh.add(this.healthBarBG);

        // Health bar foreground
        const healthBarGeometry = new THREE.PlaneGeometry(4, 0.4);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.y = 4.5;
        this.healthBar.position.z = 0.01; // Slightly in front to avoid z-fighting
        this.mesh.add(this.healthBar);

        // Add to the scene
        scene.add(this.mesh);
    }

    /**
     * Reduces the dummy's health and updates its health bar.
     * @param {number} damage - The amount of damage to take.
     */
    takeDamage(damage) {
        this.stats.currentHealth -= damage;
        if (this.stats.currentHealth < 0) {
            this.stats.currentHealth = 0;
        }
        console.log(`Dummy took ${damage} damage, ${this.stats.currentHealth} HP remaining.`);
        this.updateHealthBar();

        if (this.stats.currentHealth === 0) {
            // Optional: Handle "death" - maybe respawn after a delay
            setTimeout(() => {
                this.stats.currentHealth = this.stats.maxHealth;
                this.updateHealthBar();
                console.log("Dummy has respawned.");
            }, 3000);
        }
    }

    /**
     * Updates the visual health bar based on current health percentage.
     */
    updateHealthBar() {
        const healthPercent = this.stats.currentHealth / this.stats.maxHealth;
        this.healthBar.scale.x = healthPercent;
        // Position the health bar so it drains from the right
        this.healthBar.position.x = -2 * (1 - healthPercent);

        // Change color based on health
        if (healthPercent < 0.3) {
            this.healthBar.material.color.setHex(0xff0000); // Red
        } else if (healthPercent < 0.6) {
            this.healthBar.material.color.setHex(0xffff00); // Yellow
        } else {
            this.healthBar.material.color.setHex(0x00ff00); // Green
        }
    }
}
