const { app, BrowserWindow } = require('electron');
const path = require('path');
const serve = require('electron-serve').default;
const { loadWindowState, attachWindowStateSaver } = require('./window-state');

// Serves the static Next.js export (out/) over a custom app:// protocol in
// packaged builds.
const loadURL = serve({ directory: 'out' });

function createWindow() {
    const state = loadWindowState() || {};
    const bounds = state.bounds || { width: 1200, height: 800 };

    const win = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
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
            height: 32,
        },
    });

    if (state.isMaximized) win.maximize();
    if (state.isFullScreen) win.setFullScreen(true);

    attachWindowStateSaver(win);

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

    win.once('ready-to-show', () => win.show());
    return win;
}

module.exports = { createWindow };
