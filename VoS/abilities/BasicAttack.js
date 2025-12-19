import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class BasicAttack extends Ability {
    constructor(vessel) {
        super(vessel, 'Basic Attack', 0.5, 0);
    }

    /**
     * Executes the basic attack, firing a projectile in a given direction.
     * @param {object} options - Contains scene, mouseWorldPosition, clock.
     */
    execute(options) {
        const { scene, mouseWorldPosition, clock } = options;

        if (!this.canUse(clock)) return;

        // Calculate damage
        // For a basic attack, the target isn't known on fire, so we use base damage.
        // The projectile will handle applying it with mitigation later.
        const damage = this.vessel.stats.attackDamage;

        const startPosition = this.vessel.mesh.position.clone().setY(2);

        // Calculate direction from vessel to the mouse cursor position on the ground
        const direction = new THREE.Vector3().subVectors(mouseWorldPosition, startPosition);
        // In an isometric/top-down game we typically shoot along the ground plane.
        // Using the full 3D vector makes shots travel downward toward y=0 and miss tall targets.
        direction.y = 0;
        if (direction.lengthSq() === 0) return;
        direction.normalize();

        // Create a new projectile
        const newProjectile = new Projectile(scene, startPosition, direction, damage);

        this.onUse(clock);

        return newProjectile;
    }
}
