const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const serve = require('electron-serve').default;
const { autoUpdater } = require('electron-updater');

const loadURL = serve({ directory: 'out' });

let win;

// Ensure progress directory exists
const userDataPath = app.getPath('userData');
const progressDir = path.join(userDataPath, 'progress');
if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true });
}

// --- IPC Handlers for File System Persistence ---

ipcMain.handle('save-progress', async (event, fileName, data) => {
    try {
        const filePath = path.join(progressDir, `${fileName}.json`);
        // Write file atomically (or just write)
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        console.error('IPC: Failed to save progress:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-progress', async (event, fileName) => {
    try {
        const filePath = path.join(progressDir, `${fileName}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('IPC: Failed to load progress:', error);
        return null;
    }
});

ipcMain.handle('delete-progress', async (event, fileName) => {
    try {
        const filePath = path.join(progressDir, `${fileName}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-all-progress', async (event) => {
    try {
        if (!fs.existsSync(progressDir)) return [];
        const files = fs.readdirSync(progressDir).filter(file => file.endsWith('.json'));
        const allData = files.map(file => {
            try {
                const content = fs.readFileSync(path.join(progressDir, file), 'utf-8');
                return JSON.parse(content);
            } catch (e) {
                return null;
            }
        }).filter(item => item !== null);
        return allData;
    } catch (error) {
        console.error('IPC: Failed to get all progress:', error);
        return [];
    }
});

ipcMain.handle('clear-all-progress', async (event) => {
    try {
        if (fs.existsSync(progressDir)) {
            const files = fs.readdirSync(progressDir);
            for (const file of files) {
                fs.unlinkSync(path.join(progressDir, file));
            }
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Auto Updater Integration ---

// Configure autoUpdater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Logging for updates
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (win) {
        win.webContents.send('update-available', info);
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
    if (win) {
        win.webContents.send('update-error', err.message);
    }
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
    if (win) {
        win.webContents.send('download-progress', progressObj);
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    if (win) {
        win.webContents.send('update-downloaded', info);
    }
});

ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});


async function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // Register preload
        },
        backgroundColor: '#0a0a0a',
        show: false,
        titleBarStyle: 'hidden', // Modern titlebar
        titleBarOverlay: {
            color: '#0a0a0a',
            symbolColor: '#ffffff',
            height: 32
        }
    });

    // Set up Ad Blocker with full uBlock Origin filter sets (Production Only to avoid HMR crashes)
    /*
    if (!isDev) {
        const blocker = await ElectronBlocker.fromLists(fetch, [
            'https://easylist.to/easylist/easylist.txt',
            'https://easylist.to/easylist/easyprivacy.txt'
        ]);
        blocker.enableBlockingInSession(session.defaultSession);
        console.log('Advanced Ad Blocker enabled');
    }
    */
    // console.log('Advanced Ad Blocker enabled');

    if (!app.isPackaged) {
        win.loadURL('http://localhost:3000').catch(() => {
            win.loadURL('http://localhost:3001').catch(e => console.error('Failed to load dev server:', e));
        });
    } else {
        // Point to the static export output directory using electron-serve
        loadURL(win);
    }

    win.once('ready-to-show', () => {
        win.show();
    });
}

// Global Protection Sentry
// This is the "Scorched Earth" policy for ads and redirects.

// 1. Block any unexpected new windows from being created at the app level
app.on('browser-window-created', (event, newWin) => {
    // We only ever want ONE window (our main one). Anything else dies instantly.
    if (win && newWin !== win) {
        console.log('Scorched Earth: Vaporizing unintended window');
        newWin.destroy();
    }
});

// 2. Network-Level Interception (Block common ad patterns)
app.on('ready', () => {
    const filter = {
        urls: ['*://*/*']
    };

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        const url = details.url.toLowerCase();
        // More specific ad patterns to avoid catching video segments
        const adPatterns = [
            'propellerads.com', 'onclickads.net', 'popunder', 'propush.com',
            'adservice.google', 'doubleclick.net', 'clksite.com', 'clkads.com',
            'cloktra.com', 'clkmf.com'
        ];

        if (adPatterns.some(pattern => url.includes(pattern))) {
            console.log('Blocked Ad Request:', url);
            return callback({ cancel: true });
        }
        callback({ cancel: false });
    });

    // 2.5 Spoof Headers for Player Compatibility
    // Providers often block app:// and require valid Referer/Origin
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        const url = details.url;
        if (url.includes('vidup.to') || url.includes('dokicloud.one')) {
            details.requestHeaders['Referer'] = 'https://vidup.to/';
            details.requestHeaders['Origin'] = 'https://vidup.to';
        }
        callback({ requestHeaders: details.requestHeaders });
    });
});

