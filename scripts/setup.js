#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = '/vercel/share/v0-project';

console.log('[v0] Starting clean install from correct directory...');

try {
  // Remove node_modules
  const nodeModulesPath = path.join(cwd, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('[v0] Removing node_modules...');
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }

  // Remove package-lock.json
  const lockPath = path.join(cwd, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    console.log('[v0] Removing package-lock.json...');
    fs.rmSync(lockPath, { force: true });
  }

  // Install with npm
  console.log('[v0] Installing dependencies with legacy-peer-deps...');
  execSync('npm install --legacy-peer-deps', { cwd, stdio: 'inherit' });
  
  console.log('[v0] Success! Dependencies installed.');
} catch (error) {
  console.error('[v0] Error:', error.message);
  process.exit(1);
}
