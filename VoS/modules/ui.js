/**
 * This module manages all the UI elements on the screen.
 */

const cooldownFill = document.getElementById('cooldown-fill');
const cooldownText = document.getElementById('cooldown-text');
let scoreElement;

/**
 * Initializes the UI by creating the necessary elements.
 */
export function initUI() {
    // Create score element
    const scoreContainer = document.createElement('div');
    scoreContainer.style.position = 'absolute';
    scoreContainer.style.top = '20px';
    scoreContainer.style.left = '20px';
    scoreContainer.style.color = 'white';
    scoreContainer.style.fontSize = '24px';
    scoreContainer.style.fontFamily = 'sans-serif';
    scoreContainer.innerHTML = 'Orbs: <span id="score">0</span>';
    document.body.appendChild(scoreContainer);
    scoreElement = document.getElementById('score');
}

/**
 * Updates the vessel swap cooldown timer UI.
 * @param {THREE.Clock} clock - The main game clock.
 * @param {number} lastSwapTime - The timestamp of the last swap.
 * @param {number} swapCooldown - The duration of the swap cooldown.
 */
export function updateCooldownUI(clock, lastSwapTime, swapCooldown) {
    const now = clock.getElapsedTime();
    const timeSinceSwap = now - lastSwapTime;
    if (timeSinceSwap < swapCooldown) {
        const progress = timeSinceSwap / swapCooldown;
        const fillHeight = (1 - progress) * 100;
        cooldownFill.style.transform = `translateY(${fillHeight}%)`;
        const timeLeft = swapCooldown - timeSinceSwap;
        cooldownText.textContent = timeLeft.toFixed(1);
    } else {
        cooldownFill.style.transform = 'translateY(100%)';
        cooldownText.textContent = 'SHIFT';
    }
}

/**
 * Updates the score display.
 * @param {number} score - The new score to display.
 */
export function updateScore(score) {
    if (scoreElement) {
        scoreElement.textContent = score;
    }
}
