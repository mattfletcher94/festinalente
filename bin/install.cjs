#!/usr/bin/env node

// Claude Kanban Installer
//
// SAFETY: This installer ONLY manages kanban-related files:
//   - skills/kanban-*/
//   - kanban-templates/
//   - kanban-workflow.yaml
//   - kanban-manifest.json
//   - kanban-scripts/
//
// It will NEVER touch user files outside these paths.
// The manifest tracks exactly which files were installed.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const PACKAGE_NAME = 'claude-kanban';
const SOURCE_DIR = 'dist';
const TARGET_DIR = '.claude';
const MANIFEST_FILE = 'kanban-manifest.json';
const BACKUP_DIR = 'kanban-local-patches';

// Files/directories that belong to kanban (safety check)
const KANBAN_PATHS = [
  'skills/kanban-',
  'kanban-templates',
  'kanban-workflow.yaml',
  'kanban-manifest.json',
  'kanban-local-patches',
  'kanban-scripts/'
];

// .kanban directory structure to create
const KANBAN_DIRS = [
  'tasks',
  'product',
  'engineering',
  'skills'
];

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`${colors.cyan}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓${colors.reset} ${message}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`);
}

// Check if a path belongs to kanban (safety check)
function isKanbanPath(relativePath) {
  // Normalize path separators for cross-platform compatibility
  const normalized = relativePath.replace(/\\/g, '/');
  return KANBAN_PATHS.some(prefix => normalized.startsWith(prefix));
}

// Get file hash for change detection
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

// Recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = [], basePath = dirPath) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const relativePath = path.relative(basePath, fullPath);

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles, basePath);
    } else {
      arrayOfFiles.push(relativePath);
    }
  }

  return arrayOfFiles;
}

// Remove orphaned files (files from previous install that aren't in new version)
function cleanupOrphanedFiles(targetDir, existingManifest, newFiles) {
  const removed = [];

  // Normalize new files for comparison
  const normalizedNewFiles = newFiles.map(f => f.replace(/\\/g, '/'));

  for (const relativePath of Object.keys(existingManifest)) {
    // Skip metadata keys
    if (relativePath.startsWith('_')) continue;

    // Normalize for comparison
    const normalized = relativePath.replace(/\\/g, '/');

    // Skip if file is in the new version
    if (normalizedNewFiles.includes(normalized)) continue;

    // Safety check: only remove kanban files
    if (!isKanbanPath(relativePath)) {
      logWarning(`Skipping non-kanban orphan (safety): ${relativePath}`);
      continue;
    }

    const filePath = path.join(targetDir, relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      removed.push(relativePath);

      // Try to remove empty parent directories
      let dir = path.dirname(filePath);
      while (dir !== targetDir) {
        try {
          const contents = fs.readdirSync(dir);
          if (contents.length === 0) {
            fs.rmdirSync(dir);
            dir = path.dirname(dir);
          } else {
            break;
          }
        } catch {
          break;
        }
      }
    }
  }

  return removed;
}

// Copy directory recursively
function copyDir(src, dest, manifest = {}, existingManifest = {}, backupDir = null) {
  const stats = { copied: 0, skipped: 0, backed: 0 };

  if (!fs.existsSync(src)) {
    logError(`Source directory not found: ${src}`);
    return stats;
  }

  const files = getAllFiles(src);

  for (const relativePath of files) {
    // Safety check: only copy kanban files
    if (!isKanbanPath(relativePath)) {
      logWarning(`Skipping non-kanban file (safety): ${relativePath}`);
      continue;
    }

    const srcFile = path.join(src, relativePath);
    const destFile = path.join(dest, relativePath);
    const destDir = path.dirname(destFile);

    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const srcHash = getFileHash(srcFile);
    const destHash = getFileHash(destFile);
    const previousHash = existingManifest[relativePath];

    // Check if destination file exists and has been modified by user
    if (destHash && previousHash && destHash !== previousHash && destHash !== srcHash) {
      // User has modified this file - back it up
      if (backupDir) {
        const backupFile = path.join(backupDir, relativePath);
        const backupFileDir = path.dirname(backupFile);

        if (!fs.existsSync(backupFileDir)) {
          fs.mkdirSync(backupFileDir, { recursive: true });
        }

        fs.copyFileSync(destFile, backupFile);
        logWarning(`Backed up modified file: ${relativePath}`);
        stats.backed++;
      }
    }

    // Copy the file
    fs.copyFileSync(srcFile, destFile);
    manifest[relativePath] = srcHash;
    stats.copied++;

    // Show what was copied
    const normalized = relativePath.replace(/\\/g, '/');
    if (destHash && destHash !== srcHash) {
      logSuccess(`Updated: ${normalized}`);
    } else if (!destHash) {
      logSuccess(`Added: ${normalized}`);
    }
  }

  return stats;
}

