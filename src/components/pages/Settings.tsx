import { useState, useRef } from 'react';
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
          setMessage({ type: 'success', text: 'Settings exported successfully!' });
        } else {
          throw new Error('Failed to export settings');
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export settings' });
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
          setMessage({ type: 'success', text: 'Settings imported successfully!' });
        } else {
          throw new Error('Invalid settings file');
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import settings' });
    }
  };

  return (
    <div className="container">
      <div className="card settings-card">
        <h1>Settings</h1>
        
        <section className="settings-section">
          <h2>Preferences</h2>
          
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

          <div className="setting-item">
            <label htmlFor="autoLock">
              <input
                type="checkbox"
                id="autoLock"
                checked={preferences.autoLock}
                onChange={(e) => handlePreferenceChange('autoLock', e.target.checked)}
              />
              Auto Lock
            </label>
          </div>

          {preferences.autoLock && (
            <div className="setting-item">
              <label htmlFor="lockTimeout">Lock Timeout (minutes)</label>
              <input
                type="number"
                id="lockTimeout"
                min="1"
                max="60"
                value={preferences.lockTimeout}
                onChange={(e) => handlePreferenceChange('lockTimeout', parseInt(e.target.value))}
              />
            </div>
          )}

          <div className="setting-item">
            <label htmlFor="defaultDigits">Default OTP Digits</label>
            <select
              id="defaultDigits"
              value={preferences.defaultDigits}
              onChange={(e) => handlePreferenceChange('defaultDigits', parseInt(e.target.value))}
            >
              <option value="6">6 digits</option>
              <option value="8">8 digits</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="defaultPeriod">Default OTP Period (seconds)</label>
            <select
              id="defaultPeriod"
              value={preferences.defaultPeriod}
              onChange={(e) => handlePreferenceChange('defaultPeriod', parseInt(e.target.value))}
            >
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2>Backup & Restore</h2>
          <div className="backup-buttons">
            <button className="button" onClick={handleExport}>
              Export Settings
            </button>
            <button className="button" onClick={handleImport}>
              Import Settings
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
