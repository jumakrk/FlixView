const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    saveProgress: (fileName, data) => ipcRenderer.invoke('save-progress', fileName, data),
    loadProgress: (fileName) => ipcRenderer.invoke('load-progress', fileName),
    deleteProgress: (fileName) => ipcRenderer.invoke('delete-progress', fileName),
    getAllProgress: () => ipcRenderer.invoke('get-all-progress'),
    clearAllProgress: () => ipcRenderer.invoke('clear-all-progress')
});
