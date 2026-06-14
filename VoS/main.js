import { Vessel } from './vessels/Vessel.js';
import { TargetDummy } from './npcs/TargetDummy.js';
import { Projectile } from './abilities/Projectile.js';
import { Minion, updateMinionSlashes } from './npcs/Minion.js';
import { JungleMob } from './npcs/JungleMob.js';
import { Turret } from './npcs/Turret.js';

// --- SETUP ---
const keysPressed = {};
window.addEventListener('keydown', (event) => { keysPressed[event.key.toLowerCase()] = true; });
window.addEventListener('keyup', (event) => { keysPressed[event.key.toLowerCase()] = false; });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Bright sky blue

// Subtle depth fog matching sky color for a clear daytime feel
scene.fog = new THREE.Fog(0x87CEEB, 80, 200);

const aspect = window.innerWidth / window.innerHeight;
const d = 25;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
const cameraOffset = new THREE.Vector3(25, 25, 25);
camera.position.copy(cameraOffset);
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Bright warm sunlight — primary directional light mimics high noon sun
const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.85);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xfffaf0, 1.0);
directionalLight.position.set(50, 80, 30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 250;
directionalLight.shadow.camera.left = -80;
directionalLight.shadow.camera.right = 80;
directionalLight.shadow.camera.top = 80;
directionalLight.shadow.camera.bottom = -80;
scene.add(directionalLight);

// Fill light from opposite side to soften shadows
const fillLight = new THREE.DirectionalLight(0xb0d4f1, 0.35);
fillLight.position.set(-30, 40, -20);
scene.add(fillLight);

// Hemisphere light for natural sky-ground color blending
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6B8E23, 0.4);
scene.add(hemiLight);

// --- MAP & SCENERY ---
const mapSize = 250;
const halfMap = mapSize / 2;

// ============================================================
// TERRAIN ZONES — layered ground planes for visual variety
// ============================================================

// Base ground — dark forest green
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(mapSize, mapSize),
    new THREE.MeshStandardMaterial({ color: 0x2E5A1E, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Jungle floor patches — darker muddier green under tree clusters
const jungleFloorMat = new THREE.MeshStandardMaterial({ color: 0x1F3D14, roughness: 1.0 });
function createGroundPatch(x, z, w, h, mat, yOff = 0.02) {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, yOff, z);
    patch.receiveShadow = true;
    scene.add(patch);
    return patch;
}
// Upper jungle floor
createGroundPatch(-55, -40, 60, 50, jungleFloorMat);
// Lower jungle floor
createGroundPatch(55, 40, 60, 50, jungleFloorMat);

// Base surrounds — paved stone extending from bases
const paveMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
createGroundPatch(-90, 90, 50, 50, paveMat, 0.03);  // Blue base surround
createGroundPatch(90, -90, 50, 50, paveMat, 0.03);  // Red base surround

// ============================================================
// SCENERY HELPERS
// ============================================================
function createTree(x, z, scale = 1.0) {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5 * scale;
    trunk.castShadow = true;
    tree.add(trunk);
    const canopyColors = [0x3A8C2E, 0x4CA53A, 0x2E7D22];
    [{ y: 3.5, r: 2.2 }, { y: 4.5, r: 1.8 }, { y: 5.2, r: 1.2 }].forEach((cfg, i) => {
        const geo = new THREE.IcosahedronGeometry(cfg.r * scale, 1);
        const mat = new THREE.MeshStandardMaterial({ color: canopyColors[i], flatShading: true });
        const c = new THREE.Mesh(geo, mat);
        c.position.y = cfg.y * scale;
        c.castShadow = true;
        tree.add(c);
    });
    tree.position.set(x, 0, z);
    scene.add(tree);
    return tree;
}

function createRock(x, z, scale = 1.0, color = 0x9E9E9E) {
    const geo = new THREE.IcosahedronGeometry(1.2 * scale, 0);
    const mat = new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1.0 });
    const rock = new THREE.Mesh(geo, mat);
    rock.position.set(x, 0.6 * scale, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    scene.add(rock);
    return rock;
}

function createStump(x, z, scale = 1.0) {
    const group = new THREE.Group();
    const stumpMat = new THREE.MeshStandardMaterial({ color: 0x6B4F1D, flatShading: true });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, flatShading: true });
    // Main stump
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * scale, 0.7 * scale, 0.6 * scale, 7), stumpMat);
    stump.position.y = 0.3 * scale;
    stump.castShadow = true;
    group.add(stump);
    // Top rings
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48 * scale, 0.48 * scale, 0.06 * scale, 7), ringMat);
    top.position.y = 0.62 * scale;
    group.add(top);
    // Root bulges
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const root = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 0.15 * scale, 0.5 * scale), stumpMat);
        root.position.set(Math.cos(angle) * 0.6 * scale, 0.08 * scale, Math.sin(angle) * 0.6 * scale);
        root.rotation.y = angle;
        group.add(root);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function createFlowerPatch(x, z) {
    const group = new THREE.Group();
    const colors = [0xff6b9d, 0xffd93d, 0xc084fc, 0xff8fab, 0x6dd5ed];
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d7a2a, flatShading: true });
    for (let i = 0; i < 5 + Math.floor(Math.random() * 4); i++) {
        const fx = (Math.random() - 0.5) * 2;
        const fz = (Math.random() - 0.5) * 2;
        const h = 0.3 + Math.random() * 0.4;
        // Stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 3), stemMat);
        stem.position.set(fx, h / 2, fz);
        group.add(stem);
        // Bloom
        const bloom = new THREE.Mesh(
            new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 5, 5),
            new THREE.MeshStandardMaterial({ color: colors[i % colors.length], flatShading: true })
        );
        bloom.position.set(fx, h + 0.05, fz);
        group.add(bloom);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function createFallenLog(x, z, angle = 0) {
    const group = new THREE.Group();
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x5C4219, flatShading: true, roughness: 1.0 });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, flatShading: true });
    // Main log
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 6), barkMat);
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.4;
    log.castShadow = true;
    group.add(log);
    // Cut end
    const end = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 6), innerMat);
    end.rotation.z = Math.PI / 2;
    end.position.set(2, 0.4, 0);
    group.add(end);
    // Moss patches on log
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x4a7a3a, flatShading: true });
    for (let i = 0; i < 3; i++) {
        const moss = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.25), mossMat);
        moss.position.set(-1 + i * 1.2, 0.8, 0.1);
        group.add(moss);
    }
    group.rotation.y = angle;
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function createMushroomCluster(x, z) {
    const group = new THREE.Group();
    const capColors = [0xc0392b, 0xe67e22, 0x8e44ad];
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e1, flatShading: true });
    for (let i = 0; i < 3; i++) {
        const mx = (Math.random() - 0.5) * 1.2;
        const mz = (Math.random() - 0.5) * 1.2;
        const h = 0.2 + Math.random() * 0.3;
        const r = 0.15 + Math.random() * 0.15;
        // Stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, h, 5), stemMat);
        stem.position.set(mx, h / 2, mz);
        group.add(stem);
        // Cap
        const cap = new THREE.Mesh(
            new THREE.SphereGeometry(r, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: capColors[i], flatShading: true })
        );
        cap.position.set(mx, h, mz);
        group.add(cap);
        // Spots on cap
        const spotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), spotMat);
        spot.position.set(mx + 0.05, h + r * 0.7, mz + 0.05);
        group.add(spot);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function createGrassTuft(x, z) {
    const group = new THREE.Group();
    const grassColors = [0x3d7a2a, 0x4a8c35, 0x2d6b1e];
    for (let i = 0; i < 5 + Math.floor(Math.random() * 4); i++) {
        const gx = (Math.random() - 0.5) * 0.8;
        const gz = (Math.random() - 0.5) * 0.8;
        const h = 0.4 + Math.random() * 0.5;
        const blade = new THREE.Mesh(
            new THREE.ConeGeometry(0.04, h, 3),
            new THREE.MeshStandardMaterial({ color: grassColors[i % 3], flatShading: true })
        );
        blade.position.set(gx, h / 2, gz);
        blade.rotation.z = (Math.random() - 0.5) * 0.3;
        group.add(blade);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

function createBrushPatch(x, z, scale = 1.0) {
    const group = new THREE.Group();
    const brushColors = [0x2d8a4e, 0x247a3e, 0x36a85c];
    // Dense cluster of tall grass blades
    for (let i = 0; i < 20; i++) {
        const bx = (Math.random() - 0.5) * 4 * scale;
        const bz = (Math.random() - 0.5) * 2.5 * scale;
        const h = 1.2 + Math.random() * 0.8;
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.08 * scale, h * scale, 0.15 * scale),
            new THREE.MeshStandardMaterial({ color: brushColors[i % 3], flatShading: true })
        );
        blade.position.set(bx, (h * scale) / 2, bz);
        blade.rotation.z = (Math.random() - 0.5) * 0.15;
        blade.rotation.y = Math.random() * Math.PI;
        group.add(blade);
    }
    // Base foliage (wider low bushes)
    for (let i = 0; i < 4; i++) {
        const lx = (Math.random() - 0.5) * 3 * scale;
        const lz = (Math.random() - 0.5) * 2 * scale;
        const bush = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.6 * scale, 1),
            new THREE.MeshStandardMaterial({ color: 0x1d6b35, flatShading: true })
        );
        bush.position.set(lx, 0.4 * scale, lz);
        group.add(bush);
    }
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

