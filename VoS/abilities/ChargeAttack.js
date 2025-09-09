import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class ChargeAttack extends Ability {
    constructor(vessel) {
        // This attack has a longer cooldown and higher damage potential
        super(vessel, 'Charge Attack', 2.0, 15); // 2 second cooldown, 15 mana cost
    }

    /**
     * Executes the charge attack, firing a more powerful projectile.
     * @param {object} options - Contains scene, mouseWorldPosition, clock.
     */
    execute(options) {
        const { scene, mouseWorldPosition, clock } = options;

        if (!this.canUse(clock)) return;

        // This attack deals base damage + a percentage of attack damage
        const damage = this.vessel.stats.attackDamage * 1.5; // 150% AD

        const startPosition = this.vessel.mesh.position.clone().setY(2);

        const direction = new THREE.Vector3()
            .subVectors(mouseWorldPosition, startPosition)
            .normalize();

        // Create a new, slightly different projectile to distinguish it
        const projectile = new Projectile(scene, startPosition, direction, damage, 40, 60); // Faster, longer range
        projectile.mesh.material.color.setHex(0xff8800); // Orange color
        projectile.mesh.scale.set(1.5, 1.5, 1.5); // Larger size

        this.onUse(clock);

        return projectile;
    }
}
