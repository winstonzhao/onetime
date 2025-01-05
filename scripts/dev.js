const { spawn } = require('child_process');
const electron = require('electron');
const path = require('path');

// Start Vite dev server
const vite = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit',
  env: process.env
});

// Wait for Vite to be ready
setTimeout(() => {
  // Start Electron
  const electronProcess = spawn(electron, ['.'], {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://localhost:5173'
    }
  });

  electronProcess.on('close', () => {
    vite.kill();
    process.exit();
  });
}, 3000); // Wait 3 seconds for Vite to start

// Handle process termination
process.on('SIGTERM', () => {
  vite.kill();
  process.exit();
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});
