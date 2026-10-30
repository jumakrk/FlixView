const { app, BrowserWindow, session } = require('electron');

const { prepareDataDirs } = require('./main/constants');
const { createWindow } = require('./main/window');
const { registerStorageIpc } = require('./main/ipc-storage');
const { installNetworkGuards, installWindowSentry, installWebContentsSentries } = require('./main/security');
const { setupAutoUpdater } = require('./main/updater');
const { setupAdBlocker } = require('./main/adblocker');

/**
 * FlixView main process. The heavy lifting lives in ./main:
 *   constants.js    - paths, data migration, player provider list
 *   window.js       - BrowserWindow creation / loading
 *   window-state.js - window bounds persistence (with off-screen guard)
 *   ipc-storage.js  - data persistence, export/import, player cache purge
 *   security.js     - ad pattern fallback, header spoofing, popup/navigation
 *                     sentries, in-page DOM safety patches
 *   adblocker.js    - uBlock-based engine with disk cache
 *   updater.js      - electron-updater wiring (dev stubs included)
 */

let win = null;
const getMainWindow = () => win;

// The player lives in a cross-origin iframe, where Chromium blocks unmuted
// autoplay. Vidly then never attaches its stream and sits on a spinner until
// the user clicks (and its first click is spent on an ad popup we block).
// Must be set before the app is ready.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Create/migrate the on-disk data directories before anything can read them.
prepareDataDirs();

// Register IPC + global listeners before the window exists so the first
// window is already covered by the sentries.
registerStorageIpc({ getMainWindow });
installWindowSentry(getMainWindow);
installWebContentsSentries();

app.whenReady().then(() => {
    // Strip "Electron/x.y.z" from the UA so CDN/Cloudflare bot checks treat
    // the app like a regular browser.
    app.userAgentFallback = app.userAgentFallback.replace(/Electron\/[0-9.]+ /g, '');

    win = createWindow();

    // Network guards need a live session; they backstop the adblocker.
    installNetworkGuards();

    // Ad blocking engine (cached where possible). Fire-and-forget: the app is
    // fully usable while lists load, and blocking only matters once a player
    // is opened.
    setupAdBlocker(session.defaultSession);

    setupAutoUpdater(getMainWindow);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        win = createWindow();
    }
});
