// fog_of_war.js
// Map-view fog-of-war with persistent exploration and live visibility.

function cellKey(cx, cz) {
    return `${cx},${cz}`;
}

function worldToCell(value, cellSize) {
    return Math.floor(value / cellSize);
}

export function createFogOfWar(options = {}) {
    const config = {
        cellSize: options.cellSize || 8,
        defaultRevealRadius: options.defaultRevealRadius || 24
    };

    const revealedCells = new Set();
    const visibleCells = new Set();
    let mapOverlayCanvas = null;
    let mapOverlayContext = null;
    let enabled = false;

    function ensureCanvas() {
        if (mapOverlayCanvas) return;

        mapOverlayCanvas = document.createElement('canvas');
        mapOverlayCanvas.id = 'fog-overlay';
        mapOverlayCanvas.style.position = 'absolute';
        mapOverlayCanvas.style.inset = '0';
        mapOverlayCanvas.style.pointerEvents = 'none';
        mapOverlayCanvas.style.zIndex = '35';
        mapOverlayCanvas.style.display = 'none';

        const overlayRoot = document.getElementById('ui-overlay') || document.body;
        overlayRoot.appendChild(mapOverlayCanvas);
        mapOverlayContext = mapOverlayCanvas.getContext('2d');
        resize();
    }

    function resize() {
        if (!mapOverlayCanvas) return;
        mapOverlayCanvas.width = window.innerWidth;
        mapOverlayCanvas.height = window.innerHeight;
    }

    function setEnabled(nextEnabled) {
        ensureCanvas();
        enabled = !!nextEnabled;
        mapOverlayCanvas.style.display = enabled ? 'block' : 'none';
    }

    function revealAt(position, radius = config.defaultRevealRadius, persistent = true) {
        if (!position) return;
        const cx = worldToCell(position.x, config.cellSize);
        const cz = worldToCell(position.z, config.cellSize);
        const range = Math.ceil(radius / config.cellSize);

        for (let z = -range; z <= range; z++) {
            for (let x = -range; x <= range; x++) {
                const distSq = x * x + z * z;
                if (distSq > range * range) continue;
                const key = cellKey(cx + x, cz + z);
                visibleCells.add(key);
                if (persistent) {
                    revealedCells.add(key);
                }
            }
        }
    }

    function clearFrameVisibility() {
        visibleCells.clear();
    }

    function drawCellSet(cells, mapCamera, alpha) {
        if (!mapOverlayContext || !mapOverlayCanvas || cells.size === 0) return;
        const worldMinX = mapCamera.position.x + mapCamera.left;
        const worldMaxX = mapCamera.position.x + mapCamera.right;
        const worldMinZ = mapCamera.position.z + mapCamera.bottom;
        const worldMaxZ = mapCamera.position.z + mapCamera.top;

        const worldWidth = worldMaxX - worldMinX;
        const worldHeight = worldMaxZ - worldMinZ;

        cells.forEach((key) => {
            const [cxRaw, czRaw] = key.split(',');
            const cx = Number(cxRaw);
            const cz = Number(czRaw);
            const cellMinX = cx * config.cellSize;
            const cellMinZ = cz * config.cellSize;
            const cellMaxX = cellMinX + config.cellSize;
            const cellMaxZ = cellMinZ + config.cellSize;

            if (cellMaxX < worldMinX || cellMinX > worldMaxX || cellMaxZ < worldMinZ || cellMinZ > worldMaxZ) {
                return;
            }

            const screenX = ((cellMinX - worldMinX) / worldWidth) * mapOverlayCanvas.width;
            const screenYTop = (1 - ((cellMaxZ - worldMinZ) / worldHeight)) * mapOverlayCanvas.height;
            const screenWidth = (config.cellSize / worldWidth) * mapOverlayCanvas.width;
            const screenHeight = (config.cellSize / worldHeight) * mapOverlayCanvas.height;

            mapOverlayContext.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            mapOverlayContext.fillRect(screenX, screenYTop, screenWidth + 1, screenHeight + 1);
        });
    }

    function render(mapCamera) {
        if (!enabled || !mapOverlayContext || !mapOverlayCanvas || !mapCamera) return;

        mapOverlayContext.clearRect(0, 0, mapOverlayCanvas.width, mapOverlayCanvas.height);
        mapOverlayContext.fillStyle = 'rgba(6, 10, 8, 0.9)';
        mapOverlayContext.fillRect(0, 0, mapOverlayCanvas.width, mapOverlayCanvas.height);

        mapOverlayContext.globalCompositeOperation = 'destination-out';
        drawCellSet(revealedCells, mapCamera, 0.62);
        drawCellSet(visibleCells, mapCamera, 0.96);
        mapOverlayContext.globalCompositeOperation = 'source-over';

        // Light grid helps orient the player while most of the map is hidden.
        mapOverlayContext.strokeStyle = 'rgba(180, 255, 220, 0.07)';
        mapOverlayContext.lineWidth = 1;
        const step = 52;
        for (let x = 0; x < mapOverlayCanvas.width; x += step) {
            mapOverlayContext.beginPath();
            mapOverlayContext.moveTo(x, 0);
            mapOverlayContext.lineTo(x, mapOverlayCanvas.height);
            mapOverlayContext.stroke();
        }
        for (let y = 0; y < mapOverlayCanvas.height; y += step) {
            mapOverlayContext.beginPath();
            mapOverlayContext.moveTo(0, y);
            mapOverlayContext.lineTo(mapOverlayCanvas.width, y);
            mapOverlayContext.stroke();
        }
    }

    window.addEventListener('resize', resize);

    return {
        setEnabled,
        revealAt,
        clearFrameVisibility,
        render,
        getSnapshot() {
            return {
                cellSize: config.cellSize,
                revealed: Array.from(revealedCells)
            };
        },
        applySnapshot(snapshot) {
            revealedCells.clear();
            if (snapshot && Array.isArray(snapshot.revealed)) {
                snapshot.revealed.forEach((key) => revealedCells.add(key));
            }
        }
    };
}
