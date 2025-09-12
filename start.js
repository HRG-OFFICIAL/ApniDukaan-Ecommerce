#!/usr/bin/env node

// Simple wrapper to run the main development script
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ApniDukaan Development Environment...\n');

const startScript = spawn('node', ['scripts/start-dev.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

startScript.on('close', (code) => {
  console.log(`\n📦 Development environment exited with code ${code}`);
  process.exit(code);
});

startScript.on('error', (err) => {
  console.error('❌ Error starting development environment:', err);
  process.exit(1);
});