// ============================================================
// MAP BOUNDARIES — rocky cliff faces at map edges
// ============================================================
const wallHeight = 6;
const cliffMat = new THREE.MeshStandardMaterial({ color: 0x5a5040, flatShading: true, roughness: 1.0 });
const cliffDarkMat = new THREE.MeshStandardMaterial({ color: 0x3d3830, flatShading: true, roughness: 1.0 });
const vineMat = new THREE.MeshStandardMaterial({ color: 0x3a6e2a, flatShading: true });

function createCliffWall(x, z, totalW, totalH, isHorizontal) {
    const segCount = Math.floor(totalW / 8);
    for (let i = 0; i < segCount; i++) {
        const segW = totalW / segCount;
        const h = wallHeight + (Math.random() - 0.5) * 2; // Varied height
        const mat = Math.random() > 0.4 ? cliffMat : cliffDarkMat;
        const geo = new THREE.BoxGeometry(
            isHorizontal ? segW : totalH,
            h,
            isHorizontal ? totalH : segW
        );
        const seg = new THREE.Mesh(geo, mat);
        if (isHorizontal) {
            seg.position.set(x - totalW / 2 + segW / 2 + i * segW, h / 2, z);
        } else {
            seg.position.set(x, h / 2, z - totalW / 2 + segW / 2 + i * segW);
        }
        seg.castShadow = true;
        seg.receiveShadow = true;
        scene.add(seg);

        // Random vine/moss patch on cliff face
        if (Math.random() > 0.5) {
            const vine = new THREE.Mesh(
                new THREE.BoxGeometry(
                    isHorizontal ? 1.5 : 0.3,
                    1.0 + Math.random(),
                    isHorizontal ? 0.3 : 1.5
                ), vineMat
            );
            vine.position.copy(seg.position);
            vine.position.y = h * 0.6;
            if (isHorizontal) vine.position.z += (z > 0 ? -1 : 1);
            else vine.position.x += (x > 0 ? -1 : 1);
            scene.add(vine);
        }
    }
}
createCliffWall(0, -halfMap, mapSize, 3, true);   // North
createCliffWall(0, halfMap, mapSize, 3, true);    // South
createCliffWall(-halfMap, 0, mapSize, 3, false);  // West
createCliffWall(halfMap, 0, mapSize, 3, false);   // East

// Dense perimeter trees — forest edge feel
const perimTrees = [];
for (let i = -110; i <= 110; i += 12) {
    // North edge
    if (Math.abs(i) > 30) createTree(i, -105 + Math.random() * 5, 0.7 + Math.random() * 0.4);
    // South edge
    if (Math.abs(i) > 30) createTree(i, 105 + Math.random() * 5, 0.7 + Math.random() * 0.4);
    // West edge
    if (Math.abs(i) > 30) createTree(-105 + Math.random() * 5, i, 0.7 + Math.random() * 0.4);
    // East edge
    if (Math.abs(i) > 30) createTree(105 + Math.random() * 5, i, 0.7 + Math.random() * 0.4);
}

// ============================================================
// LANE PATHS — worn dirt strips connecting the two bases
// ============================================================
const laneWidth = 10;
const laneMat = new THREE.MeshStandardMaterial({ color: 0x8B7D5B, roughness: 1.0, metalness: 0.0 });
const laneEdgeMat = new THREE.MeshStandardMaterial({ color: 0x6B6040, roughness: 1.0 });

