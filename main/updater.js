const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

// electron-updater picks the right artifact per platform. The renderer
// (src/context/UpdateContext.tsx) asks for a check on every launch and prompts
// "Update" / "Cancel" when one exists; Update downloads with progress and then
// installs. Automatic background downloads were removed in v0.1.11 on purpose.
// While the app stays open we re-check periodically so long sessions still
// hear about new releases.
const CHECK_INTERVAL_MS = 30 * 60 * 1000;

function send(getMainWindow, channel, payload) {
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
        win.webContents.send(channel, payload);
    }
}

function setupAutoUpdater(getMainWindow) {
    // --- Renderer-invoked channels (registered once, on every platform) ---

    ipcMain.handle('get-app-version', () => app.getVersion());
    ipcMain.handle('get-platform', () => process.platform);

    ipcMain.handle('check-for-update', () => {
        if (!app.isPackaged) {
            // Dev builds have no update feed; report "up to date" shortly so
            // the Settings button resolves instead of hanging on "Checking...".
            console.log('[updater] dev build: skipping update check');
            setTimeout(() => send(getMainWindow, 'update-not-available'), 600);
            return;
        }
        autoUpdater.checkForUpdates().catch(error => {
            console.error('[updater] check failed:', error);
            send(getMainWindow, 'update-error', error.message || String(error));
        });
    });

    ipcMain.handle('download-update', () => {
        if (!app.isPackaged) return;
        autoUpdater.downloadUpdate().catch(error => {
            console.error('[updater] download failed:', error);
            send(getMainWindow, 'update-error', error.message || String(error));
        });
    });

    ipcMain.handle('quit-and-install', () => {
        if (!app.isPackaged) return;
        autoUpdater.quitAndInstall(false, true);
    });

    if (!app.isPackaged) return;

    // --- Packaged builds: wire electron-updater events to the renderer ---

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;

    autoUpdater.on('checking-for-update', () => console.log('[updater] checking for update...'));
    autoUpdater.on('update-available', info => send(getMainWindow, 'update-available', info));
    autoUpdater.on('update-not-available', () => send(getMainWindow, 'update-not-available'));
    autoUpdater.on('download-progress', progress => send(getMainWindow, 'download-progress', progress));
    autoUpdater.on('update-downloaded', info => send(getMainWindow, 'update-downloaded', info));
    autoUpdater.on('error', error => {
        console.error('[updater] error:', error);
        send(getMainWindow, 'update-error', error?.message || String(error));
    });

    // The launch check comes from the renderer once its listeners exist (a
    // check fired here could finish before the page loads and be lost).
    const interval = setInterval(() => {
        autoUpdater.checkForUpdates().catch(error => console.error('[updater] periodic check failed:', error));
    }, CHECK_INTERVAL_MS);
    app.on('before-quit', () => clearInterval(interval));
}

module.exports = { setupAutoUpdater };
