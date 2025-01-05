import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { storageService, OTPEntry } from '../../services/storage';
import { generateTOTP, getRemainingSeconds } from '../../services/totp';

const Passwords = () => {
  const [otpEntries, setOtpEntries] = useState<OTPEntry[]>([]);
  const [totpCodes, setTotpCodes] = useState<{ [key: string]: string }>({});
  const [timeProgress, setTimeProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', issuer: '' });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredAndSortedEntries = useMemo(() => {
    return otpEntries
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
  }, [otpEntries, searchQuery]);

  // Load OTP entries
  useEffect(() => {
    const entries = storageService.getOTPEntries();
    setOtpEntries(entries);
  }, []);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Add effect to handle focus events
  useEffect(() => {
    const handleFocusSearch = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.electronAPI.onFocusSearch(handleFocusSearch);
    
    // Cleanup listener on unmount
    return () => {
      window.electronAPI.offFocusSearch?.(handleFocusSearch);
    };
  }, []);

  // Generate TOTP codes and update remaining time
  const updateCodes = useCallback(async () => {
    const newCodes: { [key: string]: string } = {};
    for (const entry of otpEntries) {
      try {
        newCodes[entry.secret] = await generateTOTP(
          entry.secret,
          entry.period || 30,
          entry.digits || 6
        );
      } catch (error) {
        console.error('Error generating TOTP for entry:', entry.name, error);
        newCodes[entry.secret] = '000000';
      }
    }
    setTotpCodes(newCodes);
  }, [otpEntries]);

  useEffect(() => {
    // Initial code generation
    updateCodes();
  }, [updateCodes]);

  useEffect(() => {
    const updateProgress = () => {
      const now = Math.floor(Date.now() / 1000);
      const progress = now % 30;
      setTimeProgress((30 - progress) / 30 * 100);
      
      // Update codes if we're at the start of a new period
      if (progress === 0) {
        updateCodes();
      }
    };

    updateProgress();
    const timer = setInterval(updateProgress, 1000);

    return () => clearInterval(timer);
  }, [updateCodes]);

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

  const toggleFavorite = useCallback(async (entry: OTPEntry) => {
    // Update local state immediately
    const updatedEntry = { ...entry, isFavorite: !entry.isFavorite };
    setOtpEntries(prev => prev.map(e => 
      e.id === entry.id ? updatedEntry : e
    ));

    // Save to storage asynchronously
    try {
      await storageService.updateOTPEntry(entry.id, updatedEntry);
    } catch (err) {
      console.error('Failed to update favorite status:', err);
      // Revert local state on error
      setOtpEntries(prev => prev.map(e => 
        e.id === entry.id ? entry : e
      ));
    }
  }, []);

  const startEditing = useCallback((entry: OTPEntry) => {
    setEditingId(entry.id);
    setEditForm({ name: entry.name, issuer: entry.issuer || '' });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    
    const entry = otpEntries.find(e => e.id === editingId);
    if (!entry) return;

    const updatedEntry = {
      ...entry,
      name: editForm.name,
      issuer: editForm.issuer
    };

    // Update local state immediately
    setOtpEntries(prev => prev.map(e => 
      e.id === editingId ? updatedEntry : e
    ));
    setEditingId(null);

    // Save to storage asynchronously
    try {
      await storageService.updateOTPEntry(editingId, updatedEntry);
    } catch (err) {
      console.error('Failed to save changes:', err);
      // Revert local state on error
      setOtpEntries(prev => prev.map(e => 
        e.id === editingId ? entry : e
      ));
    }
  }, [editingId, editForm, otpEntries]);

  const startDelete = useCallback((entry: OTPEntry) => {
    setDeleteId(entry.id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteId) {
      const newEntries = otpEntries.filter(entry => entry.id !== deleteId);
      setOtpEntries(newEntries);
      await storageService.updateOTPEntries(newEntries);
      setDeleteId(null);
    }
  }, [deleteId, otpEntries]);

  const cancelDelete = useCallback(() => {
    setDeleteId(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredAndSortedEntries.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && filteredAndSortedEntries.length > 0) {
      e.preventDefault();
      const selectedEntry = filteredAndSortedEntries[selectedIndex];
      if (selectedEntry) {
        // Copy password and minimize
        const code = totpCodes[selectedEntry.secret] || '';
        console.log('Copying code:', code, 'from secret:', selectedEntry.secret); // Debug log
        window.electronAPI.copyToClipboard(code);
        window.electronAPI.minimizeWindow();
      }
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  return (
    <div className="container">
      <div className="card passwords-card">
        <div className="passwords-header">
          <h1>One-Time Passwords</h1>
          <div className="search-container">
            <input
              ref={searchInputRef}
              id="search-input"
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
            />
          </div>
          <div className="timer-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${timeProgress}%` }}
              />
            </div>
            <div className="seconds-counter">
              {Math.ceil(timeProgress / 100 * 30)}s
            </div>
          </div>
        </div>
        
        <div className="passwords-list">
          {filteredAndSortedEntries.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`password-item ${entry.isFavorite ? 'favorite' : ''} ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => {
                const code = totpCodes[entry.secret] || '';
                console.log('Copying code:', code, 'from secret:', entry.secret); // Debug log
                window.electronAPI.copyToClipboard(code);
                window.electronAPI.minimizeWindow();
              }}
            >
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
                <div className="password-item-content">
                  <div className="name-row">
                    <div className="name-row-icons">
                      <button
                        className={`favorite-button ${entry.isFavorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(entry)}
                        aria-label={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={entry.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
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
                      <button
                        className="delete-button"
                        onClick={() => startDelete(entry)}
                        aria-label="Delete entry"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                    <h3>{entry.name}</h3>
                    {entry.issuer && <span className="issuer">{entry.issuer}</span>}
                  </div>
                  <div className="password-code-container">
                    <div className="password-code">
                      {formatCode(totpCodes[entry.secret] || '000000')}
                    </div>
                    <button
                      className={`copy-button ${copiedId === entry.id ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(entry.id, totpCodes[entry.secret] || '000000')}
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
              )}
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
      {deleteId && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Delete Entry</h3>
            <p>Are you sure you want to delete this entry? This action cannot be undone.</p>
            <div className="confirm-dialog-actions">
              <button onClick={cancelDelete} className="confirm-cancel-button">
                Cancel
              </button>
              <button onClick={confirmDelete} className="confirm-delete-button">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Passwords;
