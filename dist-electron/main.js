"use strict";
const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const userDataPath = path.join(app.getPath("userData"), "storage.json");
let mainWindow = null;
let currentHotkey = "CommandOrControl+Shift+Space";
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}
function focusApp() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("focus-search");
  }
}
ipcMain.handle("storage:load", async () => {
  var _a;
  try {
    if (!fs.existsSync(userDataPath)) {
      return null;
    }
    const data = fs.readFileSync(userDataPath, "utf-8");
    const parsedData = JSON.parse(data);
    if ((_a = parsedData == null ? void 0 : parsedData.preferences) == null ? void 0 : _a.searchHotkey) {
      updateGlobalHotkey(parsedData.preferences.searchHotkey);
    }
    return parsedData;
  } catch (error) {
    console.error("Failed to load storage:", error);
    return null;
  }
});
ipcMain.handle("storage:save", async (_, data) => {
  var _a;
  try {
    if ((_a = data == null ? void 0 : data.preferences) == null ? void 0 : _a.searchHotkey) {
      updateGlobalHotkey(data.preferences.searchHotkey);
    }
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save storage:", error);
    return false;
  }
});
function updateGlobalHotkey(newHotkey) {
  try {
    if (currentHotkey) {
      globalShortcut.unregister(currentHotkey);
    }
    globalShortcut.register(newHotkey, focusApp);
    currentHotkey = newHotkey;
    return true;
  } catch (error) {
    console.error("Failed to update hotkey:", error);
    return false;
  }
}
ipcMain.handle("dialog:showSave", async (_, options) => {
  return dialog.showSaveDialog(options);
});
ipcMain.handle("dialog:showOpen", async (_, options) => {
  return dialog.showOpenDialog(options);
});
ipcMain.handle("storage:export", async (_, filePath) => {
  try {
    const data = fs.readFileSync(userDataPath, "utf-8");
    fs.writeFileSync(filePath, data);
    return true;
  } catch (error) {
    console.error("Failed to export storage:", error);
    return false;
  }
});
ipcMain.handle("storage:import", async (_, filePath) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    fs.writeFileSync(userDataPath, data);
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to import storage:", error);
    return null;
  }
});
app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
  updateGlobalHotkey(currentHotkey);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
