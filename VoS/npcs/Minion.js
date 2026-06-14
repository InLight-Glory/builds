/**
 * Represents a lane minion that follows waypoints toward the enemy base.
 * Minions auto-attack enemy minions when within range.
 * Includes pooled attack slash visuals and death animation with object pooling.
 */

// --- Module-level slash pool (shared across all minions) ---
const SLASH_POOL_SIZE = 20;
const slashPool = [];
const activeSlashes = []; // { mesh, timer }
let sharedSlashGeo = null;
let sharedSlashMat = null;

function initSlashPool(scene) {
    if (sharedSlashGeo) return; // Already initialized
    sharedSlashGeo = new THREE.RingGeometry(0.5, 0.8, 8, 1, Math.PI / 4, Math.PI / 2);
    sharedSlashGeo.rotateX(-Math.PI / 2);
    sharedSlashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    for (let i = 0; i < SLASH_POOL_SIZE; i++) {
        const mesh = new THREE.Mesh(sharedSlashGeo, sharedSlashMat.clone());
        mesh.visible = false;
        scene.add(mesh);
        slashPool.push(mesh);
    }
}

function spawnSlash(position, direction) {
    if (slashPool.length === 0) return;
    const mesh = slashPool.pop();
    mesh.position.copy(position);
    mesh.position.y = 1.0;
    mesh.lookAt(position.clone().add(direction));
    mesh.visible = true;
    mesh.material.opacity = 0.8;
    activeSlashes.push({ mesh, timer: 0.3 });
}

/**
 * Call from the game loop to update all active slash effects.
 */
export function updateMinionSlashes(deltaTime) {
    for (let i = activeSlashes.length - 1; i >= 0; i--) {
        const slash = activeSlashes[i];
        slash.timer -= deltaTime;
        // Fade out
        slash.mesh.material.opacity = Math.max(0, slash.timer / 0.3) * 0.8;
        if (slash.timer <= 0) {
            slash.mesh.visible = false;
            slashPool.push(slash.mesh);
            activeSlashes.splice(i, 1);
        }
    }
}

