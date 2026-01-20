const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

let serverProcess = null;
let mainWindow = null;
const PORT = 3000;

// Configure auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Handle App Quit
ipcMain.on('app-quit', () => {
  app.quit();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

function ensureDataFiles() {
  const userDataPath = app.getPath('userData');
  const dataPath = path.join(userDataPath, 'data');

  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  // Files to preserve/seed
  const files = ['products.json', 'categories.json', 'employees.json', 'orders.json'];

  // Source depends on environment
  const sourceBase = app.isPackaged
    ? path.join(process.resourcesPath, 'data')
    : path.join(__dirname, 'data');

  files.forEach(file => {
    const targetPath = path.join(dataPath, file);

    // Only copy if target doesn't exist (don't overwrite user data)
    if (!fs.existsSync(targetPath)) {
      const sourcePath = path.join(sourceBase, file);
      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`Seeded ${file} to ${targetPath}`);
        } catch (err) {
          console.error(`Failed to seed ${file}:`, err);
        }
      } else {
        console.log(`Source file not found for seeding: ${sourcePath}`);
        // Create empty file if needed to avoid crash? 
        // Better to let API handle missing file by returning empty array
        fs.writeFileSync(targetPath, '[]');
      }
    }
  });

  return dataPath;
}

function startServer() {
  return new Promise((resolve, reject) => {
    // Ensure data files exist in UserData
    const dataPath = ensureDataFiles();

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
        ELECTRON_RUN_AS_NODE: '1',
        USER_DATA_PATH: dataPath // Pass the persistent data path
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
// Auto-updater events
const sendStatusToWindow = (text) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', text);
  }
};

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Güncelleme aranıyor...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Güncelleme bulundu. Yüklenecek...');
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Güncelleme bulunamadı.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Güncelleme hatası: ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "İndirme hızı: " + Math.round(progressObj.bytesPerSecond / 1024) + " KB/s";
  log_message = log_message + ' - İndirilen ' + Math.round(progressObj.percent) + '%';
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Güncelleme indirildi. Uygulama kapatıldığında yüklenecek.');
  // Optional: Prompt user to restart
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  }
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

      // Check every hour
      setInterval(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 60 * 60 * 1000);
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
