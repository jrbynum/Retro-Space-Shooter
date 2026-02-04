const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const steamworks = require('steamworks.js');

let steamClient;

function initSteam() {
  try {
    steamClient = steamworks.init(480); // Replace with your real App ID
    console.log(`Steam initialized. Logged in as: ${steamClient.localplayer.getName()}`);
  } catch (e) {
    console.error('Steam failed to initialize.', e);
  }
}

ipcMain.on('unlock-achievement', (event, achId) => {
  if (steamClient) {
    try { steamClient.achievement.activate(achId); } catch (e) {}
  }
});

ipcMain.on('update-rich-presence', (event, status) => {
  if (steamClient) {
    try {
      steamClient.localplayer.setRichPresence('status', status);
      steamClient.localplayer.setRichPresence('steam_display', '#StatusFull');
    } catch (e) {}
  }
});

ipcMain.on('exit-game', () => app.quit());

function createWindow() {
  const isDev = process.env.NODE_ENV === 'development';
  const win = new BrowserWindow({
    width: 800, height: 600, useContentSize: true,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#000000',
    icon: path.join(__dirname, '../public/assets/logo.png')
  });
  win.setMenuBarVisibility(false);
  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  initSteam();
  createWindow();
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });