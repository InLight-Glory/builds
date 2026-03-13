// zone_system.js
// Data-driven zone simulation for survival/restoration loops.

const ZONE_STATE_LABELS = ["Dead", "Stabilized", "Regrowth", "Clean"];
const ZONE_COLORS = [0x3d4a3f, 0x60765f, 0x5f8b52, 0x6fbf6b];
const FOG_COLORS = [0x5b6a5f, 0x6a7d6d, 0x7fa57a, 0x96c88b];
const SKY_COLORS = [0x6f7d73, 0x84a18f, 0x91b890, 0x9ed8a0];
const ACCENT_COLORS = ["#8f6f4e", "#74d1a0", "#96f0bc", "#d5ffe6"];

const BASE_METRICS = {
    contamination: 100,
    hydration: 10,
    biomass: 0,
    infrastructure: 0
};

const STATE_RULES = [
    { contaminationMax: 100, hydrationMin: 0, biomassMin: 0, infrastructureMin: 0 },  // Dead
    { contaminationMax: 80, hydrationMin: 20, biomassMin: 10, infrastructureMin: 20 }, // Stabilized
    { contaminationMax: 55, hydrationMin: 45, biomassMin: 35, infrastructureMin: 40 }, // Regrowth
    { contaminationMax: 25, hydrationMin: 65, biomassMin: 70, infrastructureMin: 60 }  // Clean
];

let metrics = { ...BASE_METRICS };
let sceneRef = null;
let groundMaterialRef = null;
let currentState = 0;
let ui = {};
let zoneVisuals = null;
let frameAccumulator = 0;
let stress = {
    targetMs: 16.7,
    avgMs: 0,
    worstMs: 0,
    samples: 0
};

function notify(message, type = "info") {
    if (typeof window.pushGameNotice === "function") {
        window.pushGameNotice(message, type);
    }
}

function clamp(value) {
    return Math.max(0, Math.min(100, value));
}

function stateForMetrics(values) {
    let best = 0;
    for (let i = 1; i < STATE_RULES.length; i++) {
        const rule = STATE_RULES[i];
        if (
            values.contamination <= rule.contaminationMax &&
            values.hydration >= rule.hydrationMin &&
            values.biomass >= rule.biomassMin &&
            values.infrastructure >= rule.infrastructureMin
        ) {
            best = i;
        }
    }
    return best;
}

function cacheUI() {
    ui.state = document.getElementById("zone-state-value");
    ui.contamination = document.getElementById("zone-contamination-value");
    ui.hydration = document.getElementById("zone-hydration-value");
    ui.biomass = document.getElementById("zone-biomass-value");
    ui.infrastructure = document.getElementById("zone-infra-value");
    ui.milestone = document.getElementById("zone-milestone-value");
    ui.frame = document.getElementById("zone-frame-value");
}

function updateMilestoneText() {
    if (!ui.milestone) return;
    if (currentState < 1) ui.milestone.textContent = "M1: Reach Stabilized";
    else if (currentState < 2) ui.milestone.textContent = "M1 Complete | M2: Reach Regrowth";
    else if (currentState < 3) ui.milestone.textContent = "M2 Complete | M3: Hold Regrowth under pressure";
    else ui.milestone.textContent = "M4 Ready: Clean biome variants unlocked";
}

function applyVisualState() {
    if (!groundMaterialRef || typeof THREE === "undefined") return;
    const targetGround = new THREE.Color(ZONE_COLORS[currentState]);
    const targetFog = new THREE.Color(FOG_COLORS[currentState]);
    const targetSky = new THREE.Color(SKY_COLORS[currentState]);
    groundMaterialRef.color.copy(targetGround);
    if (sceneRef && sceneRef.fog) {
        sceneRef.fog.color.copy(targetFog);
    }
    if (sceneRef && sceneRef.background) {
        sceneRef.background.copy(targetSky);
    }
    if (zoneVisuals) {
        if (zoneVisuals.skyMaterial) {
            zoneVisuals.skyMaterial.color.setHex(SKY_COLORS[currentState]);
        }
        if (zoneVisuals.hazeMaterial) {
            zoneVisuals.hazeMaterial.color.setHex(SKY_COLORS[currentState]);
        }
        if (Array.isArray(zoneVisuals.accentMaterials)) {
            zoneVisuals.accentMaterials.forEach((material) => material.color.set(ACCENT_COLORS[currentState]));
        }
        if (Array.isArray(zoneVisuals.glowMaterials)) {
            zoneVisuals.glowMaterials.forEach((material) => {
                material.color.set(ACCENT_COLORS[currentState]);
                if (material.emissive) material.emissive.set(ACCENT_COLORS[currentState]);
            });
        }
    }
    document.documentElement.style.setProperty("--zone-accent", ACCENT_COLORS[currentState]);
}

function updateUI() {
    if (ui.state) ui.state.textContent = `${currentState} (${ZONE_STATE_LABELS[currentState]})`;
    if (ui.contamination) ui.contamination.textContent = metrics.contamination.toFixed(0);
    if (ui.hydration) ui.hydration.textContent = metrics.hydration.toFixed(0);
    if (ui.biomass) ui.biomass.textContent = metrics.biomass.toFixed(0);
    if (ui.infrastructure) ui.infrastructure.textContent = metrics.infrastructure.toFixed(0);
    if (ui.frame) {
        ui.frame.textContent = `${stress.avgMs.toFixed(1)}ms avg / ${stress.worstMs.toFixed(1)}ms worst`;
    }
    updateMilestoneText();
}

