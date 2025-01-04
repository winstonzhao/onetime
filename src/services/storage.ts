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

export interface OTPEntry {
  id: string;
  name: string;
  secret: string;
  issuer?: string;
  algorithm?: string;
  digits?: number;
  period?: number;
  isFavorite?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  autoLock: boolean;
  lockTimeout: number; // in minutes
  defaultDigits: number;
  defaultPeriod: number;
}

export interface StorageData {
  version: number;
  preferences: UserPreferences;
  otpEntries: OTPEntry[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  autoLock: true,
  lockTimeout: 5,
  defaultDigits: 6,
  defaultPeriod: 30,
};

const DEFAULT_STORAGE: StorageData = {
  version: 1,
  preferences: DEFAULT_PREFERENCES,
  otpEntries: [],
};

class StorageService {
  private data: StorageData = DEFAULT_STORAGE;
  private initialized: boolean = false;

  constructor() {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    // Wait for the window.electronAPI to be available
    if (!window.electronAPI) {
      setTimeout(() => this.initStorage(), 100);
      return;
    }

    try {
      const data = await window.electronAPI.loadStorage();
      if (data) {
        this.data = this.migrateStorageIfNeeded(data);
      } else {
        await this.saveStorage(DEFAULT_STORAGE);
        this.data = DEFAULT_STORAGE;
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load storage:', error);
      this.data = DEFAULT_STORAGE;
      this.initialized = true;
    }
  }

  private migrateStorageIfNeeded(data: StorageData): StorageData {
    // Handle future version migrations here
    if (!data.version) {
      data.version = 1;
    }
    return data;
  }

  private async saveStorage(data: StorageData): Promise<void> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }

    try {
      await window.electronAPI.saveStorage(data);
    } catch (error) {
      console.error('Failed to save storage:', error);
    }
  }

  // OTP Entries methods
  getOTPEntries(): OTPEntry[] {
    return this.data.otpEntries;
  }

  async addOTPEntry(entry: OTPEntry): Promise<void> {
    this.data.otpEntries.push(entry);
    await this.saveStorage(this.data);
  }

  async updateOTPEntry(id: string, updates: Partial<OTPEntry>): Promise<void> {
    const index = this.data.otpEntries.findIndex(entry => entry.id === id);
    if (index !== -1) {
      this.data.otpEntries[index] = { ...this.data.otpEntries[index], ...updates };
      await this.saveStorage(this.data);
    }
  }

  async deleteOTPEntry(id: string): Promise<void> {
    this.data.otpEntries = this.data.otpEntries.filter(entry => entry.id !== id);
    await this.saveStorage(this.data);
  }

  // Preferences methods
  getPreferences(): UserPreferences {
    return this.data.preferences;
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    this.data.preferences = { ...this.data.preferences, ...updates };
    await this.saveStorage(this.data);
  }

  // Import/Export methods
  async exportData(filePath: string): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return false;
    }
    return await window.electronAPI.exportStorage(filePath);
  }

  async importData(filePath: string): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return false;
    }

    try {
      const newData = await window.electronAPI.importStorage(filePath);
      if (!newData || !this.validateStorageData(newData)) {
        throw new Error('Invalid storage data format');
      }
      this.data = this.migrateStorageIfNeeded(newData);
      await this.saveStorage(this.data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  private validateStorageData(data: any): data is StorageData {
    return (
      data &&
      typeof data.version === 'number' &&
      data.preferences &&
      Array.isArray(data.otpEntries)
    );
  }
}

export const storageService = new StorageService();
