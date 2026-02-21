#!/usr/bin/env node

/**
 * Claude Kanban VSCode Extension Installer
 *
 * Installs the VSCode extension by running code --install-extension
 * with the bundled .vsix file.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PACKAGE_NAME = '@mattfletcher94/claudeban-vscode';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Log a message with optional color.
 *
 * @param message - The message to log.
 * @param color - Optional ANSI color code.
 */
function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a step indicator.
 *
 * @param step - The step number/label.
 * @param message - The step description.
 */
function logStep(step, message) {
  log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

/**
 * Log a success message.
 *
 * @param message - The success message.
 */
function logSuccess(message) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Log a warning message.
 *
 * @param message - The warning message.
 */
function logWarning(message) {
  log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * Log an error message.
 *
 * @param message - The error message.
 */
function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`);
}

/**
 * Get the path to the .vsix file in the package directory.
 *
 * @returns The path to the .vsix file.
 * @throws Error if the .vsix file doesn't exist.
 */
function findVsixFile() {
  const vsixPath = path.resolve(__dirname, '..', 'claudeban-vscode.vsix');

  if (!fs.existsSync(vsixPath)) {
    throw new Error(`VSCode extension not found at ${vsixPath}`);
  }

  return vsixPath;
}

/**
 * Parse command line arguments.
 *
 * @returns Parsed options object.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { help: false, version: false };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
  }

  return options;
}

/**
 * Show help information.
 */
function showHelp() {
  console.log(`
${colors.bright}${PACKAGE_NAME}${colors.reset} - VSCode extension installer for Claude Kanban

${colors.bright}Usage:${colors.reset}
  npx ${PACKAGE_NAME}           Install the VSCode extension

${colors.bright}Options:${colors.reset}
  -h, --help      Show this help message
  -v, --version   Show version number

${colors.bright}Requirements:${colors.reset}
  - VSCode 'code' command must be in your PATH
  - GitHub Packages registry configured in ~/.npmrc

${colors.bright}After installation:${colors.reset}
  The Claude Kanban extension will appear in your VSCode activity bar.
`);
}

/**
 * Show version information.
 */
function showVersion() {
  const pkg = require('../package.json');
  console.log(`${PACKAGE_NAME} v${pkg.version}`);
}

/**
 * Main installer function.
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  console.log();
  log(`${colors.bright}${colors.cyan}Claude Kanban VSCode Extension Installer${colors.reset}`);
  console.log();

  logStep('1/2', 'Finding .vsix file...');
  const vsixPath = findVsixFile();
  logSuccess(`Found: ${path.basename(vsixPath)}`);

  logStep('2/2', 'Installing extension...');
  execSync(`code --install-extension "${vsixPath}"`, { stdio: 'inherit' });

  console.log();
  logSuccess('Installation complete!');
  console.log();
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  console.log(`  1. Open VSCode (or reload the window)`);
  console.log(`  2. Look for the Kanban icon in the activity bar`);
  console.log(`  3. Open a folder containing a .kanban directory`);
  console.log();
}

main().catch(err => {
  logError(`Installation failed: ${err.message}`);
  process.exit(1);
});