function recalcState() {
    const next = stateForMetrics(metrics);
    if (next !== currentState) {
        currentState = next;
        applyVisualState();
        if (currentState === 1) notify("Zone stabilized. Regrowth systems are now viable.", "success");
        else if (currentState === 2) notify("Regrowth phase reached. Hold the line and keep restoring.", "success");
        else if (currentState === 3) notify("Clean biome established. This sector is tester-ready.", "success");
    }
}

export function initZoneSystem(scene, groundMaterial) {
    sceneRef = scene;
    groundMaterialRef = groundMaterial;
    cacheUI();
    recalcState();
    applyVisualState();
    updateUI();
}

export function registerZoneVisuals(visuals) {
    zoneVisuals = visuals;
    applyVisualState();
}

export function onBuildingCompleted(type) {
    metrics.infrastructure = clamp(metrics.infrastructure + 12);
    if (type === "Refinery") {
        metrics.hydration = clamp(metrics.hydration + 8);
    } else if (type === "Barracks") {
        metrics.contamination = clamp(metrics.contamination - 4);
    } else if (type === "Base") {
        metrics.biomass = clamp(metrics.biomass + 6);
    }
    recalcState();
    updateUI();
    notify(`${type} construction completed.`, "success");
}

export function onTheGraySubdued() {
    metrics.contamination = clamp(metrics.contamination - 9);
    metrics.biomass = clamp(metrics.biomass + 3);
    recalcState();
    updateUI();
}

export function applyRestorationPulse(playerStats) {
    if (!playerStats) {
        return { ok: false, message: "Missing player state." };
    }

    const pulseCost = { water: 12, energy: 10, wood: 8, metal: 4 };
    const hasResources =
        playerStats.water >= pulseCost.water &&
        playerStats.energy >= pulseCost.energy &&
        playerStats.wood >= pulseCost.wood &&
        playerStats.metal >= pulseCost.metal;

    if (!hasResources) {
        if (typeof window.setPulseStatus === "function") {
            window.setPulseStatus("Insufficient resources");
        }
        return { ok: false, message: "Need water, energy, wood, and metal for restoration." };
    }

    playerStats.water -= pulseCost.water;
    playerStats.energy -= pulseCost.energy;
    playerStats.wood -= pulseCost.wood;
    playerStats.metal -= pulseCost.metal;

    metrics.contamination = clamp(metrics.contamination - 7);
    metrics.hydration = clamp(metrics.hydration + 8);
    metrics.biomass = clamp(metrics.biomass + 10);
    metrics.infrastructure = clamp(metrics.infrastructure + 2);
    recalcState();
    updateUI();
    if (typeof window.setPulseStatus === "function") {
        window.setPulseStatus("Pulse discharged successfully");
    }
    return { ok: true, message: "Restoration pulse applied." };
}

export function updateZoneSystem(delta, context) {
    frameAccumulator += delta;
    if (frameAccumulator < 0.25) return;
    frameAccumulator = 0;

    const enemyCount = context?.enemyCount ?? 0;
    const refineryCount = context?.refineryCount ?? 0;
    const baseCount = context?.baseCount ?? 0;

    metrics.contamination = clamp(metrics.contamination + enemyCount * 0.35 - (metrics.infrastructure * 0.03));
    metrics.hydration = clamp(metrics.hydration - 0.45 + refineryCount * 0.6);
    metrics.biomass = clamp(metrics.biomass - 0.25 + baseCount * 0.5 + (metrics.hydration * 0.015));

    recalcState();
    updateUI();
}

export function updateFrameBudget(delta) {
    const frameMs = delta * 1000;
    stress.samples += 1;
    stress.avgMs += (frameMs - stress.avgMs) / stress.samples;
    if (frameMs > stress.worstMs) stress.worstMs = frameMs;
}

export function getZoneSnapshot() {
    return {
        metrics: { ...metrics },
        state: currentState,
        stress: { ...stress }
    };
}

export function applyZoneSnapshot(snapshot) {
    if (!snapshot || !snapshot.metrics) return;
    metrics = {
        contamination: clamp(snapshot.metrics.contamination ?? BASE_METRICS.contamination),
        hydration: clamp(snapshot.metrics.hydration ?? BASE_METRICS.hydration),
        biomass: clamp(snapshot.metrics.biomass ?? BASE_METRICS.biomass),
        infrastructure: clamp(snapshot.metrics.infrastructure ?? BASE_METRICS.infrastructure)
    };
    currentState = Math.max(0, Math.min(3, snapshot.state ?? stateForMetrics(metrics)));
    if (snapshot.stress) {
        stress = {
            targetMs: 16.7,
            avgMs: snapshot.stress.avgMs ?? 0,
            worstMs: snapshot.stress.worstMs ?? 0,
            samples: snapshot.stress.samples ?? 0
        };
    }
    applyVisualState();
    updateUI();
}

export function getPulseReadinessText(playerStats, hasBaseAccess) {
    if (!hasBaseAccess) return "Awaiting Base uplink";
    if (!playerStats) return "Field rig offline";
    if (playerStats.water < 12 || playerStats.energy < 10 || playerStats.wood < 8 || playerStats.metal < 4) {
        return "Charge resources for pulse";
    }
    return "Pulse ready";
}
