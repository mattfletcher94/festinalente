#!/usr/bin/env node

/**
 * Build and install the VSCode extension locally for testing.
 *
 * This script:
 * 1. Builds the extension
 * 2. Packages it as a .vsix
 * 3. Installs it to VSCode
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('\n\x1b[1m\x1b[36mBuilding and installing VSCode extension locally...\x1b[0m\n');

try {
  // Run the package script (which builds first)
  console.log('\x1b[36m[1/2]\x1b[0m Packaging extension...');
  execSync('npm run package', {
    cwd: rootDir,
    stdio: 'inherit'
  });

  // Install the extension
  console.log('\n\x1b[36m[2/2]\x1b[0m Installing extension...');
  const vsixPath = path.join(rootDir, 'festinalente-vscode.vsix');
  // Use code.cmd on Windows — the bash wrapper can silently fail
  const codeCmd = process.platform === 'win32' ? 'code.cmd' : 'code';
  execSync(`${codeCmd} --install-extension "${vsixPath}"`, {
    cwd: rootDir,
    stdio: 'inherit'
  });

  console.log('\n\x1b[32m✓\x1b[0m Extension installed successfully!');
  console.log('\n  Reload VSCode to use the updated extension.\n');
} catch (err) {
  console.error('\n\x1b[31m✗\x1b[0m Installation failed:', err.message);
  process.exit(1);
}