export class Minion {
    constructor(scene, options = {}) {
        const {
            team = 'blue',       // 'blue' or 'red'
            waypoints = [],      // Array of THREE.Vector3 positions to follow
            speed = 6,
            damage = 12,
            attackRange = 5,
            attackCooldown = 1.2
        } = options;

        this.scene = scene;
        this.team = team;
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
        this.speed = speed;
        this.damage = damage;
        this.attackRange = attackRange;
        this.attackCooldown = attackCooldown;
        this.lastAttackTime = 0;
        this.alive = true;
        this.target = null; // Current enemy minion to attack

        // Death animation state machine
        this.state = 'alive'; // 'alive' | 'dying_scatter' | 'dying_sink' | 'pooled'
        this.deathTimer = 0;
        this.scatterVelocities = [];
        this.originalChildPositions = [];
        this.originalChildRotations = [];

        this.stats = {
            maxHealth: 300,
            currentHealth: 300,
            armor: 10
        };

        // Initialize slash pool on first minion creation
        initSlashPool(scene);

        // --- Visual Model ---
        this.mesh = new THREE.Group();

        const teamColor = team === 'blue' ? 0x3498db : 0xe74c3c;
        const teamDark = team === 'blue' ? 0x2471a3 : 0xa93226;
        const teamLight = team === 'blue' ? 0x5dade2 : 0xf1948a;
        const bodyMat = new THREE.MeshStandardMaterial({ color: teamColor, flatShading: true });
        const armorMat = new THREE.MeshStandardMaterial({ color: teamDark, flatShading: true });
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.5, roughness: 0.4, flatShading: true });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, flatShading: true });

        // Torso — small armored chest
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.35), bodyMat);
        torso.position.y = 0.85;
        torso.castShadow = true;
        this.mesh.add(torso);

        // Chest plate
        const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.08), metalMat);
        chestPlate.position.set(0, 0.9, 0.2);
        this.mesh.add(chestPlate);

        // Belt
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.38), darkMat);
        belt.position.y = 0.48;
        this.mesh.add(belt);

        // Shoulder pads
        [[-0.38, 1.1], [0.38, 1.1]].forEach(([ox, oy]) => {
            const pad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.3), metalMat);
            pad.position.set(ox, oy, 0);
            this.mesh.add(pad);
        });

        // Arms
        [[-0.38, 0.7], [0.38, 0.7]].forEach(([ox, oy]) => {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), bodyMat);
            arm.position.set(ox, oy, 0);
            arm.castShadow = true;
            this.mesh.add(arm);
            const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinMat);
            hand.position.set(ox, oy - 0.32, 0);
            this.mesh.add(hand);
        });

        // Legs with boots
        [[-0.14, 0.22], [0.14, 0.22]].forEach(([ox, oy]) => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.16), armorMat);
            leg.position.set(ox, oy, 0);
            leg.castShadow = true;
            this.mesh.add(leg);
            const boot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.22), darkMat);
            boot.position.set(ox, 0.02, 0.03);
            this.mesh.add(boot);
        });

        // Head — helmet with face guard
        const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.38), metalMat);
        helmet.position.y = 1.4;
        helmet.castShadow = true;
        this.mesh.add(helmet);
        // Visor slit
        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.06, 0.05),
            new THREE.MeshBasicMaterial({ color: teamLight })
        );
        visor.position.set(0, 1.37, 0.2);
        this.mesh.add(visor);
        // Helmet plume — small colored crest
        const plume = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.22), bodyMat);
        plume.position.set(0, 1.7, 0);
        this.mesh.add(plume);

        // Shield — left arm (rounded rectangle)
        const shield = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.4), armorMat);
        shield.position.set(-0.52, 0.8, 0.1);
        shield.castShadow = true;
        this.mesh.add(shield);
        // Shield boss (center bump)
        const boss = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), metalMat);
        boss.position.set(-0.57, 0.8, 0.1);
        this.mesh.add(boss);
        // Shield trim
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.58, 0.43), metalMat);
        trim.position.set(-0.56, 0.8, 0.1);
        this.mesh.add(trim);

        // Spear — right hand (long pole + tip)
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 2.2, 4),
            new THREE.MeshStandardMaterial({ color: 0x8B6914, flatShading: true })
        );
        pole.position.set(0.42, 1.1, 0.15);
        this.mesh.add(pole);
        // Spear tip
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), metalMat);
        tip.position.set(0.42, 2.25, 0.15);
        this.mesh.add(tip);

        // --- Health Bar ---
        const hpBarWidth = 1.2;
        const hpBgGeo = new THREE.PlaneGeometry(hpBarWidth, 0.15);
        const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.healthBarBG = new THREE.Mesh(hpBgGeo, hpBgMat);
        this.healthBarBG.position.y = 2.0;
        this.mesh.add(this.healthBarBG);

        const hpFgGeo = new THREE.PlaneGeometry(hpBarWidth, 0.15);
        const hpFgMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(hpFgGeo, hpFgMat);
        this.healthBar.position.y = 2.0;
        this.healthBar.position.z = 0.01;
        this.mesh.add(this.healthBar);

        // Store original positions for reset after death animation
        this.mesh.children.forEach(child => {
            this.originalChildPositions.push(child.position.clone());
            this.originalChildRotations.push(child.rotation.clone());
        });

        // Place at first waypoint
        if (waypoints.length > 0) {
            this.mesh.position.copy(waypoints[0]);
        }

        scene.add(this.mesh);
    }

    /**
     * Updates the minion: moves along waypoints or attacks nearby enemies.
     */
    update(deltaTime, elapsedTime, enemyMinions) {
        if (this.state === 'dying_scatter' || this.state === 'dying_sink') {
            this.updateDeath(deltaTime);
            return;
        }
        if (!this.alive) return;

        // Make health bars face camera (billboard effect)
        this.healthBarBG.lookAt(
            this.mesh.position.x + 25,
            this.mesh.position.y + 27,
            this.mesh.position.z + 25
        );
        this.healthBar.lookAt(
            this.mesh.position.x + 25,
            this.mesh.position.y + 27,
            this.mesh.position.z + 25
        );

        // Check for nearby enemy minions to fight
        this.target = this.findClosestEnemy(enemyMinions);

        if (this.target) {
            // Face the target
            this.mesh.lookAt(new THREE.Vector3(
                this.target.mesh.position.x,
                this.mesh.position.y,
                this.target.mesh.position.z
            ));

            const dist = this.mesh.position.distanceTo(this.target.mesh.position);
            if (dist <= this.attackRange) {
                // Attack if in range and off cooldown
                if (elapsedTime - this.lastAttackTime >= this.attackCooldown) {
                    this.target.takeDamage(this.damage);
                    this.lastAttackTime = elapsedTime;

                    // Spawn slash visual toward target
                    const dir = new THREE.Vector3().subVectors(
                        this.target.mesh.position, this.mesh.position
                    );
                    dir.y = 0;
                    dir.normalize();
                    const slashPos = this.mesh.position.clone().add(dir.clone().multiplyScalar(1.0));
                    spawnSlash(slashPos, dir);
                }
            } else {
                // Move toward enemy
                this.moveToward(this.target.mesh.position, deltaTime);
            }
        } else {
            // No enemies — follow waypoints
            this.followWaypoints(deltaTime);
        }
    }

    /**
     * Finds the closest living enemy minion within detection range.
     */
    findClosestEnemy(enemyMinions) {
        const detectionRange = 12;
        let closest = null;
        let closestDist = detectionRange;

        for (const enemy of enemyMinions) {
            if (!enemy.alive) continue;
            const dist = this.mesh.position.distanceTo(enemy.mesh.position);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        return closest;
    }

    /**
     * Moves the minion along its waypoint path.
     */
    followWaypoints(deltaTime) {
        if (this.currentWaypointIndex >= this.waypoints.length) return;

        const target = this.waypoints[this.currentWaypointIndex];
        const dist = this.mesh.position.distanceTo(target);

        if (dist < 1.5) {
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.waypoints.length) return;
        }

        this.moveToward(this.waypoints[this.currentWaypointIndex] || target, deltaTime);
    }

    /**
     * Moves toward a target position and faces it.
     */
    moveToward(targetPos, deltaTime) {
        const direction = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
        direction.y = 0;
        if (direction.lengthSq() < 0.01) return;

        direction.normalize();
        this.mesh.position.x += direction.x * this.speed * deltaTime;
        this.mesh.position.z += direction.z * this.speed * deltaTime;

        // Face movement direction
        this.mesh.lookAt(new THREE.Vector3(
            this.mesh.position.x + direction.x,
            this.mesh.position.y,
            this.mesh.position.z + direction.z
        ));
    }

    /**
     * Applies damage to this minion.
     */
    takeDamage(amount) {
        if (!this.alive) return;

        const effectiveDamage = amount * (100 / (100 + this.stats.armor));
        this.stats.currentHealth -= effectiveDamage;

        if (this.stats.currentHealth <= 0) {
            this.stats.currentHealth = 0;
            this.die();
        }

        this.updateHealthBar();
    }

    updateHealthBar() {
        const pct = this.stats.currentHealth / this.stats.maxHealth;
        this.healthBar.scale.x = Math.max(pct, 0);
        this.healthBar.position.x = -0.6 * (1 - pct);

        if (pct < 0.3) {
            this.healthBar.material.color.setHex(0xff0000);
        } else if (pct < 0.6) {
            this.healthBar.material.color.setHex(0xffff00);
        } else {
            this.healthBar.material.color.setHex(0x00ff00);
        }
    }

    /**
     * Begins the death animation instead of instantly removing.
     */
    die() {
        this.alive = false;
        this.state = 'dying_scatter';
        this.deathTimer = 0;

        // Hide health bars
        this.healthBarBG.visible = false;
        this.healthBar.visible = false;

        // Generate random scatter velocities for each child piece
        this.scatterVelocities = [];
        for (const child of this.mesh.children) {
            this.scatterVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 8,
                Math.random() * 6 + 3,
                (Math.random() - 0.5) * 8
            ));
        }
    }

    /**
     * Runs the death animation each frame.
     */
    updateDeath(deltaTime) {
        this.deathTimer += deltaTime;

        if (this.state === 'dying_scatter') {
            // Scatter phase: children fly outward with gravity (0.6s)
            const gravity = -20;
            const children = this.mesh.children;
            for (let i = 0; i < children.length; i++) {
                const vel = this.scatterVelocities[i];
                if (!vel) continue;
                children[i].position.x += vel.x * deltaTime;
                children[i].position.y += vel.y * deltaTime;
                children[i].position.z += vel.z * deltaTime;
                vel.y += gravity * deltaTime;

                // Tumble rotation
                children[i].rotation.x += deltaTime * 5;
                children[i].rotation.z += deltaTime * 3;
            }

            if (this.deathTimer >= 0.6) {
                this.state = 'dying_sink';
                this.deathTimer = 0;
            }
        } else if (this.state === 'dying_sink') {
            // Sink phase: entire mesh sinks below ground (0.8s)
            this.mesh.position.y -= deltaTime * 6;

            if (this.deathTimer >= 0.8) {
                this.state = 'pooled';
                this.mesh.visible = false;
                this.scene.remove(this.mesh);
            }
        }
    }

    /**
     * Resets a pooled minion for reuse in a new wave.
     */
    reset(waypoints) {
        // Restore child positions and rotations
        const children = this.mesh.children;
        for (let i = 0; i < children.length; i++) {
            if (this.originalChildPositions[i]) {
                children[i].position.copy(this.originalChildPositions[i]);
            }
            if (this.originalChildRotations[i]) {
                children[i].rotation.copy(this.originalChildRotations[i]);
            }
        }

        // Reset state
        this.alive = true;
        this.state = 'alive';
        this.deathTimer = 0;
        this.scatterVelocities = [];
        this.stats.currentHealth = this.stats.maxHealth;
        this.currentWaypointIndex = 0;
        this.waypoints = waypoints;
        this.target = null;
        this.lastAttackTime = 0;

        // Reset health bar
        this.healthBarBG.visible = true;
        this.healthBar.visible = true;
        this.healthBar.scale.x = 1;
        this.healthBar.position.x = 0;
        this.healthBar.material.color.setHex(0x00ff00);

        // Place at first waypoint
        if (waypoints.length > 0) {
            this.mesh.position.copy(waypoints[0]);
        }
        this.mesh.position.y = 0;
        this.mesh.visible = true;

        if (!this.mesh.parent) {
            this.scene.add(this.mesh);
        }
    }
}
