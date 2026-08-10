const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveData: (type, fileName, data) => ipcRenderer.invoke('save-data', type, fileName, data),
    loadData: (type, fileName) => ipcRenderer.invoke('load-data', type, fileName),
    deleteData: (type, fileName) => ipcRenderer.invoke('delete-data', type, fileName),
    getAllData: (type) => ipcRenderer.invoke('get-all-data', type),
    clearAllData: (type) => ipcRenderer.invoke('clear-all-data', type),
    
    exportData: () => ipcRenderer.invoke('export-data'),
    importData: () => ipcRenderer.invoke('import-data'),
    
    // Auto Updater
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, error) => callback(error)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (_event) => callback()),
    checkForUpdates: () => ipcRenderer.invoke('check-for-update'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    purgePlayerCache: (tmdbId) => ipcRenderer.invoke('purge-player-cache', tmdbId)
});
