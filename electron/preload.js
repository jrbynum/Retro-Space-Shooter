const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  unlockAchievement: (achId) => ipcRenderer.send('unlock-achievement', achId),
  updateRichPresence: (status) => ipcRenderer.send('update-rich-presence', status),
  exitGame: () => ipcRenderer.send('exit-game')
});