// environment_art.js
// Builds a more art-directed scene shell around the gameplay systems.

const ZONE_ACCENTS = [0x7f5f42, 0x7dbd8d, 0x86d9a3, 0xc7ffd0];
const SKY_DOME_COLORS = [0x33453d, 0x4d7867, 0x6fa98a, 0x9ad3b1];
const HAZE_COLORS = [0x9a774f, 0x9ac6af, 0xb5efca, 0xe2ffe9];

let animated = {
    dust: null,
    halos: [],
    pools: [],
    crystals: []
};

function makeCanvasTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1d281d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 2600; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = 1 + Math.random() * 6;
        const alpha = 0.03 + Math.random() * 0.12;
        const shade = 30 + Math.floor(Math.random() * 40);
        ctx.fillStyle = `rgba(${shade}, ${50 + shade}, ${shade}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const w = 20 + Math.random() * 90;
        const h = 10 + Math.random() * 50;
        ctx.fillStyle = `rgba(18, 26, 18, ${0.08 + Math.random() * 0.12})`;
        ctx.fillRect(x, y, w, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    texture.anisotropy = 8;
    return texture;
}

function makeDustField() {
    const geometry = new THREE.BufferGeometry();
    const count = 280;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const stride = i * 3;
        positions[stride] = (Math.random() - 0.5) * 650;
        positions[stride + 1] = 15 + Math.random() * 120;
        positions[stride + 2] = (Math.random() - 0.5) * 650;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xd9f7dd,
        size: 1.6,
        transparent: true,
        opacity: 0.16,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.userData.rotationRate = 0.004;
    return points;
}

function makeWaterPool(position, scale = 1) {
    const group = new THREE.Group();
    group.position.copy(position);

    const outer = new THREE.Mesh(
        new THREE.CircleGeometry(8 * scale, 40),
        new THREE.MeshStandardMaterial({
            color: 0x244c3f,
            transparent: true,
            opacity: 0.55,
            roughness: 0.35,
            metalness: 0.1
        })
    );
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = 0.05;

    const inner = new THREE.Mesh(
        new THREE.CircleGeometry(5.4 * scale, 32),
        new THREE.MeshStandardMaterial({
            color: 0x8dffdd,
            emissive: 0x1e7d63,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.48,
            roughness: 0.2,
            metalness: 0.25
        })
    );
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.08;

    group.add(outer);
    group.add(inner);
    group.userData.inner = inner;
    return group;
}

function makeCrystalCluster(position, tint) {
    const group = new THREE.Group();
    group.position.copy(position);

    for (let i = 0; i < 4; i++) {
        const shard = new THREE.Mesh(
            new THREE.ConeGeometry(0.35 + Math.random() * 0.2, 2.2 + Math.random() * 1.8, 5),
            new THREE.MeshStandardMaterial({
                color: tint,
                emissive: tint,
                emissiveIntensity: 0.35,
                roughness: 0.3,
                metalness: 0.1
            })
        );
        shard.position.set((Math.random() - 0.5) * 1.8, 0.8 + Math.random() * 0.4, (Math.random() - 0.5) * 1.8);
        shard.rotation.z = (Math.random() - 0.5) * 0.35;
        shard.rotation.x = (Math.random() - 0.5) * 0.25;
        shard.castShadow = true;
        group.add(shard);
    }

    group.userData.spinSeed = Math.random() * Math.PI * 2;
    return group;
}

function makeRuinCluster(position, rotation = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotation;

    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4d45,
        roughness: 0.95,
        metalness: 0.04
    });

    const slab = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 6), baseMaterial);
    slab.position.y = 0.6;
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);

    for (let i = 0; i < 3; i++) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 5 + Math.random() * 4, 1.1), baseMaterial.clone());
        pillar.position.set(-3 + i * 3, pillar.geometry.parameters.height / 2, -1.6 + Math.random() * 3.2);
        pillar.rotation.z = (Math.random() - 0.5) * 0.08;
        pillar.castShadow = true;
        group.add(pillar);
    }

    return group;
}

function makeHalo(position) {
    const halo = new THREE.Mesh(
        new THREE.RingGeometry(18, 34, 48),
        new THREE.MeshBasicMaterial({
            color: 0xffd39a,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
            depthWrite: false
        })
    );
    halo.position.copy(position);
    halo.lookAt(0, 0, 0);
    halo.userData.baseScale = 1;
    return halo;
}

export function createEnvironmentArt(scene) {
    animated = {
        dust: null,
        halos: [],
        pools: [],
        crystals: []
    };

    const zoneVisuals = {
        accentMaterials: [],
        glowMaterials: [],
        skyMaterial: null,
        hazeMaterial: null
    };

    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(700, 32, 24),
        new THREE.MeshBasicMaterial({
            color: SKY_DOME_COLORS[0],
            side: THREE.BackSide,
            fog: false
        })
    );
    scene.add(sky);
    zoneVisuals.skyMaterial = sky.material;

    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(18, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd39a, fog: false })
    );
    sun.position.set(-180, 140, -260);
    scene.add(sun);

    const halo = makeHalo(sun.position);
    scene.add(halo);
    animated.halos.push(halo);
    zoneVisuals.hazeMaterial = halo.material;

    const groundTexture = makeCanvasTexture();

    const dust = makeDustField();
    scene.add(dust);
    animated.dust = dust;

    const poolPositions = [
        new THREE.Vector3(-60, 0, -40),
        new THREE.Vector3(85, 0, 50),
        new THREE.Vector3(24, 0, -110)
    ];

    poolPositions.forEach((position, index) => {
        const pool = makeWaterPool(position, 1 + index * 0.18);
        scene.add(pool);
        animated.pools.push(pool);
        zoneVisuals.accentMaterials.push(pool.userData.inner.material);
    });

    const crystalPositions = [
        new THREE.Vector3(-48, 0, 72),
        new THREE.Vector3(58, 0, -82),
        new THREE.Vector3(115, 0, 12),
        new THREE.Vector3(-112, 0, -26)
    ];

    crystalPositions.forEach((position) => {
        const cluster = makeCrystalCluster(position, 0x98ffd7);
        scene.add(cluster);
        animated.crystals.push(cluster);
        cluster.children.forEach((child) => zoneVisuals.glowMaterials.push(child.material));
    });

    const ruins = [
        makeRuinCluster(new THREE.Vector3(-90, 0, -88), 0.4),
        makeRuinCluster(new THREE.Vector3(110, 0, -60), -0.8),
        makeRuinCluster(new THREE.Vector3(0, 0, 132), 0.2)
    ];

    ruins.forEach((ruin) => scene.add(ruin));

    return { groundTexture, zoneVisuals };
}

export function updateEnvironmentArt(delta, elapsedTime) {
    if (animated.dust) {
        animated.dust.rotation.y += delta * animated.dust.userData.rotationRate;
    }

    animated.halos.forEach((halo, index) => {
        const pulse = 1 + Math.sin(elapsedTime * 0.55 + index) * 0.04;
        halo.scale.setScalar(pulse);
        halo.rotation.z += delta * 0.04;
    });

    animated.pools.forEach((pool, index) => {
        const ripple = 1 + Math.sin(elapsedTime * 1.15 + index * 1.7) * 0.025;
        pool.userData.inner.scale.set(ripple, ripple, ripple);
    });

    animated.crystals.forEach((cluster, index) => {
        cluster.rotation.y += delta * (0.08 + index * 0.01);
        cluster.position.y = Math.sin(elapsedTime * 1.4 + cluster.userData.spinSeed) * 0.08;
    });
}

export function getZoneVisualPalette(state) {
    const safeIndex = Math.max(0, Math.min(ZONE_ACCENTS.length - 1, state));
    return {
        accent: ZONE_ACCENTS[safeIndex],
        sky: SKY_DOME_COLORS[safeIndex],
        haze: HAZE_COLORS[safeIndex]
    };
}
