// runtime_state.js
// Shared mutable runtime registry for world systems.

const runtimeState = {
    objects: null,
    collidableObjects: new Set(),
    units: new Set(),
    selectedUnits: new Set(),
    buildings: new Set(),
    terrainManager: null,
    fogController: null,
    worldBounds: {
        minX: -500,
        maxX: 500,
        minZ: -500,
        maxZ: 500
    }
};

function removeFromArray(array, item) {
    if (!Array.isArray(array)) return;
    const index = array.indexOf(item);
    if (index >= 0) {
        array.splice(index, 1);
    }
}

export function initRuntimeState(objectsArray) {
    runtimeState.objects = objectsArray;
}

export function getRuntimeState() {
    return runtimeState;
}

export function registerWorldObject(object, options = {}) {
    if (!object) return;

    if (runtimeState.objects && !runtimeState.objects.includes(object)) {
        runtimeState.objects.push(object);
    }

    if (options.collidable !== false) {
        runtimeState.collidableObjects.add(object);
    }

    if (options.isBuilding) {
        runtimeState.buildings.add(object);
    }

    if (options.type) {
        if (!object.userData) object.userData = {};
        object.userData.runtimeType = options.type;
    }
}

export function unregisterWorldObject(object) {
    if (!object) return;
    runtimeState.collidableObjects.delete(object);
    runtimeState.units.delete(object);
    runtimeState.selectedUnits.delete(object);
    runtimeState.buildings.delete(object);
    removeFromArray(runtimeState.objects, object);
}

export function getCollidableObjects() {
    if (runtimeState.collidableObjects.size > 0) {
        return Array.from(runtimeState.collidableObjects).filter((object) => !!object && (!!object.parent || object.name === 'Ground'));
    }
    return Array.isArray(runtimeState.objects) ? runtimeState.objects : [];
}

export function registerUnit(unit) {
    if (!unit) return;
    runtimeState.units.add(unit);
}

export function unregisterUnit(unit) {
    runtimeState.units.delete(unit);
    runtimeState.selectedUnits.delete(unit);
}

export function getUnits() {
    return Array.from(runtimeState.units);
}

export function clearUnitSelection() {
    runtimeState.selectedUnits.clear();
}

export function addSelectedUnit(unit) {
    if (!unit) return;
    runtimeState.selectedUnits.add(unit);
}

export function setSelectedUnits(units) {
    runtimeState.selectedUnits.clear();
    units.forEach((unit) => runtimeState.selectedUnits.add(unit));
}

export function getSelectedUnits() {
    return Array.from(runtimeState.selectedUnits);
}

export function setTerrainManager(manager) {
    runtimeState.terrainManager = manager;
}

export function getTerrainManager() {
    return runtimeState.terrainManager;
}

export function getTerrainHeightAt(x, z) {
    if (runtimeState.terrainManager && typeof runtimeState.terrainManager.getHeightAt === 'function') {
        return runtimeState.terrainManager.getHeightAt(x, z);
    }
    return 0;
}

export function setFogController(controller) {
    runtimeState.fogController = controller;
}

export function getFogController() {
    return runtimeState.fogController;
}
