"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  loadStorage: () => ipcRenderer.invoke("storage:load"),
  saveStorage: (data) => ipcRenderer.invoke("storage:save", data),
  exportStorage: (filePath) => ipcRenderer.invoke("storage:export", filePath),
  importStorage: (filePath) => ipcRenderer.invoke("storage:import", filePath),
  showSaveDialog: (options) => ipcRenderer.invoke("dialog:showSave", options),
  showOpenDialog: (options) => ipcRenderer.invoke("dialog:showOpen", options),
  onFocusSearch: (callback) => ipcRenderer.on("focus-search", callback)
});
