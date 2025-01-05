import { useState, useEffect } from 'react';
import { storageService, OTPEntry } from '../../services/storage';
import { generateTOTP, getRemainingSeconds } from '../../services/totp';

const Passwords = () => {
  const [otpEntries, setOtpEntries] = useState<OTPEntry[]>([]);
  const [codes, setCodes] = useState<{ [key: string]: string }>({});
  const [remainingTime, setRemainingTime] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', issuer: '' });

  // Load OTP entries
  useEffect(() => {
    const entries = storageService.getOTPEntries();
    setOtpEntries(entries);
  }, []);

  // Generate TOTP codes and update remaining time
  useEffect(() => {
    const updateCodes = async () => {
      const newCodes: { [key: string]: string } = {};
      for (const entry of otpEntries) {
        try {
          newCodes[entry.id] = await generateTOTP(
            entry.secret,
            entry.period || 30,
            entry.digits || 6
          );
        } catch (error) {
          console.error('Error generating TOTP for entry:', entry.name, error);
          newCodes[entry.id] = '000000';
        }
      }
      setCodes(newCodes);
      setRemainingTime(getRemainingSeconds());
    };

    // Initial update
    updateCodes();

    // Update every second
    const interval = setInterval(() => {
      const remaining = getRemainingSeconds();
      setRemainingTime(remaining);
      
      // Generate new codes when period resets
      if (remaining === 30) {
        updateCodes();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [otpEntries]);

  const formatCode = (code: string): string => {
    return code.replace(/(\d{3})(\d{3})/, '$1 $2');
  };

  const copyToClipboard = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code.replace(/\s/g, ''));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const toggleFavorite = async (entry: OTPEntry) => {
    try {
      await storageService.updateOTPEntry(entry.id, {
        ...entry,
        isFavorite: !entry.isFavorite
      });
      const entries = storageService.getOTPEntries();
      setOtpEntries(entries);
    } catch (err) {
      console.error('Failed to update favorite status:', err);
    }
  };

  const startEditing = (entry: OTPEntry) => {
    setEditingId(entry.id);
    setEditForm({ name: entry.name, issuer: entry.issuer || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const entry = otpEntries.find(e => e.id === editingId);
      if (!entry) return;

      await storageService.updateOTPEntry(editingId, {
        ...entry,
        name: editForm.name,
        issuer: editForm.issuer
      });
      
      const entries = storageService.getOTPEntries();
      setOtpEntries(entries);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to save changes:', err);
    }
  };

  const filteredAndSortedEntries = otpEntries
    .filter(entry => {
      const searchLower = searchQuery.toLowerCase();
      return entry.name.toLowerCase().includes(searchLower) ||
             (entry.issuer || '').toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      // Sort by favorite status first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="container">
      <div className="card passwords-card">
        <div className="passwords-header">
          <h1>One-Time Passwords</h1>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="timer-container">
            <div className="timer-bar" style={{ width: `${(remainingTime / 30) * 100}%` }} />
          </div>
        </div>
        
        <div className="passwords-list">
          {filteredAndSortedEntries.map(entry => (
            <div key={entry.id} className={`password-item ${entry.isFavorite ? 'favorite' : ''}`}>
              <div className="password-info">
                {editingId === entry.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="edit-input"
                    />
                    <input
                      type="text"
                      value={editForm.issuer}
                      onChange={(e) => setEditForm(prev => ({ ...prev, issuer: e.target.value }))}
                      placeholder="Issuer"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button onClick={saveEdit} className="save-button">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="cancel-button">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="name-row">
                      <button
                        className={`favorite-button ${entry.isFavorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(entry)}
                        aria-label={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={entry.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                      <h3>{entry.name}</h3>
                      <button
                        className="edit-button"
                        onClick={() => startEditing(entry)}
                        aria-label="Edit entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    {entry.issuer && <span className="issuer">{entry.issuer}</span>}
                  </>
                )}
              </div>
              <div className="password-code-container">
                <div className="password-code">
                  {formatCode(codes[entry.id] || '000000')}
                </div>
                <button
                  className={`copy-button ${copiedId === entry.id ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(entry.id, codes[entry.id] || '000000')}
                  aria-label="Copy code to clipboard"
                >
                  {copiedId === entry.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
          
          {filteredAndSortedEntries.length === 0 && (
            <div className="no-passwords">
              <p>
                {searchQuery
                  ? 'No matching accounts found.'
                  : 'No passwords yet. Import some from the Import page.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Passwords;
