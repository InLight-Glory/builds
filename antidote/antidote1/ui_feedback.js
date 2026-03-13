// ui_feedback.js
// Non-blocking UI messaging and objective state.

let noticeList;
let objectiveTitle;
let objectiveBody;
let pulseStatus;

function ensureElements() {
    noticeList = document.getElementById('notice-list');
    objectiveTitle = document.getElementById('objective-title');
    objectiveBody = document.getElementById('objective-body');
    pulseStatus = document.getElementById('pulse-status');
}

export function initUIFeedback() {
    ensureElements();
}

export function pushGameNotice(message, type = 'info') {
    ensureElements();
    if (!noticeList) return;

    const item = document.createElement('div');
    item.className = `notice notice-${type}`;
    item.textContent = message;
    noticeList.prepend(item);

    window.setTimeout(() => {
        item.classList.add('notice-exit');
        window.setTimeout(() => item.remove(), 360);
    }, 3600);
}

export function updateObjectives(snapshot) {
    ensureElements();
    if (!objectiveTitle || !objectiveBody) return;

    const state = snapshot?.state ?? 0;
    const metrics = snapshot?.metrics ?? {};

    if (state === 0) {
        objectiveTitle.textContent = 'Stabilize The Sector';
        objectiveBody.textContent = 'Build a Base, subdue roaming Gray, and get contamination below control thresholds.';
    } else if (state === 1) {
        objectiveTitle.textContent = 'Push Into Regrowth';
        objectiveBody.textContent = 'Invest water and energy into restoration pulses while expanding infrastructure.';
    } else if (state === 2) {
        objectiveTitle.textContent = 'Hold The Recovery Line';
        objectiveBody.textContent = `Biomass ${Math.round(metrics.biomass ?? 0)} / 70. Keep pressure down and finish the cleanse.`;
    } else {
        objectiveTitle.textContent = 'Clean Zone Established';
        objectiveBody.textContent = 'Biome restored. Continue building density and tune combat pacing for external testers.';
    }
}

export function setPulseStatus(text) {
    ensureElements();
    if (pulseStatus) pulseStatus.textContent = text;
}
