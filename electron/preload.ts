const { contextBridge, ipcRenderer } = require('electron');

type StorageData = {
  version: number;
  preferences: {
    theme: 'light' | 'dark';
    autoLock: boolean;
    lockTimeout: number;
    defaultDigits: number;
    defaultPeriod: number;
  };
  otpEntries: Array<{
    id: string;
    name: string;
    secret: string;
    issuer?: string;
    algorithm?: string;
    digits?: number;
    period?: number;
    isFavorite?: boolean;
  }>;
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  loadStorage: () => ipcRenderer.invoke('storage:load'),
  saveStorage: (data: StorageData) => ipcRenderer.invoke('storage:save', data),
  exportStorage: (filePath: string) => ipcRenderer.invoke('storage:export', filePath),
  importStorage: (filePath: string) => ipcRenderer.invoke('storage:import', filePath),
  showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:showSave', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:showOpen', options),
});
