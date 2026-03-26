const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[v0] Starting clean install...');

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const lockfilePath = path.join(__dirname, '..', 'package-lock.json');

// Remove node_modules
if (fs.existsSync(nodeModulesPath)) {
  console.log('[v0] Removing node_modules...');
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
}

// Remove package-lock.json
if (fs.existsSync(lockfilePath)) {
  console.log('[v0] Removing package-lock.json...');
  fs.unlinkSync(lockfilePath);
}

// Clear npm cache
console.log('[v0] Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (e) {
  console.log('[v0] Cache clear completed (or already empty)');
}

// Install with legacy-peer-deps
console.log('[v0] Installing dependencies with --legacy-peer-deps...');
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('[v0] Installation completed successfully!');
} catch (e) {
  console.error('[v0] Installation failed:', e.message);
  process.exit(1);
}