function createLaneSegment(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    // Main lane surface
    const geo = new THREE.PlaneGeometry(laneWidth, length);
    const lane = new THREE.Mesh(geo, laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.rotation.z = -angle;
    lane.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2);
    lane.receiveShadow = true;
    scene.add(lane);

    // Worn edges — slightly wider darker strip underneath
    const edgeGeo = new THREE.PlaneGeometry(laneWidth + 4, length + 2);
    const edge = new THREE.Mesh(edgeGeo, laneEdgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.rotation.z = -angle;
    edge.position.set((x1 + x2) / 2, 0.03, (z1 + z2) / 2);
    edge.receiveShadow = true;
    scene.add(edge);
    return lane;
}

// Base positions — Blue (bottom-left), Red (top-right) in iso view
const blueBaseCenter = new THREE.Vector3(-90, 0, 90);
const redBaseCenter = new THREE.Vector3(90, 0, -90);

// Lane waypoints
// Top lane (L-shape): straight south along west side, turn NW corner, straight east along north side
const topLaneWaypoints = [
    new THREE.Vector3(-80, 0, 80),    // Blue exit
    new THREE.Vector3(-80, 0, -80),   // NW corner
    new THREE.Vector3(80, 0, -80)     // Red entrance
];
// Mid lane (straight diagonal): direct line through center
const midLaneWaypoints = [
    new THREE.Vector3(-75, 0, 75),    // Blue exit
    new THREE.Vector3(75, 0, -75)     // Red entrance
];
// Bot lane (L-shape): straight east along south side, turn SE corner, straight north along east side
const botLaneWaypoints = [
    new THREE.Vector3(-80, 0, 80),    // Blue exit
    new THREE.Vector3(80, 0, 80),     // SE corner
    new THREE.Vector3(80, 0, -80)     // Red entrance
];

function drawLane(waypoints) {
    for (let i = 0; i < waypoints.length - 1; i++) {
        createLaneSegment(waypoints[i].x, waypoints[i].z, waypoints[i + 1].x, waypoints[i + 1].z);
    }
}
drawLane(topLaneWaypoints);
drawLane(midLaneWaypoints);
drawLane(botLaneWaypoints);

// Corner patches at L-turns to fill the 90-degree gap
const cornerMat = laneMat;
const cornerSize = laneWidth + 4;
// Top lane NW corner (-80, -80)
const nwCorner = new THREE.Mesh(new THREE.PlaneGeometry(cornerSize, cornerSize), cornerMat);
nwCorner.rotation.x = -Math.PI / 2;
nwCorner.position.set(-80, 0.05, -80);
nwCorner.receiveShadow = true;
scene.add(nwCorner);
// Bot lane SE corner (80, 80)
const seCorner = new THREE.Mesh(new THREE.PlaneGeometry(cornerSize, cornerSize), cornerMat);
seCorner.rotation.x = -Math.PI / 2;
seCorner.position.set(80, 0.05, 80);
seCorner.receiveShadow = true;
scene.add(seCorner);

// ============================================================
// RIVER — diagonal water strip perpendicular to mid lane
// ============================================================
const waterMat = new THREE.MeshStandardMaterial({
    color: 0x3a8dbf, roughness: 0.2, metalness: 0.1,
    transparent: true, opacity: 0.7
});
const bankMat = new THREE.MeshStandardMaterial({ color: 0x6B5D3B, roughness: 1.0 });
const riverBedMat = new THREE.MeshStandardMaterial({ color: 0x4a6e5c, roughness: 0.8 });

// River flows from top-right to bottom-left (perpendicular to mid lane)
// Mid lane is (-,-) to (+,+) diagonal, so river goes (+,-) to (-,+)
const riverSegments = [
    { x1: 70, z1: -80, x2: 35, z2: -35 },
    { x1: 35, z1: -35, x2: 10, z2: -10 },
    { x1: 10, z1: -10, x2: -10, z2: 10 },
    { x1: -10, z1: 10, x2: -35, z2: 35 },
    { x1: -35, z1: 35, x2: -70, z2: 80 }
];
const riverWidth = 12;

riverSegments.forEach(seg => {
    const dx = seg.x2 - seg.x1;
    const dz = seg.z2 - seg.z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    // Riverbed (slightly wider)
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(riverWidth + 5, length + 3), bankMat);
    bed.rotation.x = -Math.PI / 2;
    bed.rotation.z = -angle;
    bed.position.set((seg.x1 + seg.x2) / 2, 0.01, (seg.z1 + seg.z2) / 2);
    bed.receiveShadow = true;
    scene.add(bed);

    // Water surface
    const water = new THREE.Mesh(new THREE.PlaneGeometry(riverWidth, length + 1), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = -angle;
    water.position.set((seg.x1 + seg.x2) / 2, 0.04, (seg.z1 + seg.z2) / 2);
    scene.add(water);
});

// Stepping stones at mid lane river crossing
const stoneCrossingMat = new THREE.MeshStandardMaterial({ color: 0x777777, flatShading: true, roughness: 0.8 });
[[-4, 4], [-1, 1], [2, -2], [5, -5]].forEach(([sx, sz]) => {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.4, 6), stoneCrossingMat);
    stone.position.set(sx, 0.15, sz);
    stone.receiveShadow = true;
    stone.castShadow = true;
    scene.add(stone);
});

// River rocks scattered along banks
const riverRockPositions = [
    [60, -70], [45, -45], [25, -20], [-5, 5], [-25, 25], [-45, 45], [-60, 65],
    [55, -60], [30, -30], [15, -12], [-15, 18], [-40, 50], [-55, 72]
];
riverRockPositions.forEach(([rx, rz]) => {
    createRock(rx + (Math.random() - 0.5) * 6, rz + (Math.random() - 0.5) * 6, 0.3 + Math.random() * 0.4, 0x708090);
});

// ============================================================
// LANE TURRETS — 2 per lane per team (12 total) with combat AI
// ============================================================
const blueTurrets = [
    // Top lane blue turrets (along x=-80 wall)
    new Turret(scene, -80, 25, 'blue'),      // T1 top
    new Turret(scene, -80, -35, 'blue'),     // T2 top
    // Mid lane blue turrets (along diagonal)
    new Turret(scene, -50, 50, 'blue'),      // T1 mid
    new Turret(scene, -20, 20, 'blue'),      // T2 mid
    // Bot lane blue turrets (along z=80 wall)
    new Turret(scene, -25, 80, 'blue'),      // T1 bot
    new Turret(scene, 35, 80, 'blue'),       // T2 bot
];

const redTurrets = [
    // Top lane red turrets (along z=-80 wall)
    new Turret(scene, 25, -80, 'red'),       // T1 top
    new Turret(scene, -35, -80, 'red'),      // T2 top
    // Mid lane red turrets (along diagonal)
    new Turret(scene, 20, -20, 'red'),       // T1 mid
    new Turret(scene, 50, -50, 'red'),       // T2 mid
    // Bot lane red turrets (along x=80 wall)
    new Turret(scene, 80, -25, 'red'),       // T1 bot
    new Turret(scene, 80, 35, 'red'),        // T2 bot
];

// ============================================================
// BRUSH PATCHES — tall grass for future vision control
// ============================================================
// Lane brushes (2-3 per lane)
// Top lane brushes
createBrushPatch(-92, -20, 0.9);
createBrushPatch(-80, -75, 0.8);
createBrushPatch(10, -92, 0.9);
// Mid lane brushes
createBrushPatch(-30, 35, 0.8);
createBrushPatch(30, -35, 0.8);
// Bot lane brushes
createBrushPatch(20, 92, 0.9);
createBrushPatch(75, 85, 0.8);
createBrushPatch(92, 15, 0.9);

// Jungle brushes (2-3 per quadrant)
createBrushPatch(-60, -20, 1.0);
createBrushPatch(-40, -45, 0.9);
createBrushPatch(-70, -60, 0.8);
createBrushPatch(60, 20, 1.0);
createBrushPatch(40, 45, 0.9);
createBrushPatch(70, 60, 0.8);

// ============================================================
// CENTRAL OBJECTIVE PIT — stone arena at map center
// ============================================================
const pitStoneMat = new THREE.MeshStandardMaterial({ color: 0x555555, flatShading: true, roughness: 0.9 });
const pitDarkMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, flatShading: true, roughness: 0.9 });
const pitGlowMat = new THREE.MeshStandardMaterial({ color: 0xaa44ff, emissive: 0xaa44ff, emissiveIntensity: 0.3, flatShading: true });

