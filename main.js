const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let serverProcess = null;
let mainWindow = null;
const PORT = 3000;

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function startServer() {
  return new Promise((resolve, reject) => {
    // In production, server.js is in the resources/standalone folder
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, 'standalone', 'server.js')
      : path.join(__dirname, '.next', 'standalone', 'server.js');

    // Set CWD correctly
    const cwd = app.isPackaged
      ? path.join(process.resourcesPath, 'standalone')
      : path.join(__dirname, '.next', 'standalone');

    console.log('Starting server from:', serverPath);

    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: PORT.toString(),
        HOSTNAME: 'localhost',
        NODE_ENV: 'production',
        ELECTRON_RUN_AS_NODE: '1'
      },
      cwd: cwd
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('Ready') || data.toString().includes('started')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(err);
    });

    // Give server time to start
    setTimeout(resolve, 4000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    fullscreen: true,
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const serverUrl = `http://localhost:${PORT}`;

  // Use app.isPackaged to detect production mode
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, load the Next.js dev server
    mainWindow.loadURL(serverUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from embedded server
    mainWindow.loadURL(serverUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  // Will auto-install on quit
});

app.whenReady().then(async () => {
  // Only start embedded server in production
  if (app.isPackaged) {
    try {
      console.log('Starting embedded Next.js server...');
      await startServer();
      console.log('Server started successfully');

      // Check for updates in production
      autoUpdater.checkForUpdatesAndNotify();
    } catch (err) {
      console.error('Failed to start embedded server:', err);
    }
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
