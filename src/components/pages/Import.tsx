import { useState } from 'react';
import QRScanner from '../QRScanner';
import { FaQrcode, FaUpload } from 'react-icons/fa';

const Import = () => {
  const [scanningMode, setScanningMode] = useState<'camera' | 'upload' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScanSuccess = (result: string) => {
    setSuccess(result);
    setError(null);
    setScanningMode(null);
    // TODO: Process the QR code data and store it
    console.log('QR Code scanned:', result);
  };

  const handleScanError = (error: string) => {
    setError(error);
    setSuccess(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement QR code reading from uploaded image
      console.log('File uploaded:', file);
    }
  };

  return (
    <div className="import-container">
      <h1 className="import-title">Import OTP</h1>
      
      {!scanningMode && (
        <div className="import-options">
          <button 
            className="button import-button"
            onClick={() => setScanningMode('camera')}
          >
            <FaQrcode />
            <span>Scan QR Code</span>
          </button>
          <button 
            className="button import-button"
            onClick={() => setScanningMode('upload')}
          >
            <FaUpload />
            <span>Upload QR Code</span>
          </button>
        </div>
      )}

      {scanningMode === 'camera' && (
        <div className="scanner-container">
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
          <button 
            className="button cancel-button"
            onClick={() => setScanningMode(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {scanningMode === 'upload' && (
        <div className="upload-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="file-input"
          />
          <button 
            className="button cancel-button"
            onClick={() => setScanningMode(null)}
          >
            Cancel
          </button>
        </div>
      )}

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
