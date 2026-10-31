const { screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { DATA_ROOT } = require('./constants');

const windowStatePath = path.join(DATA_ROOT, 'window-state.json');

// Require meaningful overlap with a display work area so a window last used on
// a now-disconnected monitor does not reopen off-screen.
function isVisibleOnSomeDisplay(bounds) {
    return screen.getAllDisplays().some(display => {
        const area = display.workArea;
        return (
            bounds.x + bounds.width > area.x + 50 &&
            bounds.x < area.x + area.width - 50 &&
            bounds.y + bounds.height > area.y + 50 &&
            bounds.y < area.y + area.height - 50
        );
    });
}

// Fullscreen is deliberately NOT persisted. The player's fullscreen button
// puts the whole window into fullscreen, which hides the title bar and its
// minimize / maximize / close buttons; restoring that on launch left users in
// a chromeless window with no way out. While fullscreen, the last windowed
// size is kept instead.
function saveWindowState(win) {
    if (!win || win.isDestroyed() || win.isFullScreen()) return;
    try {
        const bounds = win.getBounds();
        const isMaximized = win.isMaximized();
        fs.writeFileSync(windowStatePath, JSON.stringify({ bounds, isMaximized }));
    } catch (error) {
        console.error('[window] failed to save state:', error);
    }
}

function loadWindowState() {
    try {
        if (!fs.existsSync(windowStatePath)) return null;
        const state = JSON.parse(fs.readFileSync(windowStatePath, 'utf8'));
        // Older builds saved fullscreen; a fullscreen window's bounds are the
        // whole display, so fall back to maximized instead of a borderless
        // screen-sized window.
        if (state.isFullScreen) {
            state.isMaximized = true;
            state.bounds = null;
        }
        delete state.isFullScreen;
        if (state.bounds && !isVisibleOnSomeDisplay(state.bounds)) {
            console.warn('[window] saved bounds are off-screen; using default size');
            state.bounds = null;
        }
        return state;
    } catch (error) {
        console.error('[window] failed to load state:', error);
        return null;
    }
}

// Persist position/size/maximized state across restarts. Saves are
// debounced because resize/move fire continuously while dragging.
function attachWindowStateSaver(win) {
    let saveTimeout;
    const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveWindowState(win), 500);
    };

    win.on('resize', debouncedSave);
    win.on('move', debouncedSave);
    win.on('close', () => {
        clearTimeout(saveTimeout);
        saveWindowState(win);
    });
    win.on('maximize', debouncedSave);
    win.on('unmaximize', debouncedSave);
    win.on('enter-full-screen', debouncedSave);
    win.on('leave-full-screen', debouncedSave);
}

module.exports = { loadWindowState, attachWindowStateSaver };
