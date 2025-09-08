/**
 * This module manages the creation and behavior of collectible items (orbs).
 */

export const orbs = [];
const orbGeometry = new THREE.SphereGeometry(0.7, 16, 16);
const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0xf1c40f,
    emissive: 0xf1c40f,
    emissiveIntensity: 1,
});

/**
 * Creates a specified number of orbs and adds them to the scene.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {number} count - The number of orbs to create.
 * @param {number} mapSize - The size of the map for positioning.
 */
export function createOrbs(scene, count, mapSize) {
    const placementArea = mapSize * 0.7;
    for (let i = 0; i < count; i++) {
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(
            (Math.random() - 0.5) * placementArea,
            1.5,
            (Math.random() - 0.5) * placementArea
        );
        orb.castShadow = true;
        scene.add(orb);
        orbs.push(orb);
    }
}

/**
 * Animates the orbs to make them float and rotate.
 * @param {number} deltaTime - The time elapsed since the last frame.
 */
export function animateOrbs(deltaTime) {
    orbs.forEach(orb => {
        orb.rotation.y += deltaTime * 0.5;
        orb.position.y = Math.sin(Date.now() * 0.001 + orb.position.x) * 0.5 + 1.5;
    });
}

/**
 * Creates a particle burst effect for when an orb is collected.
 * @param {THREE.Scene} scene - The main Three.js scene.
 * @param {THREE.Vector3} position - The position where the effect should occur.
 */
export function createOrbCollectionParticles(scene, position) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const material = new THREE.PointsMaterial({
        color: 0xf1c40f,
        size: 0.3,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    for (let i = 0; i < particleCount; i++) {
        const x = position.x;
        const y = position.y;
        const z = position.z;
        vertices.push(x, y, z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
        velocities.push(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        );
    }

    let time = 0;
    const duration = 0.5;
    function animateParticles() {
        time += 0.016; // a rough delta time
        if (time > duration) {
            scene.remove(particles);
            geometry.dispose();
            material.dispose();
            return;
        }

        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += velocities[i * 3] * 0.016;
            positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
            positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
        }
        material.opacity = 1.0 - (time / duration);
        particles.geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}
