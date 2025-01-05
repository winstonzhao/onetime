import { useState } from 'react';
import QRScanner from '../QRScanner';
import { migrationService } from '../../services/migration';

const Import = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScanSuccess = async (result: string) => {
    try {
      const accounts = await migrationService.parseGoogleAuthMigration(result);
      setSuccess(`Successfully imported ${accounts.length} OTP accounts`);
      setError(null);
      // TODO: Store the accounts in your app's state/storage
      console.log('Imported accounts:', accounts);
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
