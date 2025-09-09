export class Ability {
    constructor(vessel, name, cooldown, manaCost) {
        this.vessel = vessel;
        this.name = name;
        this.cooldown = cooldown;
        this.manaCost = manaCost;
        this.lastUsed = -cooldown; // Allow using it immediately
    }

    /**
     * Checks if the ability can be used.
     * @param {THREE.Clock} clock - The game clock to check cooldowns.
     * @returns {boolean} - True if the ability can be used, false otherwise.
     */
    canUse(clock) {
        const now = clock.getElapsedTime();
        if (now - this.lastUsed < this.cooldown) {
            console.log(`${this.name} is on cooldown.`);
            return false;
        }
        if (this.vessel.stats.currentMana < this.manaCost) {
            console.log(`Not enough mana for ${this.name}.`);
            return false;
        }
        return true;
    }

    /**
     * Executes the ability. This should be overridden by child classes.
     * @param {object} options - An object containing necessary parameters like scene, target, etc.
     */
    execute(options) {
        console.log(`Executing base ability ${this.name}. This should be overridden.`);
    }

    /**
     * Marks the ability as used, consuming mana and starting the cooldown.
     * @param {THREE.Clock} clock - The game clock.
     */
    onUse(clock) {
        this.vessel.stats.currentMana -= this.manaCost;
        this.lastUsed = clock.getElapsedTime();
    }
}
