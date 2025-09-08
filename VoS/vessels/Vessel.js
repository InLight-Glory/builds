/**
 * Represents a base class for all playable Vessels in the game.
 * This version creates a low-poly humanoid model from basic shapes.
 * Now includes a stat and leveling system.
 */
export class Vessel {
    constructor(scene, options = {}) {
        // Default options
        const { color = 0x00ff00, size = 1.0, speed = 10, mapBounds = 50, type = 'marksman' } = options;

        this.type = type;
        this.level = 1;
        this.stats = {};
        this.statGrowth = {};

        this.initializeStats();

        // A THREE.Group will act as the container for all parts of our model.
        this.mesh = new THREE.Group();
        this.mesh.position.y = 1.5 * size;

        const bodyMaterial = new THREE.MeshStandardMaterial({ color: color, flatShading: true });
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffe0bd, flatShading: true });

        // --- Model creation based on type ---
        let torsoGeo, headGeo, armGeo, legGeo;
        if (type === 'guardian') {
            torsoGeo = new THREE.BoxGeometry(1.4 * size, 1.5 * size, 0.8 * size);
            headGeo = new THREE.IcosahedronGeometry(0.6 * size, 0);
            armGeo = new THREE.BoxGeometry(0.4 * size, 1.4 * size, 0.4 * size);
            legGeo = new THREE.BoxGeometry(0.5 * size, 1.5 * size, 0.5 * size);
        } else { // 'marksman' or default
            torsoGeo = new THREE.BoxGeometry(0.8 * size, 1.6 * size, 0.5 * size);
            headGeo = new THREE.IcosahedronGeometry(0.5 * size, 0);
            armGeo = new THREE.BoxGeometry(0.2 * size, 1.5 * size, 0.2 * size);
            legGeo = new THREE.BoxGeometry(0.25 * size, 1.7 * size, 0.25 * size);
        }
        const torso = new THREE.Mesh(torsoGeo, bodyMaterial);
        torso.position.y = 0;
        torso.castShadow = true;
        this.mesh.add(torso);
        const head = new THREE.Mesh(headGeo, headMaterial);
        head.position.y = 1.25 * size;
        head.castShadow = true;
        this.mesh.add(head);
        const leftArm = new THREE.Mesh(armGeo, bodyMaterial);
        leftArm.position.set(-0.75 * size, 0.1 * size, 0);
        leftArm.castShadow = true;
        this.mesh.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, bodyMaterial);
        rightArm.position.set(0.75 * size, 0.1 * size, 0);
        rightArm.castShadow = true;
        this.mesh.add(rightArm);
        const leftLeg = new THREE.Mesh(legGeo, bodyMaterial);
        leftLeg.position.set(-0.3 * size, -1.5 * size, 0);
        leftLeg.castShadow = true;
        this.mesh.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, bodyMaterial);
        rightLeg.position.set(0.3 * size, -1.5 * size, 0);
        rightLeg.castShadow = true;
        this.mesh.add(rightLeg);
        // --- End of model creation ---

        // Set initial properties
        this.movementSpeed = speed;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mapBoundary = mapBounds - 1;

        // Add the entire group to the main scene
        scene.add(this.mesh);
    }

    /**
     * Sets the initial base stats and stat growth based on the Vessel's archetype.
     */
    initializeStats() {
        if (this.type === 'guardian') {
            this.stats = {
                maxHealth: 650, currentHealth: 650,
                maxMana: 300, currentMana: 300,
                attackDamage: 55,
                armor: 40,
                magicResist: 35,
                attackSpeed: 0.65
            };
            this.statGrowth = {
                health: 95, mana: 40, attackDamage: 2.5, armor: 3.5, magicResist: 1.5, attackSpeed: 0.015
            };
        } else { // 'marksman'
            this.stats = {
                maxHealth: 580, currentHealth: 580,
                maxMana: 280, currentMana: 280,
                attackDamage: 65,
                armor: 28,
                magicResist: 30,
                attackSpeed: 0.70
            };
            this.statGrowth = {
                health: 80, mana: 35, attackDamage: 4.0, armor: 2.5, magicResist: 1.0, attackSpeed: 0.025
            };
        }
    }

    /**
     * Levels up the vessel, increasing its stats.
     */
    levelUp() {
        if (this.level >= 18) return;

        this.level++;
        this.stats.maxHealth += this.statGrowth.health;
        this.stats.maxMana += this.statGrowth.mana;
        this.stats.attackDamage += this.statGrowth.attackDamage;
        this.stats.armor += this.statGrowth.armor;
        this.stats.magicResist += this.statGrowth.magicResist;
        this.stats.attackSpeed += this.statGrowth.attackSpeed;

        // Restore health and mana on level up for simplicity
        this.stats.currentHealth = this.stats.maxHealth;
        this.stats.currentMana = this.stats.maxMana;

        console.log(`${this.type} leveled up to ${this.level}!`, this.stats);
    }

    /**
     * Updates the vessel's state.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {object} keysPressed - An object indicating which keys are currently pressed.
     * @param {THREE.Camera} camera - The scene camera, for calculating movement direction.
     */
    update(deltaTime, keysPressed, camera) {
        // --- Camera-Relative Movement Logic ---
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;
        cameraForward.normalize();

        const cameraRight = new THREE.Vector3().crossVectors(camera.up, cameraForward).normalize();

        const moveDirection = new THREE.Vector3();
        if (keysPressed['w']) moveDirection.add(cameraForward);
        if (keysPressed['s']) moveDirection.sub(cameraForward);
        if (keysPressed['a']) moveDirection.add(cameraRight);
        if (keysPressed['d']) moveDirection.sub(cameraRight);
        
        this.velocity.copy(moveDirection);

        if (this.velocity.lengthSq() > 0) {
            this.velocity.normalize();
            this.mesh.position.x += this.velocity.x * this.movementSpeed * deltaTime;
            this.mesh.position.z += this.velocity.z * this.movementSpeed * deltaTime;

            this.mesh.position.x = Math.max(-this.mapBoundary, Math.min(this.mapBoundary, this.mesh.position.x));
            this.mesh.position.z = Math.max(-this.mapBoundary, Math.min(this.mapBoundary, this.mesh.position.z));

            const lookAtPoint = this.mesh.position.clone().add(this.velocity);
            this.mesh.lookAt(lookAtPoint);
        }
    }
}