// Pit floor
const pitFloor = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 0.2, 12), pitDarkMat);
pitFloor.position.set(0, 0.08, 0);
pitFloor.receiveShadow = true;
scene.add(pitFloor);

// Stone ring wall
for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    // Leave gap for mid lane entry (roughly ±45° from diagonal)
    const angle45 = Math.atan2(1, 1); // ~0.785
    const angleDiff = Math.abs(Math.atan2(Math.sin(a - angle45), Math.cos(a - angle45)));
    const angleDiff2 = Math.abs(Math.atan2(Math.sin(a - angle45 - Math.PI), Math.cos(a - angle45 - Math.PI)));
    if (angleDiff < 0.45 || angleDiff2 < 0.45) continue; // Lane entrance gaps

    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 1.5), pitStoneMat);
    pillar.position.set(Math.cos(a) * 9, 1.25, Math.sin(a) * 9);
    pillar.rotation.y = a;
    pillar.castShadow = true;
    scene.add(pillar);
}

// Rune circle in pit center
const runeRing = new THREE.Mesh(new THREE.TorusGeometry(4, 0.15, 6, 16), pitGlowMat);
runeRing.position.y = 0.2;
runeRing.rotation.x = Math.PI / 2;
scene.add(runeRing);
// Inner rune symbol
const runeCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), pitGlowMat);
runeCore.position.y = 0.6;
scene.add(runeCore);

// ============================================================
// BASES — platform + nexus tower + walls
// ============================================================
function createBase(center, teamColor, teamName) {
    const base = new THREE.Group();
    const tc = new THREE.Color(teamColor);
    const darkTeam = tc.clone().offsetHSL(0, 0, -0.2);
    const teamMat = new THREE.MeshStandardMaterial({ color: teamColor, flatShading: true });
    const darkTeamMat = new THREE.MeshStandardMaterial({ color: darkTeam, flatShading: true });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x666666, flatShading: true, roughness: 0.9 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x444444, flatShading: true, roughness: 0.9 });
    const glowMat = new THREE.MeshStandardMaterial({
        color: teamColor, emissive: teamColor, emissiveIntensity: 0.5, flatShading: true
    });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    const floorTileMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });

    // === FOUNDATION — large stone platform with tile pattern ===
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 1.0, 8), floorMat);
    platform.position.y = 0.5;
    platform.receiveShadow = true;
    base.add(platform);

    // Inner floor ring
    const innerFloor = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 0.15, 8), floorTileMat);
    innerFloor.position.y = 1.1;
    innerFloor.receiveShadow = true;
    base.add(innerFloor);

    // === NEXUS — central structure with layered tiers ===
    // Base tier — wide octagonal foundation
    const nexusBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2, 8), stoneMat);
    nexusBase.position.y = 2;
    nexusBase.castShadow = true;
    base.add(nexusBase);

    // Mid tier — narrower
    const nexusMid = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 4, 8), teamMat);
    nexusMid.position.y = 5;
    nexusMid.castShadow = true;
    base.add(nexusMid);

    // Upper tier — team-colored spire
    const nexusTop = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 3, 5, 8), darkTeamMat);
    nexusTop.position.y = 9.5;
    nexusTop.castShadow = true;
    base.add(nexusTop);

    // Spire tip
    const spire = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3, 6), teamMat);
    spire.position.y = 13.5;
    spire.castShadow = true;
    base.add(spire);

    // Floating crystal above nexus
    const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 0), glowMat);
    crystal.position.y = 16;
    crystal.castShadow = true;
    base.add(crystal);
    // Crystal ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 6, 8), glowMat);
    ring.position.y = 16;
    ring.rotation.x = Math.PI / 2;
    base.add(ring);

    // Nexus pillars — 4 pillars around the nexus
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const px = Math.cos(angle) * 6;
        const pz = Math.sin(angle) * 6;

        // Pillar column
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), stoneMat);
        pillar.position.set(px, 4.5, pz);
        pillar.castShadow = true;
        base.add(pillar);
        // Pillar cap
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), darkStoneMat);
        cap.position.set(px, 8.75, pz);
        base.add(cap);
        // Pillar light
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), glowMat);
        light.position.set(px, 9.2, pz);
        base.add(light);
    }

    // === WALLS — connecting wall segments with crenellations ===
    const wallPositions = [
        { x: 0, z: -17, ry: 0, w: 14 },
        { x: 0, z: 17, ry: 0, w: 14 },
        { x: -17, z: 0, ry: Math.PI / 2, w: 14 },
        { x: 17, z: 0, ry: Math.PI / 2, w: 14 }
    ];
    wallPositions.forEach(w => {
        // Main wall body
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, 4, 1.8), stoneMat);
        wall.position.set(w.x, 3, w.z);
        wall.rotation.y = w.ry;
        wall.castShadow = true;
        base.add(wall);

        // Crenellations (battlements) on top
        const crenCount = 5;
        for (let c = 0; c < crenCount; c++) {
            const offset = (c - (crenCount - 1) / 2) * (w.w / crenCount);
            const cren = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.0), darkStoneMat);
            // Position along wall direction
            if (w.ry === 0) {
                cren.position.set(w.x + offset, 5.6, w.z);
            } else {
                cren.position.set(w.x, 5.6, w.z + offset);
            }
            cren.rotation.y = w.ry;
            base.add(cren);
        }

        // Wall trim — colored band
        const band = new THREE.Mesh(new THREE.BoxGeometry(w.w + 0.2, 0.4, 1.9), teamMat);
        band.position.set(w.x, 4.2, w.z);
        band.rotation.y = w.ry;
        base.add(band);
    });

    // === CORNER TOWERS — 4 round towers at wall intersections ===
    [[-17, -17], [-17, 17], [17, -17], [17, 17]].forEach(([tx, tz]) => {
        // Tower base
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 8, 8), stoneMat);
        tower.position.set(tx, 4.5, tz);
        tower.castShadow = true;
        base.add(tower);
        // Tower roof — cone
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 3, 8), darkTeamMat);
        roof.position.set(tx, 10, tz);
        roof.castShadow = true;
        base.add(roof);
        // Tower flag (small colored strip)
        const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 4),
            new THREE.MeshStandardMaterial({ color: 0x8B6914, flatShading: true }));
        flagPole.position.set(tx, 13, tz);
        base.add(flagPole);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), teamMat);
        flag.position.set(tx + 0.6, 14, tz);
        base.add(flag);
    });

    // === INNER BUILDINGS — small structures inside the base ===
    // Barracks (minion spawner building)
    const barracks = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 4), darkStoneMat);
    barracks.position.set(-7, 2.5, 7);
    barracks.castShadow = true;
    base.add(barracks);
    const barracksRoof = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.4, 4.5), teamMat);
    barracksRoof.position.set(-7, 4.2, 7);
    base.add(barracksRoof);
    // Barracks door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.2), darkTeamMat);
    door.position.set(-7, 2, 9.1);
    base.add(door);

    // Workshop / forge
    const forge = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 3.5), darkStoneMat);
    forge.position.set(7, 2.25, -7);
    forge.castShadow = true;
    base.add(forge);
    const forgeRoof = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 4), teamMat);
    forgeRoof.position.set(7, 3.7, -7);
    base.add(forgeRoof);
    // Chimney
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 6), stoneMat);
    chimney.position.set(8.5, 4.5, -7);
    base.add(chimney);

    // === SPAWN PAD — glowing teleport circle ===
    const spawnPad = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.15, 16), glowMat);
    spawnPad.position.y = 1.15;
    base.add(spawnPad);
    // Inner ring detail
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(3, 0.15, 6, 16),
        new THREE.MeshStandardMaterial({ color: teamColor, emissive: teamColor, emissiveIntensity: 0.8, flatShading: true }));
    innerRing.position.y = 1.25;
    innerRing.rotation.x = Math.PI / 2;
    base.add(innerRing);

    base.position.copy(center);
    scene.add(base);
    return base;
}

