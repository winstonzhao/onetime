"use strict";
const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const userDataPath = path.join(app.getPath("userData"), "storage.json");
let mainWindow = null;
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
ipcMain.handle("storage:load", async () => {
  try {
    if (!fs.existsSync(userDataPath)) {
      return null;
    }
    const data = fs.readFileSync(userDataPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load storage:", error);
    return null;
  }
});
ipcMain.handle("storage:save", async (_, data) => {
  try {
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save storage:", error);
    return false;
  }
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
ipcMain.handle("dialog:showSave", async (_, options) => {
  return dialog.showSaveDialog(options);
});
ipcMain.handle("dialog:showOpen", async (_, options) => {
  return dialog.showOpenDialog(options);
});
app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });
  app.on("activate", () => {
    if (!mainWindow) {
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
