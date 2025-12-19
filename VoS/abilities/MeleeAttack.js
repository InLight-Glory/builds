import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class MeleeAttack extends Ability {
    constructor(vessel) {
        super(vessel, 'Melee Attack', 1.0, 0); // 1s cooldown
    }

    execute(options) {
        const { scene, mouseWorldPosition, clock } = options;

        if (!this.canUse(clock)) return;

        const damage = this.vessel.stats.attackDamage * 1.2; // Slightly higher base damage

        const startPosition = this.vessel.mesh.position.clone().setY(2);

        const direction = new THREE.Vector3().subVectors(mouseWorldPosition, startPosition);
        direction.y = 0;
        if (direction.lengthSq() === 0) return;
        direction.normalize();

        // Melee "projectile" is short range, slowish (visual swing), and large
        // Range 5 (very short), Speed 20
        const projectile = new Projectile(scene, startPosition, direction, damage, 20, 5);
        projectile.mesh.material.color.setHex(0xffffff); // White slash
        projectile.mesh.scale.set(2.0, 0.5, 2.0); // Broad wide shape

        this.onUse(clock);

        return projectile;
    }
}
