import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class PsychicAttack extends Ability {
    constructor(vessel, cooldownOverride = null) {
        super(vessel, 'Psychic Attack', cooldownOverride ?? 0.8, 10); // 0.8s cooldown, 10 mana
    }

    execute(options) {
        const { scene, mouseWorldPosition, clock } = options;

        if (!this.canUse(clock)) return;

        const damage = this.vessel.stats.attackDamage * 0.9;

        const startPosition = this.vessel.mesh.position.clone().setY(2);

        const direction = new THREE.Vector3().subVectors(mouseWorldPosition, startPosition);
        direction.y = 0;
        if (direction.lengthSq() === 0) return;
        direction.normalize();

        // Psychic is fast, purple, middle range
        const projectile = new Projectile(scene, startPosition, direction, damage, 35, 30);
        projectile.mesh.material.color.setHex(0xa29bfe); // Light purple
        projectile.mesh.scale.set(0.8, 0.8, 0.8);

        // Maybe make it a sphere instead of a box?
        // Current Projectile class creates a default BoxGeometry. 
        // We can modify the mesh geometry here if we want, but Projectile class might overwrite it on update?? 
        // No, Projectile constructor creates the mesh. We can swap geometry.
        projectile.mesh.geometry = new THREE.IcosahedronGeometry(0.5, 1);

        this.onUse(clock);

        return projectile;
    }
}
