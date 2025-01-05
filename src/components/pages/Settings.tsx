import { useState } from 'react';
import { storageService, UserPreferences } from '../../services/storage';

const Settings = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(storageService.getPreferences());
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePreferenceChange = async (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await storageService.updatePreferences(newPreferences);
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Export Settings',
        defaultPath: 'onetime-backup.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!result.canceled && result.filePath) {
        const success = await storageService.exportData(result.filePath);
        if (success) {
          setMessage({ type: 'success', text: 'Data exported successfully!' });
        } else {
          throw new Error('Failed to export data');
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const handleImport = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        title: 'Import Settings',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const success = await storageService.importData(result.filePaths[0]);
        if (success) {
          setPreferences(storageService.getPreferences());
          setMessage({ type: 'success', text: 'Data imported successfully!' });
        } else {
          throw new Error('Invalid data file');
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import data' });
    }
  };

  return (
    <div className="container">
      <div className="card settings-card">
        <h1>Settings</h1>
        
        <section className="settings-section">
          <h2>Appearance</h2>
          <div className="setting-item">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={(e) => handlePreferenceChange('theme', e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2>Backup & Restore</h2>
          <div className="backup-buttons">
            <button onClick={handleExport}>
              Export Data
            </button>
            <button onClick={handleImport}>
              Import Data
            </button>
          </div>
        </section>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
