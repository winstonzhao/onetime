import { useState, useEffect } from 'react';
import { storageService, OTPEntry } from '../../services/storage';
import { generateTOTP, getRemainingSeconds } from '../../services/totp';

const Passwords = () => {
  const [otpEntries, setOtpEntries] = useState<OTPEntry[]>([]);
  const [codes, setCodes] = useState<{ [key: string]: string }>({});
  const [remainingTime, setRemainingTime] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      // Remove spaces from the code before copying
      await navigator.clipboard.writeText(code.replace(/\s/g, ''));
      setCopiedId(id);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="container">
      <div className="card passwords-card">
        <div className="passwords-header">
          <h1>One-Time Passwords</h1>
          <div className="timer-container">
            <div className="timer-bar" style={{ width: `${(remainingTime / 30) * 100}%` }} />
          </div>
        </div>
        
        <div className="passwords-list">
          {otpEntries.map(entry => (
            <div key={entry.id} className="password-item">
              <div className="password-info">
                <h3>{entry.name}</h3>
                {entry.issuer && <span className="issuer">{entry.issuer}</span>}
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
          
          {otpEntries.length === 0 && (
            <div className="no-passwords">
              <p>No passwords yet. Import some from the Import page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Passwords;
