import { Ability } from './Ability.js';
import { Projectile } from './Projectile.js';

export class MeleeAttack extends Ability {
    constructor(vessel, cooldownOverride = null) {
        super(vessel, 'Melee Attack', cooldownOverride ?? 1.0, 0);
    }

    execute(options) {
        const { scene, mouseWorldPosition, clock } = options;

        if (!this.canUse(clock)) return;

        const damage = this.vessel.stats.attackDamage * 1.2;

        // Calculate direction toward mouse from player position
        const playerPos = this.vessel.mesh.position.clone();
        const direction = new THREE.Vector3().subVectors(mouseWorldPosition, playerPos);
        direction.y = 0;
        if (direction.lengthSq() === 0) return;
        direction.normalize();

        // Offset start position 2 units forward so slash appears in front of player
        const startPosition = playerPos.clone().setY(2).add(direction.clone().multiplyScalar(2.0));

        // Melee is a static slash (speed 0) that lasts 0.5s
        const projectile = new Projectile(scene, startPosition, direction, damage, 0, 0, 0.5);
        projectile.overrideRadius = 2.5;

        // Visuals: Create a 1/4 circle slash arc, laid flat on the ground
        projectile.mesh.geometry.dispose();
        // RingGeometry creates arc in XY plane. thetaStart=PI/4, thetaLength=PI/2 → centered on +Y axis.
        // After rotateX(-PI/2), +Y becomes +Z, so arc faces local +Z.
        const slashGeo = new THREE.RingGeometry(2.0, 2.5, 16, 1, Math.PI / 4, Math.PI / 2);
        slashGeo.rotateX(-Math.PI / 2); // Lay flat on XZ ground plane
        projectile.mesh.geometry = slashGeo;

        projectile.mesh.material.color.setHex(0xffffff);
        projectile.mesh.material.side = THREE.DoubleSide;

        // Orient the slash using explicit Y rotation based on world direction.
        // atan2(x, z) gives the angle from +Z toward +X, matching Three.js Y-rotation convention.
        projectile.mesh.rotation.set(0, 0, 0); // Clear any inherited rotation
        projectile.mesh.rotation.y = Math.atan2(direction.x, direction.z);

        this.onUse(clock);

        return projectile;
    }
}
