/**
 * Represents a base class for all playable Vessels in the game.
 * For this prototype, it creates a simple mesh to represent the character.
 */
class Vessel {
    constructor(scene, color = 0x00ff00) {
        // Create the 3D object for the Vessel
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16); // Radius, Height, Segments
        const material = new THREE.MeshStandardMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);

        // Set initial properties
        this.mesh.position.y = 1; // Place it on top of the ground plane
        this.movementSpeed = 10; // Units per second
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Add the vessel's mesh to the main scene
        scene.add(this.mesh);
    }

    /**
     * Updates the vessel's state.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {object} keysPressed - An object indicating which keys are currently pressed.
     */
    update(deltaTime, keysPressed) {
        // Reset velocity before calculating new movement
        this.velocity.set(0, 0, 0);

        // Calculate movement direction based on key presses
        if (keysPressed['w']) {
            this.velocity.z -= 1;
        }
        if (keysPressed['s']) {
            this.velocity.z += 1;
        }
        if (keysPressed['a']) {
            this.velocity.x -= 1;
        }
        if (keysPressed['d']) {
            this.velocity.x += 1;
        }

        // Normalize the velocity vector to ensure consistent speed in all directions
        if (this.velocity.length() > 0) {
            this.velocity.normalize();
        }

        // Apply movement
        this.mesh.position.x += this.velocity.x * this.movementSpeed * deltaTime;
        this.mesh.position.z += this.velocity.z * this.movementSpeed * deltaTime;
    }
}
