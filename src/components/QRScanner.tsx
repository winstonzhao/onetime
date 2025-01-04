import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError: (error: string) => void;
}

const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Clean up any existing scanner instance first
    if (scannerRef.current) {
      scannerRef.current.clear()
        .then(() => {
          scannerRef.current = null;
          initializeScanner();
        })
        .catch((error) => console.error('Failed to clear scanner', error));
      return;
    }

    initializeScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
          .then(() => {
            scannerRef.current = null;
          })
          .catch((error) => console.error('Failed to clear scanner', error));
      }
    };
  }, [onScanSuccess, onScanError]);

  const initializeScanner = () => {
    // Create scanner instance
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    // Start scanning
    scannerRef.current.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Ignore "QR code not found" type errors to allow continuous scanning
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('No MultiFormat Readers')) {
          // Only trigger error callback for camera or permission issues
          if (errorMessage.includes('Camera access') || 
              errorMessage.includes('permission') || 
              errorMessage.includes('NotAllowed') ||
              errorMessage.includes('NotSupported')) {
            onScanError(errorMessage);
          }
        }
      }
    );
  };

  return <div id="qr-reader" className="qr-scanner" />;
};

export default QRScanner;
