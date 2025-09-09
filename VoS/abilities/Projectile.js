export class Projectile {
    constructor(scene, startPosition, direction, damage, speed = 30, range = 50) {
        this.scene = scene;
        this.damage = damage;
        this.speed = speed;
        this.range = range;
        this.distanceTraveled = 0;

        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);

        this.velocity = direction.normalize().multiplyScalar(this.speed);

        scene.add(this.mesh);
    }

    /**
     * Updates the projectile's position and checks for collision.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {Array<THREE.Object3D>} targets - An array of potential targets to check for collision.
     * @returns {boolean} - True if the projectile should be removed, false otherwise.
     */
    update(deltaTime, targets) {
        const distanceThisFrame = this.speed * deltaTime;
        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
        this.distanceTraveled += distanceThisFrame;

        // Check for collision with any target
        for (const target of targets) {
            const distanceToTarget = this.mesh.position.distanceTo(target.mesh.position);
            if (distanceToTarget < 1.5) { // Collision threshold
                target.takeDamage(this.damage);
                this.destroy();
                return true; // Signal for removal
            }
        }

        // Check if projectile has exceeded its range
        if (this.distanceTraveled >= this.range) {
            this.destroy();
            return true; // Signal for removal
        }

        return false;
    }

    /**
     * Removes the projectile from the scene and disposes of its resources.
     */
    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