// Interactive prompt
async function prompt(question, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    const defaultStr = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${question}${defaultStr}: `, answer => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    help: false,
    version: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--version' || arg === '-v') {
      options.version = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.bright}${PACKAGE_NAME}${colors.reset} - Kanban task management for Claude Code

${colors.bright}Usage:${colors.reset}
  npx ${PACKAGE_NAME}           Install to current directory

${colors.bright}Options:${colors.reset}
  -h, --help      Show this help message
  -v, --version   Show version number

${colors.bright}After installation:${colors.reset}
  Run /kanban-define-product or /kanban-map-product in Claude Code
  Optionally run /kanban-map-engineering to document codebase architecture
`);
}

function showVersion() {
  const pkg = require('../package.json');
  console.log(`${PACKAGE_NAME} v${pkg.version}`);
}

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
  log(`${colors.bright}${colors.cyan}Claude Kanban Installer${colors.reset}`);
  console.log();

  // Determine source directory (where this package is installed)
  const packageDir = path.resolve(__dirname, '..');
  const sourceDir = path.join(packageDir, SOURCE_DIR);

  if (!fs.existsSync(sourceDir)) {
    logError(`Source files not found at: ${sourceDir}`);
    process.exit(1);
  }

  // Always install locally to current directory
  const targetBase = path.join(process.cwd(), TARGET_DIR);

  logStep('1/6', `Installing to: ${targetBase}`);

  // Load existing manifest if present
  const manifestPath = path.join(targetBase, MANIFEST_FILE);
  let existingManifest = {};

  if (fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      logStep('2/6', 'Found existing installation, checking for modifications...');
    } catch {
      logWarning('Could not read existing manifest, will overwrite all files');
    }
  } else {
    logStep('2/6', 'Fresh installation');
  }

  // Create backup directory if needed
  const backupDir = path.join(targetBase, BACKUP_DIR);

  // Get list of new files for orphan detection
  const newFiles = getAllFiles(sourceDir);

  // Clean up orphaned files from previous version
  let orphansRemoved = [];
  if (Object.keys(existingManifest).length > 0) {
    logStep('3/6', 'Cleaning up orphaned files...');
    orphansRemoved = cleanupOrphanedFiles(targetBase, existingManifest, newFiles);
    if (orphansRemoved.length > 0) {
      logSuccess(`Removed ${orphansRemoved.length} orphaned file(s)`);
    }
  } else {
    logStep('3/6', 'No orphans to clean (fresh install)');
  }

  // Copy files
  logStep('4/6', 'Copying files...');
  const manifest = {};
  const stats = copyDir(sourceDir, targetBase, manifest, existingManifest, backupDir);

  // Save manifest
  logStep('5/6', 'Saving manifest...');
  manifest['_version'] = require('../package.json').version;
  manifest['_installedAt'] = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Create .kanban directory structure if it doesn't exist
  logStep('6/6', 'Setting up .kanban directory...');
  const kanbanDir = path.join(process.cwd(), '.kanban');
  let kanbanCreated = false;

  if (!fs.existsSync(kanbanDir)) {
    // Create .kanban and subdirectories
    for (const dir of KANBAN_DIRS) {
      const dirPath = path.join(kanbanDir, dir);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Copy config.yaml template
    const configTemplatePath = path.join(targetBase, 'kanban-templates', 'config.yaml');
    const configDestPath = path.join(kanbanDir, 'config.yaml');
    if (fs.existsSync(configTemplatePath)) {
      fs.copyFileSync(configTemplatePath, configDestPath);
    }

    kanbanCreated = true;
    logSuccess('Created .kanban/ directory structure');
  } else {
    logSuccess('.kanban/ already exists, skipping');
  }

  // Summary
  console.log();
  logSuccess(`Installation complete!`);
  console.log();
  console.log(`  Files copied: ${stats.copied}`);
  if (orphansRemoved.length > 0) {
    console.log(`  Files removed (orphaned): ${orphansRemoved.length}`);
  }
  if (stats.backed > 0) {
    console.log(`  Files backed up: ${stats.backed} (see ${BACKUP_DIR}/)`);
  }
  if (kanbanCreated) {
    console.log(`  .kanban/ created: Yes`);
  }
  console.log();
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  console.log(`  1. Open Claude Code in your project`);
  console.log(`  2. Run ${colors.cyan}/kanban-define-product${colors.reset} (new projects) or ${colors.cyan}/kanban-map-product${colors.reset} (existing code)`);
  console.log(`  3. Optionally run ${colors.cyan}/kanban-map-engineering${colors.reset} to document architecture`);
  console.log();
}

main().catch(err => {
  logError(`Installation failed: ${err.message}`);
  process.exit(1);
});
