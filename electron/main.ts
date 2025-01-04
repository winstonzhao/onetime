const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialize storage path
const userDataPath = path.join(app.getPath('userData'), 'storage.json')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // In development, load from the Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // In production, load the index.html file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Open DevTools by default in development
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }
}

// Handle storage operations
ipcMain.handle('storage:load', async () => {
  try {
    if (!fs.existsSync(userDataPath)) {
      return null;
    }
    const data = fs.readFileSync(userDataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load storage:', error);
    return null;
  }
});

ipcMain.handle('storage:save', async (_, data) => {
  try {
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save storage:', error);
    return false;
  }
});

ipcMain.handle('storage:export', async (_, filePath) => {
  try {
    const data = fs.readFileSync(userDataPath, 'utf-8');
    fs.writeFileSync(filePath, data);
    return true;
  } catch (error) {
    console.error('Failed to export storage:', error);
    return false;
  }
});

ipcMain.handle('storage:import', async (_, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    fs.writeFileSync(userDataPath, data);
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to import storage:', error);
    return null;
  }
});

// Handle dialog operations
ipcMain.handle('dialog:showSave', async (_, options) => {
  return dialog.showSaveDialog(options);
});

ipcMain.handle('dialog:showOpen', async (_, options) => {
  return dialog.showOpenDialog(options);
});

app.whenReady().then(() => {
  createWindow()

  // Register keyboard shortcut to toggle DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Unregister the shortcut when quitting
  globalShortcut.unregisterAll()
})
