/**
 * Represents a base class for all playable Vessels in the game.
 * This version creates a low-poly humanoid model from basic shapes.
 * Now accepts size and speed parameters for creating different archetypes.
 */
class Vessel {
    constructor(scene, options = {}) {
        // Default options
        const { color = 0x00ff00, size = 1.0, speed = 10, mapBounds = 50 } = options;

        // A THREE.Group will act as the container for all parts of our model.
        this.mesh = new THREE.Group();
        this.mesh.position.y = 1.5 * size; // Adjust base position based on size

        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color, flatShading: true });
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd, flatShading: true }); // A simple skin tone

        // Torso
        const torsoGeometry = new THREE.BoxGeometry(1 * size, 1.5 * size, 0.5 * size);
        const torso = new THREE.Mesh(torsoGeometry, bodyMaterial);
        torso.position.y = 0;
        torso.castShadow = true;
        this.mesh.add(torso);

        // Head
        const headGeometry = new THREE.IcosahedronGeometry(0.5 * size, 0);
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.25 * size;
        head.castShadow = true;
        this.mesh.add(head);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.25 * size, 1.2 * size, 0.25 * size);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.75 * size, 0.1 * size, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.75 * size, 0.1 * size, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3 * size, 1.5 * size, 0.3 * size);
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.3 * size, -1.5 * size, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.3 * size, -1.5 * size, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);

        // Set initial properties
        this.movementSpeed = speed;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mapBoundary = mapBounds - 1; // A little less than half the map size to keep model fully on plane

        // Add the entire group to the main scene
        scene.add(this.mesh);
    }

    /**
     * Updates the vessel's state.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {object} keysPressed - An object indicating which keys are currently pressed.
     * @param {THREE.Camera} camera - The scene camera, for calculating movement direction.
     */
    update(deltaTime, keysPressed, camera) {
        // --- Camera-Relative Movement Logic ---

        // Get the forward and right direction vectors from the camera
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        cameraForward.y = 0; // Project onto the XZ plane
        cameraForward.normalize();

        const cameraRight = new THREE.Vector3().crossVectors(camera.up, cameraForward).normalize();

        // Calculate the move direction based on keys and camera orientation
        const moveDirection = new THREE.Vector3();
        if (keysPressed['w']) {
            moveDirection.add(cameraForward);
        }
        if (keysPressed['s']) {
            moveDirection.sub(cameraForward);
        }
        if (keysPressed['a']) {
            moveDirection.add(cameraRight);
        }
        if (keysPressed['d']) {
            moveDirection.sub(cameraRight);
        }
        
        this.velocity.copy(moveDirection);

        // If there is movement, normalize the velocity and apply it
        if (this.velocity.lengthSq() > 0) {
            this.velocity.normalize();

            // Apply movement
            this.mesh.position.x += this.velocity.x * this.movementSpeed * deltaTime;
            this.mesh.position.z += this.velocity.z * this.movementSpeed * deltaTime;

            // --- Boundary Check ---
            // A simple square boundary check is sufficient for this prototype
            this.mesh.position.x = Math.max(-this.mapBoundary, Math.min(this.mapBoundary, this.mesh.position.x));
            this.mesh.position.z = Math.max(-this.mapBoundary, Math.min(this.mapBoundary, this.mesh.position.z));

            // Make the model look in the direction of movement
            const lookAtPoint = this.mesh.position.clone().add(this.velocity);
            this.mesh.lookAt(lookAtPoint);
        }
    }
}
