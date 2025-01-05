import { useState } from 'react';
import QRScanner from '../QRScanner';
import { migrationService } from '../../services/migration';
import { storageService } from '../../services/storage';
import { v4 as uuidv4 } from 'uuid';

const Import = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScanSuccess = async (result: string) => {
    try {
      const accounts = await migrationService.parseGoogleAuthMigration(result);
      const existingEntries = storageService.getOTPEntries();
      
      let imported = 0;
      let skipped = 0;

      for (const account of accounts) {
        // Check for duplicates by comparing secret and name
        const isDuplicate = existingEntries.some(
          entry => entry.secret === account.secret && 
                  entry.name === account.name
        );

        if (!isDuplicate) {
          await storageService.addOTPEntry({
            id: uuidv4(),
            secret: account.secret,
            name: account.name,
            issuer: account.issuer,
            algorithm: account.algorithm,
            digits: account.digits,
            period: 30, // Standard TOTP period
            isFavorite: false
          });
          imported++;
        } else {
          skipped++;
        }
      }

      setSuccess(`Successfully imported ${imported} accounts${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`);
      setError(null);
    } catch (err) {
      setError('Failed to parse QR code. Please make sure this is a valid Google Authenticator export QR code.');
      setSuccess(null);
      console.error('Import error:', err);
    }
  };

  const handleScanError = (error: string) => {
    setError(error);
    setSuccess(null);
  };

  return (
    <div className="import-container">
      <h1 className="import-title">Import OTP</h1>
      
      <div className="scanner-container">
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
    </div>
  );
};

export default Import;