// 3. Web-Contents Level Lockdown
app.on('web-contents-created', (event, contents) => {
    // Overwrite window.open in EVERY frame via script injection
    // This is the most effective way to kill redirects before they even start
    contents.on('dom-ready', () => {
        const script = `
            // DOM Safety Patch for AdBlocker conflicts
            const originalRemoveChild = Element.prototype.removeChild;
            Element.prototype.removeChild = function(child) {
                if (child && this.contains(child)) {
                    return originalRemoveChild.call(this, child);
                }
                console.warn('AdBlocker attempted to remove non-existent child');
                return child;
            };
            
            // Global Error Suppression for common HMR/AdBlocker issues
            window.addEventListener('error', (event) => {
                if (event.message?.includes("Cannot read properties of null (reading 'removeChild')")) {
                    console.warn('Suppressed HMR removeChild error');
                    event.preventDefault();
                    event.stopPropagation();
                }
            });

            // Standard AdBlocker overrides
            window.open = function() { console.log('Ad-Block: Blocked window.open attempt'); return null; };
            window.alert = function() { console.log('Ad-Block: Blocked alert'); };
            window.confirm = function() { return true; };
            window.prompt = function() { return null; };
        `;
        contents.executeJavaScript(script);
    });

    // Handle external links (PayPal, etc.) securely
    contents.setWindowOpenHandler(({ url }) => {
        const parsed = new URL(url);
        if (parsed.hostname.includes('paypal.com') || parsed.hostname.includes('buymeacoffee.com')) {
            require('electron').shell.openExternal(url);
            return { action: 'deny' };
        }
        console.log('Global Sentry: Denied popup to:', url);
        return { action: 'deny' };
    });

    // Navigation Filters
    contents.on('will-navigate', (event, url) => {
        const parsed = new URL(url);
        const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
        const isInternal = parsed.protocol === 'app:';
        if (!isLocal && !isInternal) {
            console.log('Global Sentry: Blocked Restricted Navigation:', url);
            event.preventDefault();
        }
    });

    contents.on('will-frame-navigate', (event) => {
        const url = event.url;
        const parsed = new URL(url);
        const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
        const isInternal = parsed.protocol === 'app:';
        const trusted = [
            'vidnest.fun', 'player.videasy.net', 'vidsrc.me', 'vidsrc.to', 
            'embed.su', 'vidsrc.xyz', 'vidsrc.pro', 'vidup.to', 
            'rabbitstream.net', 'dokicloud.one', 'megacloud.tv', 'vidfast.pro',
            'cloudflare.com', 'google.com', 'videasy.net'
        ];
        const isTrusted = trusted.some(domain => parsed.hostname.endsWith(domain));

        if (!event.isMainFrame && !isLocal && !isInternal && !isTrusted) {
            console.log('Global Sentry: Blocked Suspicious Frame Navigation:', url);
            event.preventDefault();
        }
    });
});

app.whenReady().then(() => {
    createWindow();
    
    // Check for updates on startup
    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify();
        
        // Also check every 4 hours
        setInterval(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 4 * 60 * 60 * 1000);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