const blueBase = createBase(blueBaseCenter, 0x3498db, 'blue');
const redBase = createBase(redBaseCenter, 0xe74c3c, 'red');

// ============================================================
// JUNGLE AREAS — dense forests, camps, and decorative detail
// ============================================================

// --- JUNGLE CAMP CLEARINGS (dirt patches + rock rings under each camp) ---
const campClearingMat = new THREE.MeshStandardMaterial({ color: 0x6B5D3B, roughness: 1.0 });
const campPositions = [
    // Upper jungle camps
    { cx: -53, cz: -30, r: 7 },   // Wolf camp
    { cx: -35, cz: -50, r: 8 },   // Golem camp
    { cx: -68, cz: -54, r: 6 },   // Raptor camp
    // Lower jungle camps
    { cx: 53, cz: 30, r: 7 },     // Wolf camp
    { cx: 35, cz: 50, r: 8 },     // Golem camp
    { cx: 68, cz: 54, r: 6 }      // Raptor camp
];
campPositions.forEach(camp => {
    // Dirt clearing
    const clearing = new THREE.Mesh(new THREE.CylinderGeometry(camp.r, camp.r, 0.1, 10), campClearingMat);
    clearing.position.set(camp.cx, 0.04, camp.cz);
    clearing.receiveShadow = true;
    scene.add(clearing);
    // Bordering rocks
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
        const dist = camp.r - 0.5 + Math.random();
        createRock(
            camp.cx + Math.cos(a) * dist,
            camp.cz + Math.sin(a) * dist,
            0.25 + Math.random() * 0.3, 0x7a7060
        );
    }
});

// --- UPPER JUNGLE TREES (between top lane and mid lane) ---
[
    [-70, -30, 1.2], [-55, -45, 1.0], [-45, -20, 1.3], [-65, -55, 0.9],
    [-35, -55, 1.1], [-75, -15, 1.0], [-50, -35, 0.8], [-30, -40, 1.2],
    [-60, -10, 1.1], [-40, -65, 1.0], [-80, -40, 0.9], [-20, -60, 1.1],
    // Additional trees for density
    [-62, -22, 0.7], [-48, -15, 1.0], [-72, -48, 0.8], [-38, -32, 0.9],
    [-58, -58, 1.1], [-25, -48, 0.7], [-78, -25, 1.0], [-43, -60, 0.8],
    [-68, -8, 0.9], [-33, -18, 1.1], [-82, -55, 0.7], [-28, -55, 0.9]
].forEach(([x, z, s]) => createTree(x, z, s));

// --- LOWER JUNGLE TREES (between bot lane and mid lane) ---
[
    [70, 30, 1.2], [55, 45, 1.0], [45, 20, 1.3], [65, 55, 0.9],
    [35, 55, 1.1], [75, 15, 1.0], [50, 35, 0.8], [30, 40, 1.2],
    [60, 10, 1.1], [40, 65, 1.0], [80, 40, 0.9], [20, 60, 1.1],
    // Additional trees for density
    [62, 22, 0.7], [48, 15, 1.0], [72, 48, 0.8], [38, 32, 0.9],
    [58, 58, 1.1], [25, 48, 0.7], [78, 25, 1.0], [43, 60, 0.8],
    [68, 8, 0.9], [33, 18, 1.1], [82, 55, 0.7], [28, 55, 0.9]
].forEach(([x, z, s]) => createTree(x, z, s));

// --- LANE-EDGE TREES (along lanes, not blocking path) ---
[
    [-97, -40, 0.8], [-97, 20, 0.9], [-97, -70, 0.7], [-97, -10, 0.6], [-97, 50, 0.8],
    [-60, -97, 0.8], [0, -97, 0.9], [60, -97, 0.7], [-30, -97, 0.6], [30, -97, 0.8],
    [-60, 97, 0.8], [0, 97, 0.9], [60, 97, 0.7], [-30, 97, 0.6], [30, 97, 0.8],
    [97, 60, 0.8], [97, 20, 0.9], [97, -40, 0.7], [97, -10, 0.6], [97, 50, 0.8]
].forEach(([x, z, s]) => createTree(x, z, s));

// --- ROCKS — scattered throughout jungle + near river ---
[
    // Upper jungle rocks
    [-65, -40], [-45, -50], [-35, -25], [-55, -15], [-72, -35], [-42, -42],
    [-58, -62], [-30, -35], [-75, -55], [-48, -22],
    // Lower jungle rocks
    [65, 40], [45, 50], [35, 25], [55, 15], [72, 35], [42, 42],
    [58, 62], [30, 35], [75, 55], [48, 22],
    // Mid-map rocks
    [-25, -30], [25, 30], [-15, -15], [15, 15]
].forEach(([x, z]) => createRock(x, z, 0.3 + Math.random() * 0.6));

// Mossy rocks (green-tinted)
[
    [-63, -25], [-47, -38], [-70, -50], [-38, -58],
    [63, 25], [47, 38], [70, 50], [38, 58]
].forEach(([x, z]) => createRock(x, z, 0.4 + Math.random() * 0.4, 0x6a7a5a));

// --- STUMPS (cut trees scattered in jungle) ---
[
    [-62, -18], [-40, -30], [-55, -52], [-30, -62], [-75, -35],
    [-48, -8], [-68, -42], [-22, -45],
    [62, 18], [40, 30], [55, 52], [30, 62], [75, 35],
    [48, 8], [68, 42], [22, 45]
].forEach(([x, z]) => createStump(x, z, 0.6 + Math.random() * 0.5));

// --- FALLEN LOGS (between camps and along paths) ---
[
    [-60, -35, 0.3], [-45, -55, 1.2], [-75, -45, 0.8], [-32, -38, 2.0],
    [-50, -12, 1.5], [-65, -65, 0.5], [-25, -52, 1.8], [-42, -25, 0.9],
    [60, 35, 0.3], [45, 55, 1.2], [75, 45, 0.8], [32, 38, 2.0],
    [50, 12, 1.5], [65, 65, 0.5], [25, 52, 1.8], [42, 25, 0.9]
].forEach(([x, z, a]) => createFallenLog(x, z, a));

