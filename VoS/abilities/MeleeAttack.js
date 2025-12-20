import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class MeleeAttack extends Ability {
    constructor(vessel, cooldownOverride = null) {
        super(vessel, 'Melee Attack', cooldownOverride ?? 1.0, 0);
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

        // Melee is a static slash (speed 0) that lasts 0.5s
        // Projectile signature: scene, start, dir, damage, speed, range, lifetime
        const projectile = new Projectile(scene, startPosition, direction, damage, 0, 0, 0.5);
        projectile.overrideRadius = 2.5;

        // Visuals: Create a 1/4 circle slash effect
        projectile.mesh.geometry.dispose();
        // RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength)
        // Arc centered on +Y (Forward). Width PI/2 (90 deg). Start at PI/4 (45 deg) to end at 3PI/4 (135 deg).
        const slashGeo = new THREE.RingGeometry(2.0, 2.5, 16, 1, Math.PI / 4, Math.PI / 2);
        slashGeo.rotateX(-Math.PI / 2); // Lay flat on ground
        projectile.mesh.geometry = slashGeo;

        projectile.mesh.material.color.setHex(0xffffff); // White slash
        projectile.mesh.material.side = THREE.DoubleSide;

        // Align the mesh so its local +Z faces the travel direction
        projectile.mesh.lookAt(startPosition.clone().add(direction));

        this.onUse(clock);

        return projectile;
    }
}
