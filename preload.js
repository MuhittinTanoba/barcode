const { contextBridge, ipcRenderer } = require('electron');

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})

contextBridge.exposeInMainWorld('electronAPI', {
    quitApp: () => ipcRenderer.send('app-quit'),
    onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, text) => callback(text)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event) => callback()),
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
