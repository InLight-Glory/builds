import { Projectile } from '../abilities/Projectile.js';

/**
 * Turret — lane defense structure with AI targeting.
 * Priority: aggroPlayer (most recent attacker) → closest enemy minion → enemy vessel.
 * Fires projectiles from the crystal at the top of the tower.
 */
export class Turret {
    constructor(scene, x, z, team) {
        this.scene = scene;
        this.team = team; // 'blue' or 'red'
        this.attackRange = 25;
        this.attackDamage = 45;
        this.attackCooldown = 1.5;
        this.lastAttackTime = 0;
        this.currentTarget = null;
        this.aggroPlayer = null; // Vessel that recently attacked near this turret
        this.alive = true;

        this.stats = {
            maxHealth: 3000,
            currentHealth: 3000,
            armor: 60
        };

        const teamColor = team === 'blue' ? 0x3498db : 0xe74c3c;
        this.mesh = this.buildVisual(teamColor);
        this.mesh.position.set(x, 0, z);
        scene.add(this.mesh);
    }

    buildVisual(teamColor) {
        const group = new THREE.Group();
        const tc = new THREE.Color(teamColor);
        const darkTeam = tc.clone().offsetHSL(0, 0, -0.2);
        const tStone = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true, roughness: 0.9 });
        const tTeam = new THREE.MeshStandardMaterial({ color: teamColor, flatShading: true });
        const tGlow = new THREE.MeshStandardMaterial({ color: teamColor, emissive: teamColor, emissiveIntensity: 0.5, flatShading: true });

        // Base platform
        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 1, 8), tStone);
        base.position.y = 0.5;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        // Tower body
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 7, 8), tStone);
        tower.position.y = 4.5;
        tower.castShadow = true;
        group.add(tower);

        // Team-colored band
        const band = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.5, 8), tTeam);
        band.position.y = 6;
        group.add(band);

        // Battlement crown
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const cren = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.6), tStone);
            cren.position.set(Math.cos(a) * 1.6, 8.5, Math.sin(a) * 1.6);
            group.add(cren);
        }

        // Glowing crystal on top (projectile origin)
        const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), tGlow);
        crystal.position.y = 9.5;
        crystal.castShadow = true;
        group.add(crystal);

        // Roof cone
        const roof = new THREE.Mesh(new THREE.ConeGeometry(2, 2, 8), new THREE.MeshStandardMaterial({ color: darkTeam, flatShading: true }));
        roof.position.y = 10;
        group.add(roof);

        return group;
    }

    /**
     * Updates turret targeting and fires at enemies.
     * @param {number} deltaTime
     * @param {number} elapsedTime
     * @param {Array} enemyMinions - minions from the opposing team
     * @param {Vessel|null} enemyVessel - the enemy player vessel (or null)
     * @returns {Projectile|null} a new projectile if fired, else null
     */
    update(deltaTime, elapsedTime, enemyMinions, enemyVessel) {
        if (!this.alive) return null;

        // 1. Determine target by priority
        this.currentTarget = null;

        // Priority 1: Aggro player (if in range and alive)
        if (this.aggroPlayer && this.isInRange(this.aggroPlayer.mesh.position)) {
            this.currentTarget = this.aggroPlayer;
        } else {
            // Reset aggro if player left range
            this.aggroPlayer = null;

            // Priority 2: Closest enemy minion in range
            let closestDist = this.attackRange;
            for (const minion of enemyMinions) {
                if (!minion.alive) continue;
                const dist = this.mesh.position.distanceTo(minion.mesh.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    this.currentTarget = minion;
                }
            }

            // Priority 3: Enemy vessel if no minions
            if (!this.currentTarget && enemyVessel) {
                if (this.isInRange(enemyVessel.mesh.position)) {
                    this.currentTarget = enemyVessel;
                }
            }
        }

        // 2. Fire at target if off cooldown
        if (this.currentTarget && elapsedTime - this.lastAttackTime >= this.attackCooldown) {
            this.lastAttackTime = elapsedTime;
            return this.fireAtTarget();
        }

        return null;
    }

    isInRange(targetPosition) {
        return this.mesh.position.distanceTo(targetPosition) <= this.attackRange;
    }

    /**
     * Called when an enemy player attacks near this turret's allied units.
     * Sets aggro so turret prioritizes that player.
     */
    setAggro(vessel) {
        this.aggroPlayer = vessel;
    }

    /**
     * Creates and returns a projectile aimed at the current target.
     */
    fireAtTarget() {
        const crystalY = 9.5;
        const startPos = new THREE.Vector3(
            this.mesh.position.x,
            crystalY,
            this.mesh.position.z
        );

        const targetPos = this.currentTarget.mesh.position.clone();
        targetPos.y = crystalY; // Keep projectile level initially
        const direction = new THREE.Vector3().subVectors(targetPos, startPos).normalize();

        const projectile = new Projectile(
            this.scene,
            startPos,
            direction,
            this.attackDamage,
            35,   // speed
            50,   // range
            null  // no lifetime limit — range limited
        );

        projectile.team = this.team;

        // Make turret projectiles visually distinct
        const color = this.team === 'blue' ? 0x3498db : 0xe74c3c;
        projectile.mesh.material.color.setHex(color);
        projectile.mesh.scale.set(1.5, 1.5, 1.5);

        return projectile;
    }

    takeDamage(amount) {
        if (!this.alive) return;
        const effectiveDamage = amount * (100 / (100 + this.stats.armor));
        this.stats.currentHealth -= effectiveDamage;
        if (this.stats.currentHealth <= 0) {
            this.stats.currentHealth = 0;
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.scene.remove(this.mesh);
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}
