export class Projectile {
    constructor(scene, startPosition, direction, damage, speed = 30, range = 20) {
        this.scene = scene;
        this.damage = damage;
        this.speed = speed;
        this.range = range;
        this.distanceTraveled = 0;

        // Tuning: increases hit reliability in isometric/top-down view without enlarging target hitboxes.
        // This is added to the projectile's own radius during collision checks.
        this.hitForgiveness = 0.75;

        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);

        this.velocity = direction.normalize().multiplyScalar(this.speed);

        scene.add(this.mesh);
    }

    getCollisionRadius() {
        const baseRadius = this.mesh.geometry?.parameters?.radius ?? 0.2;
        const scale = this.mesh.scale?.x ?? 1;
        return baseRadius * scale + this.hitForgiveness;
    }

    static closestPointOnSegment2D(ax, az, bx, bz, px, pz) {
        const abx = bx - ax;
        const abz = bz - az;
        const apx = px - ax;
        const apz = pz - az;
        const abLenSq = abx * abx + abz * abz;
        if (abLenSq === 0) return { x: ax, z: az, t: 0 };
        let t = (apx * abx + apz * abz) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        return { x: ax + abx * t, z: az + abz * t, t };
    }

    /**
     * Updates the projectile's position and checks for collision.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {Array<THREE.Object3D>} targets - An array of potential targets to check for collision.
     * @returns {boolean} - True if the projectile should be removed, false otherwise.
     */
    update(deltaTime, targets) {
        const distanceThisFrame = this.speed * deltaTime;
        const prevX = this.mesh.position.x;
        const prevY = this.mesh.position.y;
        const prevZ = this.mesh.position.z;

        this.mesh.position.x += this.velocity.x * deltaTime;
        this.mesh.position.y += this.velocity.y * deltaTime;
        this.mesh.position.z += this.velocity.z * deltaTime;
        this.distanceTraveled += distanceThisFrame;

        // Check for collision with any target (use body mesh for hit detection)
        // Use a swept XZ-plane test (segment vs circle) to reduce misses due to high speed
        // and isometric perspective ambiguity.
        const projectileRadius = this.getCollisionRadius();
        for (const target of targets) {
            // Assume the first child of target.mesh is the body
            const body = target.mesh.children[0];
            if (body) {
                const bodyWorldPos = body.getWorldPosition(new THREE.Vector3());
                const hitRadius = (body.geometry?.parameters?.radiusTop ?? 2.5) * 1.0001;
                const combinedRadius = hitRadius + projectileRadius;

                // Optional vertical gating so we don't hit targets far above/below the projectile.
                const halfHeight = (body.geometry?.parameters?.height ?? 8) / 2;
                const withinHeight = Math.abs(this.mesh.position.y - bodyWorldPos.y) <= (halfHeight + projectileRadius);
                if (!withinHeight) continue;

                const closest = Projectile.closestPointOnSegment2D(
                    prevX,
                    prevZ,
                    this.mesh.position.x,
                    this.mesh.position.z,
                    bodyWorldPos.x,
                    bodyWorldPos.z
                );
                const dx = closest.x - bodyWorldPos.x;
                const dz = closest.z - bodyWorldPos.z;
                const distSq = dx * dx + dz * dz;
                if (distSq <= combinedRadius * combinedRadius) {
                    target.takeDamage(this.damage);
                    this.destroy();
                    return true; // Signal for removal
                }
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
