import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class BasicAttack extends Ability {
    constructor(vessel) {
        // Basic attacks typically have no cooldown or mana cost in MOBAs
        super(vessel, 'Basic Attack', 0.5, 0);
        // Adding a small cooldown to prevent spamming projectiles too fast
    }

    /**
     * Executes the basic attack, firing a projectile.
     * @param {object} options - Contains scene, target.
     */
    execute(options) {
        const { scene, target, clock } = options;

        if (!this.canUse(clock)) return;

        // Calculate damage based on formula
        const damage = this.vessel.stats.attackDamage * (100 / (100 + target.stats.armor));

        // Create a new projectile
        const startPosition = this.vessel.mesh.position.clone().setY(2);
        const newProjectile = new Projectile(scene, startPosition, target, damage);

        // Use the onUse method from the parent class to handle cooldown
        this.onUse(clock);

        // Return the projectile so it can be added to the main list
        return newProjectile;
    }
}
