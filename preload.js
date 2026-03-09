const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveProgress: (fileName, data) => ipcRenderer.invoke('save-progress', fileName, data),
    loadProgress: (fileName) => ipcRenderer.invoke('load-progress', fileName),
    deleteProgress: (fileName) => ipcRenderer.invoke('delete-progress', fileName),
    getAllProgress: () => ipcRenderer.invoke('get-all-progress'),
    clearAllProgress: () => ipcRenderer.invoke('clear-all-progress'),
    
    // Auto Updater
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
    onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, error) => callback(error)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install')
});
