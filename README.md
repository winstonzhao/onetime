# OneTime - Desktop OTP Manager

A secure and user-friendly desktop application for managing One-Time Password (OTP) tokens, built with Electron and React. OneTime provides a modern, efficient way to handle your two-factor authentication codes with enhanced privacy and security.

![OneTime Screenshot](docs/screenshot.png)

## Features

### Core Features
- 🔐 Secure local storage of OTP secrets
- 📱 QR code scanning for easy token import
- ⏰ Real-time OTP code generation with countdown timer
- 🔄 Automatic code refresh every 30 seconds
- 📋 Quick copy to clipboard functionality
- 🔍 Fast search and organization of tokens
- ⭐ Favorite tokens for quick access
- 🖥️ System tray integration with global hotkey support

### Security & Privacy
- All data stored locally on your device
- No cloud sync or external dependencies
- Optional auto-lock feature
- Secure storage implementation

### Import & Export
- Import from Google Authenticator
- Backup and restore functionality
- Duplicate entry detection

## Installation

### Download
Download the latest release from the [releases page](https://github.com/winstonzhao/onetime/releases).

### System Requirements
- Windows 7 or later
- 4GB RAM minimum
- 100MB free disk space

## Development

### Prerequisites
- Node.js 18 or later
- npm or yarn
- Git

### Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/onetime.git
cd onetime
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run electron:dev
```

### Building
To create a production build:
```bash
npm run electron:build
```

The built application will be available in the `release` directory.

### Project Structure
```
onetime/
├── electron/          # Electron main process code
├── src/
│   ├── components/    # React components
│   ├── services/      # Core services (OTP, storage, etc.)
│   └── styles/        # CSS styles
├── public/            # Static assets
└── docs/             # Documentation
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Guidelines
- Write clean, maintainable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [jsotp](https://github.com/jiangts/JS-OTP) for OTP generation
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) for QR code scanning
- [electron](https://www.electronjs.org/) for the desktop framework
- [React](https://reactjs.org/) for the UI framework

## Support

If you encounter any issues or have questions:
1. Check the [FAQ](docs/FAQ.md)
2. Search existing [issues](https://github.com/winstonzhao/onetime/issues)
3. Create a new issue if needed


