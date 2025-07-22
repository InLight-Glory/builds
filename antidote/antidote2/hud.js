document.addEventListener('DOMContentLoaded', () => {
    const uiOverlay = document.getElementById('ui-overlay');

    const hudContainer = document.createElement('div');
    hudContainer.style.position = 'absolute';
    hudContainer.style.top = '20px';
    hudContainer.style.left = '20px';
    hudContainer.style.background = 'rgba(0,0,0,0.6)';
    hudContainer.style.color = '#fff';
    hudContainer.style.padding = '12px 24px';
    hudContainer.style.borderRadius = '8px';
    hudContainer.style.fontSize = '1.2rem';
    hudContainer.style.zIndex = '1000';

    const healthDiv = document.createElement('div');
    healthDiv.id = 'hud-health';
    healthDiv.textContent = 'Health: 100';

    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'hud-score';
    scoreDiv.textContent = 'Score: 0';

    const woodDiv = document.createElement('div');
    woodDiv.id = 'hud-wood';
    woodDiv.textContent = 'Wood: 0';

    const stoneDiv = document.createElement('div');
    stoneDiv.id = 'hud-stone';
    stoneDiv.textContent = 'Stone: 0';

    hudContainer.appendChild(healthDiv);
    hudContainer.appendChild(scoreDiv);
    hudContainer.appendChild(woodDiv);
    hudContainer.appendChild(stoneDiv);
    uiOverlay.appendChild(hudContainer);

    // Function to update HUD
    window.updateHUD = (health, score, wood, stone) => {
        if (health !== null) healthDiv.textContent = `Health: ${health}`;
        if (score !== null) scoreDiv.textContent = `Score: ${score}`;
        if (wood !== null) woodDiv.textContent = `Wood: ${wood}`;
        if (stone !== null) stoneDiv.textContent = `Stone: ${stone}`;
    };
});