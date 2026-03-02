#!/usr/bin/env node

/**
 * Package script for VSCode extension
 *
 * vsce doesn't allow scoped package names and the `files` property
 * interferes with extension packaging. This script temporarily removes
 * those properties during vsce package, then restores them for npm publish.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');

// Read current package.json
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Store original values
const originalName = pkg.name;
const originalFiles = pkg.files;
const originalBin = pkg.bin;

// Temporarily modify for vsce
pkg.name = 'festinalente-vscode';
delete pkg.files;
delete pkg.bin;

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

try {
  // Run vsce package with fixed output name (no version suffix)
  execSync('vsce package --no-dependencies --allow-missing-repository --skip-license --out festinalente-vscode.vsix', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
} finally {
  // Always restore original values
  pkg.name = originalName;
  pkg.files = originalFiles;
  pkg.bin = originalBin;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}
