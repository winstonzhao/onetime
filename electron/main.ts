const { app, BrowserWindow, globalShortcut, ipcMain, dialog, clipboard, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Initialize storage path
const userDataPath = path.join(app.getPath('userData'), 'storage.json')

let mainWindow = null
let tray = null
let currentHotkey = 'CommandOrControl+Shift+Space'

function createWindow() {
  if (mainWindow) {
    return
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'public', 'icon.ico')
  })

  // Set CSP in the main process
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:"]
      }
    })
  })

  // In development, load from the Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // In production, load the index.html file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Prevent window from closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // Clean up the window reference when closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  // Create a native image from the ICO file
  const iconPath = path.join(__dirname, '..', 'public', 'icon.ico')
  const trayIcon = nativeImage.createFromPath(iconPath)
  tray = new Tray(trayIcon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show OneTime',
      click: () => {
        showWindow()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('OneTime')
  tray.setContextMenu(contextMenu)

  // Single click on tray icon shows the window
  tray.on('click', () => {
    showWindow()
  })
}

function showWindow() {
  if (!mainWindow) {
    createWindow()
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.show()
  mainWindow.focus()
}

function focusApp() {
  showWindow()
  // Send event to renderer to focus search and navigate
  mainWindow.webContents.send('focus-search-and-navigate');
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
  console.log('Main process: copying to clipboard:', text); // Debug log
  clipboard.writeText(text);
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

// Handle second instance
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showWindow()
  })
}

app.whenReady().then(() => {
  createTray()
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
