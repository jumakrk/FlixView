const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const serve = require('electron-serve').default;
const { autoUpdater } = require('electron-updater');

const loadURL = serve({ directory: 'out' });

let win;

// Ensure user data directories exist
const userDataPath = path.join(app.getPath('documents'), 'FlixView User Data');
const progressDir = path.join(userDataPath, 'watch progress');
const watchlistDir = path.join(userDataPath, 'watchlist');
const favoritesDir = path.join(userDataPath, 'favourites');

[progressDir, watchlistDir, favoritesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// --- Window State Manager ---
const windowStatePath = path.join(userDataPath, 'window-state.json');

function saveWindowState(window) {
    if (!window) return;
    try {
        const bounds = window.getBounds();
        const isMaximized = window.isMaximized();
        const isFullScreen = window.isFullScreen();
        fs.writeFileSync(windowStatePath, JSON.stringify({ bounds, isMaximized, isFullScreen }));
    } catch (e) {
        console.error('Failed to save window state:', e);
    }
}

function loadWindowState() {
    try {
        if (fs.existsSync(windowStatePath)) {
            return JSON.parse(fs.readFileSync(windowStatePath, 'utf8'));
        }
    } catch (e) {
        console.error('Failed to load window state:', e);
    }
    return null;
}

// Helper to get directory by type
function getDirForType(type) {
    if (type === 'watchlist') return watchlistDir;
    if (type === 'favorites') return favoritesDir;
    if (type === 'progress') return progressDir;
    return progressDir;
}

// --- IPC Handlers for File System Persistence ---

ipcMain.handle('save-data', async (event, type, fileName, data) => {
    try {
        const dir = getDirForType(type);
        const filePath = path.join(dir, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        console.error(`IPC: Failed to save ${type}:`, error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-data', async (event, type, fileName) => {
    try {
        const dir = getDirForType(type);
        const filePath = path.join(dir, `${fileName}.json`);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error(`IPC: Failed to load ${type}:`, error);
        return null;
    }
});

ipcMain.handle('delete-data', async (event, type, fileName) => {
    try {
        const dir = getDirForType(type);
        const filePath = path.join(dir, `${fileName}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-all-data', async (event, type) => {
    try {
        const dir = getDirForType(type);
        if (!fs.existsSync(dir)) return [];
        const files = fs.readdirSync(dir).filter(file => file.endsWith('.json'));
        const allData = files.map(file => {
            try {
                const content = fs.readFileSync(path.join(dir, file), 'utf-8');
                return JSON.parse(content);
            } catch (e) {
                return null;
            }
        }).filter(item => item !== null);
        return allData;
    } catch (error) {
        console.error(`IPC: Failed to get all ${type}:`, error);
        return [];
    }
});

ipcMain.handle('clear-all-data', async (event, type) => {
    try {
        const typesToClear = type === 'all' ? ['watchlist', 'favorites', 'progress'] : [type];
        
        for (const t of typesToClear) {
            const dir = getDirForType(t);
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    fs.unlinkSync(path.join(dir, file));
                }
            }
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Export / Import Handlers ---
ipcMain.handle('export-data', async (event) => {
    try {
        if (!win) return { success: false, error: 'No active window' };
        
        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            title: 'Select Destination Folder for Export',
            properties: ['openDirectory', 'createDirectory']
        });

        if (canceled || filePaths.length === 0) return { success: false, canceled: true };

        const targetDir = filePaths[0];
        const exportDest = path.join(targetDir, 'FlixView User Data Export');
        
        // Copy recursive function
        function copyRecursiveSync(src, dest) {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();
            if (isDirectory) {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest);
                fs.readdirSync(src).forEach(childItemName => {
                    copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
                });
            } else {
                fs.copyFileSync(src, dest);
            }
        }

        if (!fs.existsSync(exportDest)) fs.mkdirSync(exportDest);
        
        [progressDir, watchlistDir, favoritesDir].forEach(dir => {
            const dirName = path.basename(dir);
            const destDir = path.join(exportDest, dirName);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
            copyRecursiveSync(dir, destDir);
        });

        return { success: true, path: exportDest };
    } catch (error) {
        console.error('IPC: Failed to export data:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('import-data', async (event) => {
    try {
        if (!win) return { success: false, error: 'No active window' };

        const { canceled, filePaths } = await dialog.showOpenDialog(win, {
            title: 'Select Exported Data Folder',
            properties: ['openDirectory']
        });

        if (canceled || filePaths.length === 0) return { success: false, canceled: true };

        const sourceDir = filePaths[0];
        
        // Check if the selected folder looks like a valid export
        const hasValidFolders = ['watch progress', 'watchlist', 'favourites'].some(folder => 
            fs.existsSync(path.join(sourceDir, folder))
        );

        if (!hasValidFolders) {
             return { success: false, error: 'Invalid folder structure. Please select a valid FlixView exported data folder.' };
        }

        function copyRecursiveSync(src, dest) {
            const exists = fs.existsSync(src);
            const stats = exists && fs.statSync(src);
            const isDirectory = exists && stats.isDirectory();
            if (isDirectory) {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest);
                fs.readdirSync(src).forEach(childItemName => {
                    copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
                });
            } else {
                fs.copyFileSync(src, dest);
            }
        }

        // Copy everything back
        ['watch progress', 'watchlist', 'favourites'].forEach(folder => {
            const src = path.join(sourceDir, folder);
            const dest = path.join(userDataPath, folder);
            if (fs.existsSync(src)) {
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
                copyRecursiveSync(src, dest);
            }
        });

        return { success: true };
    } catch (error) {
        console.error('IPC: Failed to import data:', error);
        return { success: false, error: error.message };
    }
});

// --- Surgical Reset Engine for Player Cache ---
ipcMain.handle('purge-player-cache', async (event, tmdbId) => {
    try {
        // We clear local storage for the player domains so it forgets all progress, starting from 0.
        // This is safe because our app is the source of truth and explicitly sets the startTime.
        const domains = ['https://vidup.to', 'https://vidfast.net', 'https://vidfast.pro', 'https://vidrock.ru', 'https://www.vidking.net'];
        for (const domain of domains) {
            await session.defaultSession.clearStorageData({
                origin: domain,
                storages: ['localstorage', 'cookies', 'indexdb']
            });
        }
        return { success: true };
    } catch (error) {
        console.error('IPC: Purge Failed:', error);
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
    const state = loadWindowState() || {};
    const bounds = state.bounds || { width: 1200, height: 800 };

    win = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
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

    if (state.isMaximized) {
        win.maximize();
    }
    if (state.isFullScreen) {
        win.setFullScreen(true);
    }

    // Save window state on various events
    let saveTimeout;
    const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveWindowState(win), 500);
    };

    win.on('resize', debouncedSave);
    win.on('move', debouncedSave);
    win.on('close', () => saveWindowState(win));
    win.on('maximize', debouncedSave);
    win.on('unmaximize', debouncedSave);
    win.on('enter-full-screen', debouncedSave);
    win.on('leave-full-screen', debouncedSave);

    // Set up Ad Blocker with full uBlock Origin filter sets
    try {
        const blocker = await ElectronBlocker.fromLists(fetch, [
            'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
            'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
            'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt'
        ]);
        
        blocker.enableBlockingInSession(session.defaultSession);
        
        // Remove the localhost onBeforeRequest listener because it completely overwrites 
        // the AdBlocker's listener, permanently disabling the AdBlocker for all sites!
        
        blocker.on('request-blocked', (request) => {
            // Uncomment to debug blocked ads
            // console.log('AdBlocker Blocked:', request.url);
        });

        console.log('Advanced Ad Blocker enabled');
    } catch (e) {
        console.error('Failed to initialize Ad Blocker:', e);
    }

    if (!app.isPackaged) {
        win.loadURL('http://localhost:3000/').catch(() => {
            win.loadURL('http://localhost:3001/').catch(e => console.error('Failed to load dev server:', e));
        });
    } else {
        // Point to the static export output directory using electron-serve
        win.loadURL('app://-/index.html');
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
        if (url.includes('vidnest.fun')) {
            details.requestHeaders['Referer'] = 'https://vidnest.fun/';
            details.requestHeaders['Origin'] = 'https://vidnest.fun';
        } else if (url.includes('vidrush.net')) {
            details.requestHeaders['Referer'] = 'https://vidrush.net/';
            details.requestHeaders['Origin'] = 'https://vidrush.net';
        } else if (url.includes('vidup.to') || url.includes('dokicloud.one')) {
            details.requestHeaders['Referer'] = 'https://vidup.to/';
            details.requestHeaders['Origin'] = 'https://vidup.to';
        } else if (
            url.includes('vidfast.net') || url.includes('vidfast.pro') || 
            url.includes('vidfast.in') || url.includes('vidfast.io') || 
            url.includes('vidfast.me') || url.includes('vidfast.pm') || 
            url.includes('vidfast.xyz') || url.includes('vidrock.ru') || 
            url.includes('vidking.net')
        ) {
            // Only spoof the referer for the actual iframe load (subFrame).
            // Do not spoof internal API/XHR requests made by the player, otherwise it breaks CORS.
            if (details.resourceType === 'subFrame') {
                details.requestHeaders['Referer'] = 'http://localhost:3000/';
                if (details.requestHeaders['Origin']) {
                    delete details.requestHeaders['Origin'];
                }
            }
        } else if (url.includes('youtube.com') || url.includes('youtube-nocookie.com')) {
            details.requestHeaders['Referer'] = 'https://www.youtube.com/';
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

            // Force external player iframes to be stateless (fixes split-second resume loops)
            if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                try {
                    const memoryStore = {};
                    Storage.prototype.setItem = function(key, value) { memoryStore[key] = String(value); };
                    Storage.prototype.getItem = function(key) { return memoryStore.hasOwnProperty(key) ? memoryStore[key] : null; };
                    Storage.prototype.removeItem = function(key) { delete memoryStore[key]; };
                    Storage.prototype.clear = function() { for (let k in memoryStore) delete memoryStore[k]; };
                } catch (e) {}

                // Manual Progress Seek Override
                // Bypasses player's native progress bugs by directly controlling the HTML5 video element
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const customStart = urlParams.get('custom_start');
                    if (customStart) {
                        const timeToSeek = parseFloat(customStart);
                        if (timeToSeek > 0) {
                            let attempts = 0;
                            const trySeek = setInterval(() => {
                                attempts++;
                                const video = document.querySelector('video');
                                if (video && video.readyState >= 1) { // HAVE_METADATA or more
                                    video.currentTime = timeToSeek;
                                    clearInterval(trySeek);
                                }
                                if (attempts > 50) clearInterval(trySeek); // Max 10 seconds (50 * 200ms)
                            }, 200);
                        }
                    }
                } catch(e) {}
            }
            undefined;
        `;
        contents.executeJavaScript(script).catch(() => {});
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
            'vidnest.fun', 'vidrush.net', 'player.vidrush.net', 'player.videasy.net', 'vidsrc.me', 'vidsrc.to', 
            'embed.su', 'vidsrc.xyz', 'vidsrc.pro', 'vidup.to', 
            'rabbitstream.net', 'dokicloud.one', 'megacloud.tv', 'vidfast.pro', 'vidfast.net',
            'vidfast.in', 'vidfast.io', 'vidfast.me', 'vidfast.pm', 'vidfast.xyz', 'vidrock.ru',
            'cloudflare.com', 'google.com', 'videasy.net', 'youtube.com', 'youtube-nocookie.com', 'vidking.net'
        ];
        const isTrusted = trusted.some(domain => parsed.hostname.endsWith(domain));

        if (!event.isMainFrame && !isLocal && !isInternal && !isTrusted) {
            console.log('Global Sentry: Untrusted Frame Navigated (Allowed for CDN compatibility):', url);
            // We no longer preventDefault here because VidRock and other players use 
            // dynamically changing CDNs (mcloud, vidplay, filemoon) which get blocked.
            // Our script-injected window.open blocker and the uBlock AdBlocker will 
            // handle the actual malicious popups/ads.
        }
    });
});

app.whenReady().then(() => {
    // Strip Electron from User-Agent to bypass Cloudflare bot protection on CDNs
    app.userAgentFallback = app.userAgentFallback.replace(/Electron\/[0-9\.]+ /g, '');
    
    createWindow();
    
    // Auto Updater Setup
    if (app.isPackaged) {
        autoUpdater.autoDownload = false;
        autoUpdater.autoInstallOnAppQuit = false;

        autoUpdater.on('update-available', (info) => {
            if (win) win.webContents.send('update-available', info);
        });
        autoUpdater.on('update-error', (err) => {
            if (win) win.webContents.send('update-error', err);
        });
        autoUpdater.on('download-progress', (progressObj) => {
            if (win) win.webContents.send('download-progress', progressObj);
        });
        autoUpdater.on('update-downloaded', (info) => {
            if (win) win.webContents.send('update-downloaded', info);
        });

        ipcMain.handle('download-update', () => {
            autoUpdater.downloadUpdate();
        });
        ipcMain.handle('quit-and-install', () => {
            autoUpdater.quitAndInstall(false, true);
        });

        // Check for updates on startup
        autoUpdater.checkForUpdates();
        
        // Also check every 4 hours
        setInterval(() => {
            autoUpdater.checkForUpdates();
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
