const { app, BrowserWindow, screen } = require('electron');
const path = require('path');
const serve = require('electron-serve').default;
const { loadWindowState, attachWindowStateSaver } = require('./window-state');

// Serves the static Next.js export (out/) over a custom app:// protocol in
// packaged builds.
const loadURL = serve({ directory: 'out' });

// Height of the native title bar overlay that draws the minimize / maximize
// / close buttons, in screen units. Windows draws those buttons at a fixed
// size for the display scale, so the overlay is never shrunk; the app's top
// bar follows its real height through the --titlebar-height CSS variable.
const TITLE_BAR_HEIGHT = 32;

// Display scaling (Windows 125%, 150%, 175%...) enlarges every CSS pixel, so
// the UI gets less room and its layout wraps or overflows. We counter-zoom the
// page so it gets the same pixel space it would have at 100% on that screen.
// On very high-resolution screens the layout width is capped so the UI stays
// readable rather than shrinking to 4K-at-100% size. macOS Retina scaling is
// not the same thing (2x is the native density), so it is left alone.
const MAX_LAYOUT_WIDTH = 2560;

function zoomForDisplay(display) {
    if (process.platform === 'darwin') return 1;
    const physicalWidth = display.size.width * display.scaleFactor;
    return Math.min(1, display.size.width / Math.min(physicalWidth, MAX_LAYOUT_WIDTH));
}

function applyDisplayScaling(win) {
    if (!win || win.isDestroyed()) return;
    const zoom = zoomForDisplay(screen.getDisplayMatching(win.getBounds()));
    if (Math.abs(win.webContents.getZoomFactor() - zoom) > 0.001) {
        win.webContents.setZoomFactor(zoom);
    }
}

// F11 toggles fullscreen and Esc leaves it, since fullscreen hides the title
// bar (and its window buttons). Esc during the player's own (HTML) fullscreen
// is left to Chromium, which exits it and restores the window.
function attachFullScreenKeys(win) {
    let htmlFullScreen = false;
    win.webContents.on('enter-html-full-screen', () => { htmlFullScreen = true; });
    win.webContents.on('leave-html-full-screen', () => { htmlFullScreen = false; });

    win.webContents.on('before-input-event', (event, input) => {
        if (input.type !== 'keyDown') return;
        if (input.key === 'F11') {
            event.preventDefault();
            win.setFullScreen(!win.isFullScreen());
        } else if (input.key === 'Escape' && win.isFullScreen() && !htmlFullScreen) {
            win.setFullScreen(false);
        }
    });
}

function createWindow() {
    const state = loadWindowState() || {};
    const bounds = state.bounds || { width: 1200, height: 800 };

    const win = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        minWidth: 800,
        minHeight: 560,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '..', 'preload.js'),
        },
        backgroundColor: '#0a0a0a',
        show: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0a0a0a',
            symbolColor: '#ffffff',
            height: TITLE_BAR_HEIGHT,
        },
    });

    attachWindowStateSaver(win);
    attachFullScreenKeys(win);

    // Re-apply scaling after each load and whenever the window lands on a
    // display with a different scale (moved between monitors, or the user
    // changed Windows' scale setting while the app is open).
    const rescale = () => applyDisplayScaling(win);
    win.webContents.on('did-finish-load', rescale);
    win.on('moved', rescale);
    screen.on('display-metrics-changed', rescale);
    win.on('closed', () => screen.removeListener('display-metrics-changed', rescale));

    if (!app.isPackaged) {
        win.loadURL('http://localhost:3000/').catch(() => {
            win.loadURL('http://localhost:3001/').catch(e => console.error('Failed to load dev server:', e));
        });
    } else {
        // electron-serve loads app://-/ which resolves to out/index.html while
        // keeping location.pathname as '/', so the exported Next.js router
        // matches the home route (loading app://-/index.html directly would
        // make the router see a path of /index.html).
        loadURL(win).catch(error => console.error('Failed to load app:', error));
    }

    // Maximize as the window is first shown: on Windows, maximizing a window
    // that has not been shown yet is undone by the later show().
    win.once('ready-to-show', () => {
        if (state.isMaximized) win.maximize();
        win.show();
    });
    return win;
}

module.exports = { createWindow };
