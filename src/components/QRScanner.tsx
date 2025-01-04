import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError: (error: string) => void;
}

const QRScanner = ({ onScanSuccess, onScanError }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let mounted = true;

    const cleanup = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
          // Remove the old HTML elements
          const oldElement = document.getElementById('qr-reader');
          if (oldElement) {
            oldElement.innerHTML = '';
          }
          scannerRef.current = null;
        } catch (error) {
          console.error('Failed to clear scanner', error);
        }
      }
    };

    const setup = async () => {
      await cleanup();
      
      if (!mounted) return;

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
          if (mounted) {
            onScanSuccess(decodedText);
          }
        },
        (errorMessage) => {
          if (!mounted) return;
          
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

    setup();

    // Cleanup function
    return () => {
      mounted = false;
      cleanup();
    };
  }, [onScanSuccess, onScanError]);

  return <div id="qr-reader" className="qr-scanner" />;
};

export default QRScanner;
