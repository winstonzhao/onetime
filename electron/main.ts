const { app, BrowserWindow, globalShortcut, ipcMain, dialog, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialize storage path
const userDataPath = path.join(app.getPath('userData'), 'storage.json')

let mainWindow = null
let currentHotkey = 'CommandOrControl+Shift+Space'

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
}

function focusApp() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    // Send event to renderer to focus search and navigate
    mainWindow.webContents.send('focus-search-and-navigate');
  }
}

// Handle storage operations
ipcMain.handle('storage:load', async () => {
  try {
    if (!fs.existsSync(userDataPath)) {
      return null;
    }
    const data = fs.readFileSync(userDataPath, 'utf-8');
    const parsedData = JSON.parse(data);
    
    // Update hotkey if it exists in preferences
    if (parsedData?.preferences?.searchHotkey) {
      updateGlobalHotkey(parsedData.preferences.searchHotkey);
    }
    
    return parsedData;
  } catch (error) {
    console.error('Failed to load storage:', error);
    return null;
  }
});

ipcMain.handle('storage:save', async (_, data) => {
  try {
    // Update hotkey if it changed
    if (data?.preferences?.searchHotkey) {
      updateGlobalHotkey(data.preferences.searchHotkey);
    }
    
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save storage:', error);
    return false;
  }
});

function updateGlobalHotkey(newHotkey: string) {
  try {
    // Unregister old hotkey
    if (currentHotkey) {
      globalShortcut.unregister(currentHotkey);
    }
    
    // Register new hotkey
    globalShortcut.register(newHotkey, focusApp);
    currentHotkey = newHotkey;
    return true;
  } catch (error) {
    console.error('Failed to update hotkey:', error);
    return false;
  }
}

// Handle dialog operations
ipcMain.handle('dialog:showSave', async (_, options) => {
  return dialog.showSaveDialog(options);
});

ipcMain.handle('dialog:showOpen', async (_, options) => {
  return dialog.showOpenDialog(options);
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

// Register IPC handlers
ipcMain.handle('clipboard:copy', (_, text: string) => {
  clipboard.writeText(text);
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

app.whenReady().then(() => {
  createWindow()

  // Register keyboard shortcut to toggle DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools()
    }
  })

  // Register initial global hotkey
  updateGlobalHotkey(currentHotkey)

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
  // Unregister all shortcuts when quitting
  globalShortcut.unregisterAll()
})
