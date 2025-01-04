import { StorageData } from '../services/storage';

declare global {
  interface Window {
    electronAPI: {
      loadStorage: () => Promise<StorageData | null>;
      saveStorage: (data: StorageData) => Promise<boolean>;
      exportStorage: (filePath: string) => Promise<boolean>;
      importStorage: (filePath: string) => Promise<StorageData | null>;
      showSaveDialog: (options: any) => Promise<{ filePath?: string; canceled: boolean }>;
      showOpenDialog: (options: any) => Promise<{ filePaths: string[]; canceled: boolean }>;
    };
  }
}
