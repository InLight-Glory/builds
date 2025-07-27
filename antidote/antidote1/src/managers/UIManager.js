/**
 * UIManager.js
 * Manages all interactions with the HTML elements of the UI.
 */
const uiManager = (function() {
    let ui = {}; // To hold references to DOM elements
    let callbacks = {}; // To hold button click handlers

    console.log("UIManager initialized.");

    function initialize() {
        // Get references to all the UI elements
        ui.pauseMenu = document.getElementById('pause-menu');
        ui.saveButton = document.getElementById('save-button');
        ui.loadButton = document.getElementById('load-button');
        ui.resumeButton = document.getElementById('resume-button');
        ui.notification = document.getElementById('notification');

        // Attach event listeners
        ui.saveButton.onclick = () => callbacks.save ? callbacks.save() : null;
        ui.loadButton.onclick = () => callbacks.load ? callbacks.load() : null;
        ui.resumeButton.onclick = () => callbacks.resume ? callbacks.resume() : null;
    }

    function showMenu() { ui.pauseMenu.classList.remove('hidden'); }
    function hideMenu() { ui.pauseMenu.classList.add('hidden'); }

    function showNotification(message, isError = false, duration = 2000) {
        ui.notification.textContent = message;
        ui.notification.style.backgroundColor = isError ? 'rgba(180, 0, 0, 0.75)' : 'rgba(0, 128, 0, 0.75)';
        ui.notification.style.opacity = '1';

        if (ui.notificationTimeout) clearTimeout(ui.notificationTimeout);

        ui.notificationTimeout = setTimeout(() => {
            ui.notification.style.opacity = '0';
        }, duration);
    }

    // Public API
    return {
        initialize,
        onSaveClick: (cb) => { callbacks.save = cb; },
        onLoadClick: (cb) => { callbacks.load = cb; },
        onResumeClick: (cb) => { callbacks.resume = cb; },
        showMenu,
        hideMenu,
        showNotification
    };
})();
