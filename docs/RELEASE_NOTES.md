# OneTime v1.0.0 Release Notes

## Overview
OneTime is a secure, desktop-based one-time password (OTP) manager built with Electron and React. It provides a modern, user-friendly interface for managing your two-factor authentication codes with enhanced security features and system tray integration.

## Features

### Core Functionality
- **OTP Management**
  - Generate TOTP (Time-based One-Time Password) codes
  - Support for custom periods and digits
  - Real-time code updates with visual countdown timer
  - Quick copy-to-clipboard functionality

### User Interface
- **Modern Design**
  - Clean, intuitive interface with dark theme
  - Custom title bar for seamless integration
  - Responsive layout with search functionality
  - Visual feedback for code copying

### System Integration
- **System Tray**
  - Minimize to system tray functionality
  - Quick access through tray icon
  - Context menu for basic operations
  - Global hotkey support for instant access

### Security & Privacy
- **Local Storage**
  - All data stored locally on your device
  - No cloud sync or external dependencies
  - Secure storage implementation
  - Optional auto-lock feature

### Import & Export
- **Data Management**
  - Import from Google Authenticator
  - QR code scanning support
  - Backup and restore functionality
  - Duplicate entry detection

### Organization
- **Account Management**
  - Favorite accounts for quick access
  - Search and filter capabilities
  - Edit and delete functionality
  - Custom issuer support

## Technical Details
- Built with Electron v27.1.0 and React v18.3.1
- TypeScript for enhanced type safety
- Modern build system using Vite v6.0.5
- Efficient state management with React hooks

## Installation
Download the appropriate installer for your platform:
- Windows: `OneTime-Setup-1.0.0.exe`

## System Requirements
- Windows 7 or later
- 4GB RAM minimum
- 100MB free disk space

## Known Issues
- The scanner may occasionally fail to clear properly
- Import functionality may require 'unsafe-eval' for certain migration formats

## Upcoming Features
- Light theme support
- Additional import formats
- Enhanced backup options
- Custom theming support

## Security Notes
- All OTP secrets are stored locally
- No data is transmitted to external servers
- Regular security updates will be provided

## Feedback and Support
Please report any issues or feature requests through our GitHub issue tracker. We welcome contributions from the community!
