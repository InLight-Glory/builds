export class Projectile {
    constructor(scene, startPosition, target, damage, speed = 30) {
        this.scene = scene;
        this.target = target;
        this.damage = damage;
        this.speed = speed;

        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);

        this.velocity = new THREE.Vector3()
            .subVectors(target.mesh.position, this.mesh.position)
            .normalize()
            .multiplyScalar(this.speed);

        scene.add(this.mesh);
    }

    /**
     * Updates the projectile's position and checks for collision.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @returns {boolean} - True if the projectile should be removed, false otherwise.
     */
    update(deltaTime) {
        // Move the projectile
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;

        // Check for collision
        const distanceToTarget = this.mesh.position.distanceTo(this.target.mesh.position);

        if (distanceToTarget < 1.5) { // Collision threshold
            this.target.takeDamage(this.damage);
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            return true; // Signal for removal
        }

        // Optional: Add a max range check to remove stray projectiles
        // if (this.mesh.position.length() > 200) { ... }

        return false;
    }
}
