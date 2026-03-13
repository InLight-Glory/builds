// terrain_manager.js
// Chunk-streamed terrain with procedural fallback and optional tiled JPG heightmaps.

const DEFAULTS = {
    chunkSize: 80,
    chunkResolution: 28,
    loadRadius: 3,
    maxHeight: 24,
    mapTilePath: 'map/tile_x{col}_y{row}.jpg'
};

function fract(value) {
    return value - Math.floor(value);
}

function hash2(x, z) {
    return fract(Math.sin(x * 127.1 + z * 311.7) * 43758.5453123);
}

function smoothstep(t) {
    return t * t * (3 - 2 * t);
}

function valueNoise2D(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;

    const h00 = hash2(ix, iz);
    const h10 = hash2(ix + 1, iz);
    const h01 = hash2(ix, iz + 1);
    const h11 = hash2(ix + 1, iz + 1);

    const ux = smoothstep(fx);
    const uz = smoothstep(fz);

    const nx0 = h00 + (h10 - h00) * ux;
    const nx1 = h01 + (h11 - h01) * ux;
    return nx0 + (nx1 - nx0) * uz;
}

function sampleProceduralHeight(x, z, maxHeight) {
    const low = (valueNoise2D(x * 0.011, z * 0.011) - 0.5) * 2;
    const mid = (valueNoise2D(x * 0.028, z * 0.028) - 0.5) * 2;
    const high = (valueNoise2D(x * 0.08, z * 0.08) - 0.5) * 2;
    const mixed = (low * 0.7) + (mid * 0.22) + (high * 0.08);
    return mixed * maxHeight;
}

function keyForChunk(cx, cz) {
    return `${cx},${cz}`;
}

function parseKey(key) {
    const [cx, cz] = key.split(',').map(Number);
    return { cx, cz };
}

function buildTilePath(template, cx, cz) {
    return template
        .replace('{col}', String(cx))
        .replace('{row}', String(cz));
}

function createTileState(path) {
    return {
        path,
        status: 'loading',
        width: 0,
        height: 0,
        data: null
    };
}

