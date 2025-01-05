import { StorageData } from '../services/storage';

interface ElectronAPI {
  loadStorage: () => Promise<StorageData | null>;
  saveStorage: (data: StorageData) => Promise<boolean>;
  exportStorage: (filePath: string) => Promise<void>;
  importStorage: (filePath: string) => Promise<void>;
  showSaveDialog: (options: any) => Promise<string>;
  showOpenDialog: (options: any) => Promise<string>;
  onFocusSearch: (callback: () => void) => void;
  offFocusSearch: (callback: () => void) => void;
  copyToClipboard: (text: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  getStoragePath: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
