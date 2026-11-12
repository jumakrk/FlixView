const { ipcMain, dialog, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const {
    DATA_ROOT,
    DATA_DIR_NAMES,
    PLAYER_ORIGINS,
    getDirForType,
    copyRecursiveSync,
} = require('./constants');

function registerStorageIpc({ getMainWindow }) {
    // --- Data persistence (one JSON file per item, one folder per type) ---

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
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
            return files.map(file => {
                try {
                    return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
                } catch {
                    return null;
                }
            }).filter(item => item !== null);
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
                    for (const file of fs.readdirSync(dir)) {
                        fs.unlinkSync(path.join(dir, file));
                    }
                }
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Where the user's data actually lives on disk (shown in Settings).
    ipcMain.handle('get-data-path', () => DATA_ROOT);
    // Fixed path from the main process; the renderer cannot pass its own.
    ipcMain.handle('open-data-folder', () => shell.openPath(DATA_ROOT));

    // --- Export / Import ---

    ipcMain.handle('export-data', async () => {
        try {
            const win = getMainWindow();
            if (!win) return { success: false, error: 'No active window' };

            const { canceled, filePaths } = await dialog.showOpenDialog(win, {
                title: 'Select Destination Folder for Export',
                properties: ['openDirectory', 'createDirectory'],
            });

            if (canceled || filePaths.length === 0) return { success: false, canceled: true };

            const exportDest = path.join(filePaths[0], 'FlixView User Data Export');
            if (!fs.existsSync(exportDest)) fs.mkdirSync(exportDest);

            for (const name of DATA_DIR_NAMES) {
                const src = path.join(DATA_ROOT, name);
                const dest = path.join(exportDest, name);
                if (!fs.existsSync(src)) continue;
                if (!fs.existsSync(dest)) fs.mkdirSync(dest);
                copyRecursiveSync(src, dest);
            }

            return { success: true, path: exportDest };
        } catch (error) {
            console.error('IPC: Failed to export data:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('import-data', async () => {
        try {
            const win = getMainWindow();
            if (!win) return { success: false, error: 'No active window' };

            const { canceled, filePaths } = await dialog.showOpenDialog(win, {
                title: 'Select Exported Data Folder',
                properties: ['openDirectory'],
            });

            if (canceled || filePaths.length === 0) return { success: false, canceled: true };

            const sourceDir = filePaths[0];

            // Validate that the selected folder looks like a FlixView export.
            const hasValidFolders = DATA_DIR_NAMES.some(name => fs.existsSync(path.join(sourceDir, name)));
            if (!hasValidFolders) {
                return { success: false, error: 'Invalid folder structure. Please select a valid FlixView exported data folder.' };
            }

            for (const name of DATA_DIR_NAMES) {
                const src = path.join(sourceDir, name);
                const dest = path.join(DATA_ROOT, name);
                if (!fs.existsSync(src)) continue;
                if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
                copyRecursiveSync(src, dest);
            }

            return { success: true };
        } catch (error) {
            console.error('IPC: Failed to import data:', error);
            return { success: false, error: error.message };
        }
    });

    // --- Player cache purge ---
    // The player can keep its own per-title state (positions, server picks) in
    // localStorage / IndexedDB. FlixView is the source of truth for progress
    // (it always sends an explicit resume position), so that state is dropped.
    // Cookies are left intact: the player sits behind Cloudflare and wiping
    // them before every mount would force a fresh bot challenge each time.
    ipcMain.handle('purge-player-cache', async () => {
        try {
            for (const origin of PLAYER_ORIGINS) {
                await session.defaultSession.clearStorageData({
                    origin,
                    storages: ['localstorage', 'indexdb'],
                });
            }
            return { success: true };
        } catch (error) {
            console.error('IPC: Purge failed:', error);
            return { success: false, error: error.message };
        }
    });
}

module.exports = { registerStorageIpc };