export function createTerrainManager(scene, options = {}) {
    const config = {
        ...DEFAULTS,
        ...options
    };

    const chunkMap = new Map();
    const tileMap = new Map();
    const terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d4a3f,
        map: config.groundTexture || null,
        roughness: 0.96,
        metalness: 0.04
    });
    if (terrainMaterial.map) {
        terrainMaterial.map.wrapS = THREE.RepeatWrapping;
        terrainMaterial.map.wrapT = THREE.RepeatWrapping;
    }

    const sharedVector = new THREE.Vector3();
    const visibleKeys = new Set();

    function requestTile(cx, cz) {
        const key = keyForChunk(cx, cz);
        if (tileMap.has(key)) return;

        const path = buildTilePath(config.mapTilePath, cx, cz);
        const tileState = createTileState(path);
        tileMap.set(key, tileState);

        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            const imageData = context.getImageData(0, 0, image.width, image.height);
            tileState.status = 'loaded';
            tileState.width = image.width;
            tileState.height = image.height;
            tileState.data = imageData.data;

            // Refresh chunk geometry once tile data becomes available.
            const chunk = chunkMap.get(key);
            if (chunk) {
                updateChunkHeights(chunk.mesh, cx, cz);
            }
        };

        image.onerror = () => {
            tileState.status = 'missing';
        };

        image.src = path;
    }

    function sampleTileHeight(cx, cz, localX, localZ) {
        const key = keyForChunk(cx, cz);
        if (!tileMap.has(key)) {
            requestTile(cx, cz);
            return null;
        }

        const tile = tileMap.get(key);
        if (!tile || tile.status !== 'loaded' || !tile.data) {
            return null;
        }

        const px = Math.max(0, Math.min(tile.width - 1, Math.floor(localX * (tile.width - 1))));
        const pz = Math.max(0, Math.min(tile.height - 1, Math.floor(localZ * (tile.height - 1))));
        const index = (pz * tile.width + px) * 4;
        const r = tile.data[index];
        const g = tile.data[index + 1];
        const b = tile.data[index + 2];
        const gray = (r + g + b) / (3 * 255);
        return (gray - 0.5) * 2 * config.maxHeight;
    }

    function heightAtWorld(x, z) {
        const cx = Math.floor(x / config.chunkSize);
        const cz = Math.floor(z / config.chunkSize);
        const localX = (x - cx * config.chunkSize) / config.chunkSize;
        const localZ = (z - cz * config.chunkSize) / config.chunkSize;
        const tileHeight = sampleTileHeight(cx, cz, localX, localZ);
        if (tileHeight !== null) {
            return tileHeight;
        }
        return sampleProceduralHeight(x, z, config.maxHeight);
    }

    function updateChunkHeights(mesh, cx, cz) {
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        const vertexCount = positions.count;

        for (let i = 0; i < vertexCount; i++) {
            const localX = positions.getX(i);
            const localZ = positions.getZ(i);
            const worldX = mesh.position.x + localX;
            const worldZ = mesh.position.z + localZ;
            const height = heightAtWorld(worldX, worldZ);
            positions.setY(i, height);
        }

        positions.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
    }

    function createChunk(cx, cz) {
        const geometry = new THREE.PlaneGeometry(
            config.chunkSize,
            config.chunkSize,
            config.chunkResolution,
            config.chunkResolution
        );
        geometry.rotateX(-Math.PI / 2);

        const mesh = new THREE.Mesh(geometry, terrainMaterial);
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        mesh.name = `GroundChunk_${cx}_${cz}`;
        mesh.userData = {
            isTerrainChunk: true,
            chunkX: cx,
            chunkZ: cz
        };
        mesh.position.set(
            cx * config.chunkSize + config.chunkSize * 0.5,
            0,
            cz * config.chunkSize + config.chunkSize * 0.5
        );

        updateChunkHeights(mesh, cx, cz);
        scene.add(mesh);

        chunkMap.set(keyForChunk(cx, cz), {
            mesh,
            cx,
            cz
        });

        return mesh;
    }

    function removeChunk(key) {
        const chunk = chunkMap.get(key);
        if (!chunk) return;
        scene.remove(chunk.mesh);
        if (chunk.mesh.geometry) chunk.mesh.geometry.dispose();
        chunkMap.delete(key);
    }

    function update(playerPosition) {
        if (!playerPosition) return;

        const centerChunkX = Math.floor(playerPosition.x / config.chunkSize);
        const centerChunkZ = Math.floor(playerPosition.z / config.chunkSize);

        visibleKeys.clear();
        for (let dz = -config.loadRadius; dz <= config.loadRadius; dz++) {
            for (let dx = -config.loadRadius; dx <= config.loadRadius; dx++) {
                const cx = centerChunkX + dx;
                const cz = centerChunkZ + dz;
                const key = keyForChunk(cx, cz);
                visibleKeys.add(key);
                if (!chunkMap.has(key)) {
                    createChunk(cx, cz);
                }
            }
        }

        chunkMap.forEach((_chunk, key) => {
            if (!visibleKeys.has(key)) {
                removeChunk(key);
            }
        });
    }

    function intersectRay(raycaster) {
        const meshes = Array.from(chunkMap.values()).map((chunk) => chunk.mesh);
        if (meshes.length === 0) return [];
        return raycaster.intersectObjects(meshes, false);
    }

    function getWorldBounds() {
        if (chunkMap.size === 0) {
            return {
                minX: -config.chunkSize,
                maxX: config.chunkSize,
                minZ: -config.chunkSize,
                maxZ: config.chunkSize
            };
        }

        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minZ = Number.POSITIVE_INFINITY;
        let maxZ = Number.NEGATIVE_INFINITY;

        chunkMap.forEach((chunkData, key) => {
            const parsed = parseKey(key);
            const chunkMinX = parsed.cx * config.chunkSize;
            const chunkMaxX = chunkMinX + config.chunkSize;
            const chunkMinZ = parsed.cz * config.chunkSize;
            const chunkMaxZ = chunkMinZ + config.chunkSize;

            minX = Math.min(minX, chunkMinX);
            maxX = Math.max(maxX, chunkMaxX);
            minZ = Math.min(minZ, chunkMinZ);
            maxZ = Math.max(maxZ, chunkMaxZ);
        });

        return { minX, maxX, minZ, maxZ };
    }

    function getLoadedChunkMeshes() {
        return Array.from(chunkMap.values()).map((chunk) => chunk.mesh);
    }

    function getHeightAt(x, z) {
        sharedVector.set(x, 0, z);
        return heightAtWorld(sharedVector.x, sharedVector.z);
    }

    return {
        material: terrainMaterial,
        update,
        getHeightAt,
        intersectRay,
        getLoadedChunkMeshes,
        getWorldBounds,
        config
    };
}
