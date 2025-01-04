import { useState } from 'react';
import QRScanner from '../QRScanner';

const Import = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScanSuccess = (result: string) => {
    setSuccess(result);
    setError(null);
    // TODO: Process the QR code data and store it
    console.log('QR Code scanned:', result);
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
          QR Code successfully scanned!
        </div>
      )}
    </div>
  );
};

export default Import;