// --- FLOWER PATCHES (at jungle edges and lane borders) ---
[
    [-80, -5], [-70, -20], [-50, -10], [-35, -15], [-25, -25],
    [-75, -60], [-60, -65], [-45, -68], [-85, -50],
    [80, 5], [70, 20], [50, 10], [35, 15], [25, 25],
    [75, 60], [60, 65], [45, 68], [85, 50],
    // Near river banks
    [20, -15], [-20, 15], [40, -35], [-40, 40], [50, -50], [-50, 55]
].forEach(([x, z]) => createFlowerPatch(x, z));

// --- MUSHROOM CLUSTERS (near rocks and shaded areas) ---
[
    [-62, -42], [-48, -52], [-35, -28], [-55, -18], [-72, -52],
    [-40, -62], [-58, -8], [-28, -38],
    [62, 42], [48, 52], [35, 28], [55, 18], [72, 52],
    [40, 62], [58, 8], [28, 38]
].forEach(([x, z]) => createMushroomCluster(x, z));

// --- GRASS TUFTS (scattered everywhere for ground coverage) ---
[
    // Upper jungle
    [-68, -28], [-52, -42], [-42, -18], [-62, -52], [-32, -52],
    [-72, -12], [-48, -32], [-28, -38], [-58, -8], [-38, -62],
    [-78, -22], [-18, -58], [-65, -48], [-45, -25], [-55, -38],
    // Lower jungle
    [68, 28], [52, 42], [42, 18], [62, 52], [32, 52],
    [72, 12], [48, 32], [28, 38], [58, 8], [38, 62],
    [78, 22], [18, 58], [65, 48], [45, 25], [55, 38],
    // Lane edges
    [-85, -35], [-85, 15], [-85, -65], [85, 35], [85, -15], [85, 65],
    [-35, -85], [15, -85], [65, -85], [35, 85], [-15, 85], [-65, 85],
    // River edges
    [15, -8], [-15, 8], [35, -28], [-35, 32], [55, -48], [-55, 52]
].forEach(([x, z]) => createGrassTuft(x, z));

// --- JUNGLE MOB CAMPS ---
const jungleMobs = [
    // Upper jungle — wolf camp
    new JungleMob(scene, { position: new THREE.Vector3(-55, 0, -30), mobType: 'wolf' }),
    new JungleMob(scene, { position: new THREE.Vector3(-50, 0, -28), mobType: 'wolf' }),
    new JungleMob(scene, { position: new THREE.Vector3(-52, 0, -33), mobType: 'wolf' }),
    // Upper jungle — golem camp
    new JungleMob(scene, { position: new THREE.Vector3(-35, 0, -50), mobType: 'golem' }),
    // Upper jungle — raptor camp
    new JungleMob(scene, { position: new THREE.Vector3(-70, 0, -55), mobType: 'raptor' }),
    new JungleMob(scene, { position: new THREE.Vector3(-66, 0, -52), mobType: 'raptor' }),

    // Lower jungle — wolf camp
    new JungleMob(scene, { position: new THREE.Vector3(55, 0, 30), mobType: 'wolf' }),
    new JungleMob(scene, { position: new THREE.Vector3(50, 0, 28), mobType: 'wolf' }),
    new JungleMob(scene, { position: new THREE.Vector3(52, 0, 33), mobType: 'wolf' }),
    // Lower jungle — golem camp
    new JungleMob(scene, { position: new THREE.Vector3(35, 0, 50), mobType: 'golem' }),
    // Lower jungle — raptor camp
    new JungleMob(scene, { position: new THREE.Vector3(70, 0, 55), mobType: 'raptor' }),
    new JungleMob(scene, { position: new THREE.Vector3(66, 0, 52), mobType: 'raptor' })
];

// ============================================================
// MINION WAVE SYSTEM
// ============================================================
const blueMinions = [];
const redMinions = [];
const bluePool = [];  // Pooled dead blue minions ready for reuse
const redPool = [];   // Pooled dead red minions ready for reuse
const WAVE_INTERVAL = 30;     // Seconds between waves
const MINIONS_PER_WAVE = 4;   // Minions per lane per wave
let lastWaveTime = -5;        // First wave spawns 5s after game start

// Reverse waypoints for red team (they walk from red base to blue base)
function reverseWaypoints(waypoints) {
    return [...waypoints].reverse().map(wp => wp.clone());
}

const redTopWaypoints = reverseWaypoints(topLaneWaypoints);
const redMidWaypoints = reverseWaypoints(midLaneWaypoints);
const redBotWaypoints = reverseWaypoints(botLaneWaypoints);

function makeStaggeredWaypoints(baseWaypoints) {
    return baseWaypoints.map((wp, idx) => {
        if (idx === 0) {
            const offset = new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3);
            return wp.clone().add(offset);
        }
        return wp.clone();
    });
}

function spawnMinionWave(elapsedTime) {
    const lanes = [
        { blueWP: topLaneWaypoints, redWP: redTopWaypoints },
        { blueWP: midLaneWaypoints, redWP: redMidWaypoints },
        { blueWP: botLaneWaypoints, redWP: redBotWaypoints }
    ];

    lanes.forEach(lane => {
        for (let i = 0; i < MINIONS_PER_WAVE; i++) {
            const blueWP = makeStaggeredWaypoints(lane.blueWP);
            const redWP = makeStaggeredWaypoints(lane.redWP);

            // Try to reuse pooled minions before creating new ones
            let blueMinion;
            if (bluePool.length > 0) {
                blueMinion = bluePool.pop();
                blueMinion.speed = 5 + Math.random() * 1.5;
                blueMinion.reset(blueWP);
            } else {
                blueMinion = new Minion(scene, {
                    team: 'blue',
                    waypoints: blueWP,
                    speed: 5 + Math.random() * 1.5
                });
            }
            blueMinions.push(blueMinion);

            let redMinion;
            if (redPool.length > 0) {
                redMinion = redPool.pop();
                redMinion.speed = 5 + Math.random() * 1.5;
                redMinion.reset(redWP);
            } else {
                redMinion = new Minion(scene, {
                    team: 'red',
                    waypoints: redWP,
                    speed: 5 + Math.random() * 1.5
                });
            }
            redMinions.push(redMinion);
        }
    });
}

// --- CHARACTER CONFIG ---
let availableCharacters = [];

let selectedCharacterIds = [];
let vessels = [];
let activeVesselIndex = 0;
let activeVessel;
let isGameStarted = false;

// --- SELECTION UI LOGIC ---
const selectionScreen = document.getElementById('character-selection-screen');
const characterGrid = document.getElementById('character-grid');
const startGameBtn = document.getElementById('start-game-btn');
const cooldownContainer = document.getElementById('cooldown-container');
const statsContainer = document.getElementById('stats-container');

async function loadCharacterData() {
    try {
        const response = await fetch('characterData.json');
        availableCharacters = await response.json();
        initSelectionScreen();
    } catch (error) {
        console.error('Failed to load character data:', error);
    }
}

