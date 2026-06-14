/**
 * Represents a base class for all playable Vessels in the game.
 * This version creates a low-poly humanoid model from basic shapes.
 * Now includes a stat and leveling system.
 */
import { BasicAttack } from '../abilities/BasicAttack.js';
import { ChargeAttack } from '../abilities/ChargeAttack.js';
import { MeleeAttack } from '../abilities/MeleeAttack.js';
import { PsychicAttack } from '../abilities/PsychicAttack.js';

const ABILITY_MAP = {
    'Projectile': BasicAttack,
    'Charge': ChargeAttack,
    'Melee': MeleeAttack,
    'Psychic': PsychicAttack
};

export class Vessel {
    constructor(scene, options = {}) {
        // Default options
        const {
            color = 0x00ff00,
            size = 1.0,
            speed = 10,
            mapBounds = 50,
            type = 'marksman',
            primary = 'Projectile',
            secondary = 'Charge',
            primaryCooldown = 0.5,
            secondaryCooldown = 2.0
        } = options;

        this.type = type;
        this.primaryRequest = primary;
        this.secondaryRequest = secondary;
        this.primaryCooldown = primaryCooldown;
        this.secondaryCooldown = secondaryCooldown;

        this.level = 1;
        this.stats = {};
        this.statGrowth = {};
        this.abilities = {};

        this.initializeStats();
        this.initializeAbilities();

        // A THREE.Group will act as the container for all parts of our model.
        this.mesh = new THREE.Group();
        this.mesh.position.y = 1.5 * size;

        const s = size; // Shorthand
        const bodyMat = new THREE.MeshStandardMaterial({ color, flatShading: true });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, flatShading: true });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, flatShading: true });
        const accentColor = new THREE.Color(color).offsetHSL(0, 0, -0.15);
        const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, flatShading: true });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.6, roughness: 0.3, flatShading: true });
        const glowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4, flatShading: true });

        if (type === 'guardian') {
            // === GUARDIAN — Heavy, armored, wide stance ===

            // Torso — broad chest plate
            const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.4 * s, 0.9 * s), bodyMat);
            torso.castShadow = true;
            this.mesh.add(torso);

            // Chest armor plate — layered on front
            const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.3 * s, 1.0 * s, 0.15 * s), metalMat);
            chestPlate.position.set(0, 0.1 * s, 0.45 * s);
            this.mesh.add(chestPlate);

            // Belt
            const belt = new THREE.Mesh(new THREE.BoxGeometry(1.65 * s, 0.2 * s, 0.95 * s), darkMat);
            belt.position.y = -0.6 * s;
            this.mesh.add(belt);

            // Belt buckle
            const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.25 * s, 0.25 * s, 0.1 * s), glowMat);
            buckle.position.set(0, -0.6 * s, 0.5 * s);
            this.mesh.add(buckle);

            // Shoulder pads — large pauldrons
            [[-1.05, 0.55], [1.05, 0.55]].forEach(([ox, oy]) => {
                const pad = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.35 * s, 0.7 * s), metalMat);
                pad.position.set(ox * s, oy * s, 0);
                pad.castShadow = true;
                this.mesh.add(pad);
                // Spike on top of pauldron
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12 * s, 0.35 * s, 4), metalMat);
                spike.position.set(ox * s, (oy + 0.3) * s, 0);
                this.mesh.add(spike);
            });

            // Arms — thick armored
            [[-0.95, -0.15], [0.95, -0.15]].forEach(([ox, oy]) => {
                // Upper arm
                const upper = new THREE.Mesh(new THREE.BoxGeometry(0.45 * s, 0.7 * s, 0.45 * s), bodyMat);
                upper.position.set(ox * s, oy * s, 0);
                upper.castShadow = true;
                this.mesh.add(upper);
                // Forearm with gauntlet
                const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.65 * s, 0.5 * s), accentMat);
                forearm.position.set(ox * s, (oy - 0.7) * s, 0);
                forearm.castShadow = true;
                this.mesh.add(forearm);
                // Fist
                const fist = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.25 * s, 0.3 * s), skinMat);
                fist.position.set(ox * s, (oy - 1.1) * s, 0);
                this.mesh.add(fist);
            });

            // Legs — armored greaves
            [[-0.4, -1.5], [0.4, -1.5]].forEach(([ox, oy]) => {
                // Thigh
                const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.5 * s, 0.8 * s, 0.5 * s), accentMat);
                thigh.position.set(ox * s, oy * s, 0);
                thigh.castShadow = true;
                this.mesh.add(thigh);
                // Greave (shin guard)
                const greave = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 0.75 * s, 0.55 * s), metalMat);
                greave.position.set(ox * s, (oy - 0.75) * s, 0);
                greave.castShadow = true;
                this.mesh.add(greave);
                // Boot
                const boot = new THREE.Mesh(new THREE.BoxGeometry(0.45 * s, 0.3 * s, 0.7 * s), darkMat);
                boot.position.set(ox * s, (oy - 1.3) * s, 0.1 * s);
                this.mesh.add(boot);
            });

            // Head — helmet with visor slit
            const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.85 * s, 0.8 * s, 0.85 * s), metalMat);
            helmet.position.y = 1.15 * s;
            helmet.castShadow = true;
            this.mesh.add(helmet);
            // Visor slit — dark horizontal strip
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.6 * s, 0.12 * s, 0.1 * s), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
            visor.position.set(0, 1.1 * s, 0.44 * s);
            this.mesh.add(visor);
            // Helmet crest
            const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1 * s, 0.45 * s, 0.65 * s), bodyMat);
            crest.position.set(0, 1.6 * s, 0);
            this.mesh.add(crest);

            // Shield — left hand
            const shield = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 1.1 * s, 0.8 * s), bodyMat);
            shield.position.set(-1.35 * s, -0.3 * s, 0.2 * s);
            shield.castShadow = true;
            this.mesh.add(shield);
            // Shield emblem
            const emblem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18 * s, 0), glowMat);
            emblem.position.set(-1.42 * s, -0.15 * s, 0.2 * s);
            this.mesh.add(emblem);

        } else {
            // === MARKSMAN — Lean, agile, ranged weapon ===

            // Torso — slimmer, layered tunic
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9 * s, 1.5 * s, 0.55 * s), bodyMat);
            torso.castShadow = true;
            this.mesh.add(torso);

            // Chest strap / bandolier — diagonal
            const strap = new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 1.5 * s, 0.12 * s), darkMat);
            strap.position.set(-0.15 * s, 0, 0.3 * s);
            strap.rotation.z = 0.4;
            this.mesh.add(strap);

            // Belt
            const belt = new THREE.Mesh(new THREE.BoxGeometry(0.95 * s, 0.15 * s, 0.6 * s), darkMat);
            belt.position.y = -0.65 * s;
            this.mesh.add(belt);

            // Belt pouch
            const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.2 * s, 0.15 * s), accentMat);
            pouch.position.set(0.4 * s, -0.65 * s, 0.35 * s);
            this.mesh.add(pouch);

            // Shoulder pads — smaller, asymmetric
            const leftPad = new THREE.Mesh(new THREE.BoxGeometry(0.4 * s, 0.2 * s, 0.45 * s), accentMat);
            leftPad.position.set(-0.65 * s, 0.65 * s, 0);
            leftPad.castShadow = true;
            this.mesh.add(leftPad);
            // Right shoulder — no pad (shooting arm)

            // Arms
            [[-0.65, 0], [0.65, 0]].forEach(([ox, oy]) => {
                const upper = new THREE.Mesh(new THREE.BoxGeometry(0.25 * s, 0.7 * s, 0.25 * s), bodyMat);
                upper.position.set(ox * s, oy * s, 0);
                upper.castShadow = true;
                this.mesh.add(upper);
                // Forearm — wrapped
                const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.22 * s, 0.65 * s, 0.22 * s), accentMat);
                forearm.position.set(ox * s, (oy - 0.7) * s, 0);
                this.mesh.add(forearm);
                // Hand
                const hand = new THREE.Mesh(new THREE.BoxGeometry(0.18 * s, 0.18 * s, 0.18 * s), skinMat);
                hand.position.set(ox * s, (oy - 1.1) * s, 0);
                this.mesh.add(hand);
            });

            // Legs — lean, with knee guards
            [[-0.25, -1.4], [0.25, -1.4]].forEach(([ox, oy]) => {
                const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.3 * s, 0.85 * s, 0.3 * s), accentMat);
                thigh.position.set(ox * s, oy * s, 0);
                thigh.castShadow = true;
                this.mesh.add(thigh);
                // Knee guard
                const knee = new THREE.Mesh(new THREE.BoxGeometry(0.2 * s, 0.15 * s, 0.15 * s), metalMat);
                knee.position.set(ox * s, (oy - 0.35) * s, 0.2 * s);
                this.mesh.add(knee);
                // Shin
                const shin = new THREE.Mesh(new THREE.BoxGeometry(0.28 * s, 0.7 * s, 0.28 * s), bodyMat);
                shin.position.set(ox * s, (oy - 0.8) * s, 0);
                this.mesh.add(shin);
                // Boot
                const boot = new THREE.Mesh(new THREE.BoxGeometry(0.25 * s, 0.25 * s, 0.45 * s), darkMat);
                boot.position.set(ox * s, (oy - 1.35) * s, 0.08 * s);
                this.mesh.add(boot);
            });

            // Head — hood/cowl
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 0.6 * s, 0.6 * s), skinMat);
            head.position.y = 1.15 * s;
            head.castShadow = true;
            this.mesh.add(head);
            // Hood
            const hood = new THREE.Mesh(new THREE.BoxGeometry(0.7 * s, 0.5 * s, 0.7 * s), accentMat);
            hood.position.set(0, 1.35 * s, -0.05 * s);
            this.mesh.add(hood);
            // Eyes — two glowing dots
            [[-0.15, 1.1, 0.32], [0.15, 1.1, 0.32]].forEach(([ex, ey, ez]) => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06 * s, 6, 6), glowMat);
                eye.position.set(ex * s, ey * s, ez * s);
                this.mesh.add(eye);
            });

            // Weapon — longbow or rifle shape on back + held crossbow
            // Back weapon (slung)
            const bowStave = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * s, 0.04 * s, 2.0 * s, 4), darkMat);
            bowStave.position.set(0.15 * s, 0.3 * s, -0.35 * s);
            bowStave.rotation.z = 0.2;
            this.mesh.add(bowStave);

            // Held weapon — small crossbow/pistol in right hand
            const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 0.12 * s, 0.5 * s), metalMat);
            gunBody.position.set(0.65 * s, -1.0 * s, 0.25 * s);
            this.mesh.add(gunBody);
            const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * s, 0.03 * s, 0.4 * s, 4), darkMat);
            gunBarrel.rotation.x = Math.PI / 2;
            gunBarrel.position.set(0.65 * s, -0.95 * s, 0.5 * s);
            this.mesh.add(gunBarrel);
        }
        // --- End of model creation ---

        // Set initial properties
        this.movementSpeed = speed;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mapBoundary = mapBounds - 1;

        // Add the entire group to the main scene
        scene.add(this.mesh);
    }

    /**
     * Creates instances of the vessel's abilities.
     */
    initializeAbilities() {
        const PrimaryClass = ABILITY_MAP[this.primaryRequest] || BasicAttack;
        const SecondaryClass = ABILITY_MAP[this.secondaryRequest] || ChargeAttack;

        this.abilities.lmb = new PrimaryClass(this, this.primaryCooldown);
        this.abilities.rmb = new SecondaryClass(this, this.secondaryCooldown);
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
     * Applies damage to this vessel, reduced by armor.
     */
    takeDamage(amount) {
        const effectiveDamage = amount * (100 / (100 + this.stats.armor));
        this.stats.currentHealth -= effectiveDamage;
        if (this.stats.currentHealth <= 0) {
            this.stats.currentHealth = 0;
            // TODO: death/respawn logic
        }
    }

    /**
     * Updates the vessel's state.
     * @param {number} deltaTime - The time elapsed since the last frame.
     * @param {object} keysPressed - An object indicating which keys are currently pressed.
     * @param {THREE.Camera} camera - The scene camera, for calculating movement direction.
     * @param {THREE.Vector3} mouseWorldPosition - The 3D position of the mouse on the ground plane.
     */
    update(deltaTime, keysPressed, camera, mouseWorldPosition) {
        // --- Rotation Logic ---
        if (mouseWorldPosition) {
            this.mesh.lookAt(new THREE.Vector3(mouseWorldPosition.x, this.mesh.position.y, mouseWorldPosition.z));
        }

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
        }
    }
}