function initSelectionScreen() {
    availableCharacters.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.id = char.id;
        card.onclick = () => toggleSelection(char.id);

        const preview = document.createElement('div');
        preview.className = 'character-preview';
        preview.style.backgroundColor = '#' + char.color.toString(16).padStart(6, '0');

        const name = document.createElement('div');
        name.className = 'character-name';
        name.textContent = char.name;

        const type = document.createElement('div');
        type.className = 'character-type';
        type.textContent = char.desc;

        card.appendChild(preview);
        card.appendChild(name);
        card.appendChild(type);
        characterGrid.appendChild(card);
    });

    startGameBtn.onclick = tryStartGame;
}

function toggleSelection(id) {
    const card = document.querySelector(`.character-card[data-id="${id}"]`);

    if (selectedCharacterIds.includes(id)) {
        selectedCharacterIds = selectedCharacterIds.filter(cid => cid !== id);
        card.classList.remove('selected');
    } else {
        if (selectedCharacterIds.length < 2) {
            selectedCharacterIds.push(id);
            card.classList.add('selected');
        } else {
            // Optional: Auto-deselect the first one to allow quick swapping
        }
    }

    if (selectedCharacterIds.length === 2) {
        startGameBtn.classList.add('active');
        startGameBtn.style.cursor = 'pointer';
    } else {
        startGameBtn.classList.remove('active');
        startGameBtn.style.cursor = 'not-allowed';
    }
}

function tryStartGame() {
    if (selectedCharacterIds.length === 2) {
        startGame();
    }
}

// --- GAME STATE ---
let isPaused = false;
let projectiles = [];

// --- GAME LOGIC & UI ---
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const mouseWorldPosition = new THREE.Vector3();

function startGame() {
    isGameStarted = true;
    selectionScreen.style.display = 'none';
    cooldownContainer.style.display = 'flex';
    statsContainer.style.display = 'block';
    minimapCanvas.style.display = 'block';

    const char1 = availableCharacters.find(c => c.id === selectedCharacterIds[0]);
    const char2 = availableCharacters.find(c => c.id === selectedCharacterIds[1]);

    const v1 = new Vessel(scene, {
        ...char1,
        mapBounds: halfMap - 2 // Keep player inside the boundary walls
    });

    const v2 = new Vessel(scene, {
        ...char2,
        mapBounds: halfMap - 2
    });

    // Spawn player at blue base
    v1.mesh.position.set(blueBaseCenter.x, v1.mesh.position.y, blueBaseCenter.z);
    v2.mesh.position.set(blueBaseCenter.x, v2.mesh.position.y, blueBaseCenter.z);

    vessels = [v1, v2];
    activeVesselIndex = 0;
    activeVessel = vessels[activeVesselIndex];
    vessels[1].mesh.visible = false;

    // Spawn first minion wave immediately
    spawnMinionWave(0);
    lastWaveTime = 0;

    animate();
}

// --- UI Elements ---
const cooldownFill = document.getElementById('cooldown-fill');
const cooldownText = document.getElementById('cooldown-text');
const statLevel = document.getElementById('stat-level');
const statHealth = document.getElementById('stat-health');
const statMana = document.getElementById('stat-mana');
const statAd = document.getElementById('stat-ad');
const statArmor = document.getElementById('stat-armor');
const pauseMenu = document.getElementById('pause-menu');
const resumeButton = document.getElementById('resume-button');

const swapCooldown = 5.0;
let lastSwapTime = -swapCooldown;

// --- EVENT LISTENERS ---
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

resumeButton.addEventListener('click', () => {
    togglePause();
});

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'escape') {
        togglePause();
    }
    if (isPaused) return;

    if (key === 'shift') {
        const now = clock.getElapsedTime();
        if (now - lastSwapTime >= swapCooldown) {
            const oldVessel = vessels[activeVesselIndex];
            const position = oldVessel.mesh.position.clone();
            const quaternion = oldVessel.mesh.quaternion.clone();
            oldVessel.mesh.visible = false;
            activeVesselIndex = (activeVesselIndex + 1) % vessels.length;
            activeVessel = vessels[activeVesselIndex];
            activeVessel.mesh.position.copy(position);
            activeVessel.mesh.quaternion.copy(quaternion);
            activeVessel.mesh.visible = true;
            lastSwapTime = now;
        }
    }
    if (key === 'l') {
        activeVessel.levelUp();
    }
});

window.addEventListener('mousedown', (event) => {
    if (isPaused) return;

    let abilityToExecute;
    if (event.button === 0) { // Left-click
        abilityToExecute = activeVessel.abilities.lmb;
    } else if (event.button === 2) { // Right-click
        abilityToExecute = activeVessel.abilities.rmb;
    }

    if (abilityToExecute) {
        const newProjectile = abilityToExecute.execute({
            scene: scene,
            mouseWorldPosition: mouseWorldPosition,
            clock: clock
        });

        if (newProjectile) {
            projectiles.push(newProjectile);

            // Check if player attacked near any red turret — set aggro
            if (activeVessel) {
                for (const turret of redTurrets) {
                    if (turret.alive && turret.isInRange(activeVessel.mesh.position)) {
                        turret.setAggro(activeVessel);
                    }
                }
            }
        }
    }
});

// --- FUNCTIONS ---
function togglePause() {
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'flex' : 'none';
}

function updateCooldownUI() {
    const now = clock.getElapsedTime();
    const timeSinceSwap = now - lastSwapTime;
    if (timeSinceSwap < swapCooldown) {
        const progress = timeSinceSwap / swapCooldown;
        cooldownFill.style.transform = `translateY(${(1 - progress) * 100}%)`;
        cooldownText.textContent = (swapCooldown - timeSinceSwap).toFixed(1);
    } else {
        cooldownFill.style.transform = 'translateY(100%)';
        cooldownText.textContent = 'SHIFT';
    }
}

function updateStatsUI(vessel) {
    if (!vessel) return;
    statLevel.textContent = vessel.level;
    statHealth.textContent = `${Math.round(vessel.stats.currentHealth)} / ${Math.round(vessel.stats.maxHealth)}`;
    statMana.textContent = `${Math.round(vessel.stats.currentMana)} / ${Math.round(vessel.stats.maxMana)}`;
    statAd.textContent = vessel.stats.attackDamage.toFixed(1);
    statArmor.textContent = vessel.stats.armor.toFixed(1);
}

// ============================================================
// MINIMAP SYSTEM
// ============================================================
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');
const MINIMAP_SIZE = 200;      // Canvas pixel size
const MAP_WORLD_SIZE = mapSize; // World units (-125 to 125)
const ALLY_VISION_RANGE = 30;  // World units — how far each ally reveals enemies

function worldToMinimap(wx, wz) {
    const x = ((wx + halfMap) / MAP_WORLD_SIZE) * MINIMAP_SIZE;
    const y = ((wz + halfMap) / MAP_WORLD_SIZE) * MINIMAP_SIZE;
    return { x, y };
}

function isEnemyVisibleToAllies(enemyPos, allyUnits, playerVessel) {
    // Check if enemy is within vision range of any ally
    if (playerVessel) {
        const dx = enemyPos.x - playerVessel.mesh.position.x;
        const dz = enemyPos.z - playerVessel.mesh.position.z;
        if (dx * dx + dz * dz <= ALLY_VISION_RANGE * ALLY_VISION_RANGE) return true;
    }
    for (const ally of allyUnits) {
        if (!ally.alive) continue;
        const dx = enemyPos.x - ally.mesh.position.x;
        const dz = enemyPos.z - ally.mesh.position.z;
        if (dx * dx + dz * dz <= ALLY_VISION_RANGE * ALLY_VISION_RANGE) return true;
    }
    return false;
}

function drawMinimap() {
    const ctx = minimapCtx;
    ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Background — dark green ground
    ctx.fillStyle = '#1a3a12';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw lanes as subtle paths
    ctx.strokeStyle = 'rgba(100,100,80,0.4)';
    ctx.lineWidth = 2;
    // Top lane: blue base → NW corner → red base
    const tl1 = worldToMinimap(-80, 80); const tl2 = worldToMinimap(-80, -80); const tl3 = worldToMinimap(80, -80);
    ctx.beginPath(); ctx.moveTo(tl1.x, tl1.y); ctx.lineTo(tl2.x, tl2.y); ctx.lineTo(tl3.x, tl3.y); ctx.stroke();
    // Mid lane: diagonal
    const ml1 = worldToMinimap(-75, 75); const ml2 = worldToMinimap(75, -75);
    ctx.beginPath(); ctx.moveTo(ml1.x, ml1.y); ctx.lineTo(ml2.x, ml2.y); ctx.stroke();
    // Bot lane: blue base → SE corner → red base
    const bl1 = worldToMinimap(-80, 80); const bl2 = worldToMinimap(80, 80); const bl3 = worldToMinimap(80, -80);
    ctx.beginPath(); ctx.moveTo(bl1.x, bl1.y); ctx.lineTo(bl2.x, bl2.y); ctx.lineTo(bl3.x, bl3.y); ctx.stroke();

    // Draw bases
    const blueBase = worldToMinimap(-90, 90);
    ctx.fillStyle = '#2471a3';
    ctx.fillRect(blueBase.x - 6, blueBase.y - 6, 12, 12);
    const redBase = worldToMinimap(90, -90);
    ctx.fillStyle = '#a93226';
    ctx.fillRect(redBase.x - 6, redBase.y - 6, 12, 12);

    // Draw all turrets (both teams, removed when destroyed)
    for (const turret of blueTurrets) {
        if (!turret.alive) continue;
        const p = worldToMinimap(turret.mesh.position.x, turret.mesh.position.z);
        ctx.fillStyle = '#5dade2';
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    for (const turret of redTurrets) {
        if (!turret.alive) continue;
        const p = worldToMinimap(turret.mesh.position.x, turret.mesh.position.z);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }

    // Draw ally minions (always visible)
    ctx.fillStyle = '#85c1e9';
    for (const minion of blueMinions) {
        if (!minion.alive) continue;
        const p = worldToMinimap(minion.mesh.position.x, minion.mesh.position.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw enemy minions (only if visible to an ally)
    ctx.fillStyle = '#f1948a';
    for (const minion of redMinions) {
        if (!minion.alive) continue;
        if (!isEnemyVisibleToAllies(minion.mesh.position, blueMinions, activeVessel)) continue;
        const p = worldToMinimap(minion.mesh.position.x, minion.mesh.position.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw player vessel (always visible, larger and brighter)
    if (activeVessel) {
        const pp = worldToMinimap(activeVessel.mesh.position.x, activeVessel.mesh.position.z);
        // Player vision circle (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        const visionPx = (ALLY_VISION_RANGE / MAP_WORLD_SIZE) * MINIMAP_SIZE;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, visionPx, 0, Math.PI * 2);
        ctx.stroke();
        // Player dot
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
}

// --- GAME LOOP ---
function animate() {
    if (!isGameStarted) return;

    requestAnimationFrame(animate);

    if (isPaused) {
        return;
    }

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    raycaster.setFromCamera(mouse, camera);
    const groundIntersects = raycaster.intersectObject(ground);
    if (groundIntersects.length > 0) {
        mouseWorldPosition.copy(groundIntersects[0].point);
    }

    if (activeVessel) {
        activeVessel.update(deltaTime, keysPressed, camera, mouseWorldPosition);
        updateCooldownUI();
        updateStatsUI(activeVessel);
    }

    // --- MINION WAVE SPAWNING ---
    if (elapsedTime - lastWaveTime >= WAVE_INTERVAL) {
        spawnMinionWave(elapsedTime);
        lastWaveTime = elapsedTime;
    }

    // --- UPDATE MINIONS ---
    // Blue minions fight red minions, and vice versa
    for (const minion of blueMinions) {
        minion.update(deltaTime, elapsedTime, redMinions);
    }
    for (const minion of redMinions) {
        minion.update(deltaTime, elapsedTime, blueMinions);
    }

    // --- UPDATE MINION SLASH EFFECTS ---
    updateMinionSlashes(deltaTime);

    // --- UPDATE JUNGLE MOBS ---
    for (const mob of jungleMobs) {
        mob.update(deltaTime);
    }

    // --- UPDATE TURRETS ---
    // Blue turrets target red minions, then enemy vessel
    for (const turret of blueTurrets) {
        const proj = turret.update(deltaTime, elapsedTime, redMinions.filter(m => m.alive), null);
        if (proj) projectiles.push(proj);
    }
    // Red turrets target blue minions, then player vessel
    for (const turret of redTurrets) {
        const proj = turret.update(deltaTime, elapsedTime, blueMinions.filter(m => m.alive), activeVessel);
        if (proj) projectiles.push(proj);
    }

    // --- UPDATE PROJECTILES ---
    // Split projectiles by team for correct targeting
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        let targets;

        if (proj.team === 'blue') {
            // Blue turret projectiles hit red minions
            targets = redMinions.filter(m => m.alive);
        } else if (proj.team === 'red') {
            // Red turret projectiles hit blue minions + player vessel
            targets = [
                ...blueMinions.filter(m => m.alive),
                ...(activeVessel ? [activeVessel] : [])
            ];
        } else {
            // Player projectiles hit red minions + jungle mobs
            targets = [
                ...jungleMobs.filter(m => m.alive),
                ...redMinions.filter(m => m.alive)
            ];
        }

        if (proj.update(deltaTime, targets)) {
            projectiles.splice(i, 1);
        }
    }

    // --- CLEANUP DEAD MINIONS ---
    // Move fully pooled minions to the pool, remove dying minions from active only when pooled
    for (let i = blueMinions.length - 1; i >= 0; i--) {
        if (blueMinions[i].state === 'pooled') {
            bluePool.push(blueMinions[i]);
            blueMinions.splice(i, 1);
        }
    }
    for (let i = redMinions.length - 1; i >= 0; i--) {
        if (redMinions[i].state === 'pooled') {
            redPool.push(redMinions[i]);
            redMinions.splice(i, 1);
        }
    }

    // --- CAMERA FOLLOW ---
    if (activeVessel) {
        const targetPosition = activeVessel.mesh.position.clone().add(cameraOffset);
        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(activeVessel.mesh.position);
    }

    // --- MINIMAP ---
    drawMinimap();

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = -d * newAspect;
    camera.right = d * newAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loading the game data
loadCharacterData();
