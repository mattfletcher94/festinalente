#!/usr/bin/env node

// Claude Kanban Installer
//
// Installs kanban files to two locations:
//   - .claude/skills/kanban-*  (skills)
//   - .kanban/                  (scripts, templates, workflow, config, data)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PACKAGE_NAME = 'claude-kanban';
const SOURCE_DIR = 'dist';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
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

// Copy a single file, creating directories as needed
function copyFile(srcFile, destFile) {
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const srcHash = getFileHash(srcFile);
  const destHash = getFileHash(destFile);

  fs.copyFileSync(srcFile, destFile);

  const normalized = destFile.replace(/\\/g, '/');
  if (destHash && destHash !== srcHash) {
    logSuccess(`Updated: ${normalized}`);
  } else if (!destHash) {
    logSuccess(`Added: ${normalized}`);
  }

  return srcHash;
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { help: false, version: false };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version' || arg === '-v') options.version = true;
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

  const cwd = process.cwd();
  const claudeDir = path.join(cwd, '.claude');
  const kanbanDir = path.join(cwd, '.kanban');

  logStep('1/4', 'Installing kanban skills to .claude/skills/...');

  // Copy skills to .claude/skills/
  const skillsSource = path.join(sourceDir, 'skills');
  const skillsDest = path.join(claudeDir, 'skills');
  let skillsCopied = 0;

  if (fs.existsSync(skillsSource)) {
    const skillFiles = getAllFiles(skillsSource);
    for (const relativePath of skillFiles) {
      const srcFile = path.join(skillsSource, relativePath);
      const destFile = path.join(skillsDest, relativePath);
      copyFile(srcFile, destFile);
      skillsCopied++;
    }
  }

  logStep('2/4', 'Installing scripts, templates, and workflow to .kanban/...');

  // Ensure .kanban directory structure exists
  const kanbanSubDirs = ['tasks', 'product', 'engineering', 'skills', 'scripts', 'templates'];
  for (const dir of kanbanSubDirs) {
    const dirPath = path.join(kanbanDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  let kanbanCopied = 0;

  // Copy scripts to .kanban/scripts/
  const scriptsSource = path.join(sourceDir, 'scripts');
  const scriptsDest = path.join(kanbanDir, 'scripts');
  if (fs.existsSync(scriptsSource)) {
    const scriptFiles = getAllFiles(scriptsSource);
    for (const relativePath of scriptFiles) {
      const srcFile = path.join(scriptsSource, relativePath);
      const destFile = path.join(scriptsDest, relativePath);
      copyFile(srcFile, destFile);
      kanbanCopied++;
    }
  }

  // Copy templates to .kanban/templates/
  const templatesSource = path.join(sourceDir, 'templates');
  const templatesDest = path.join(kanbanDir, 'templates');
  if (fs.existsSync(templatesSource)) {
    const templateFiles = getAllFiles(templatesSource);
    for (const relativePath of templateFiles) {
      const srcFile = path.join(templatesSource, relativePath);
      const destFile = path.join(templatesDest, relativePath);
      copyFile(srcFile, destFile);
      kanbanCopied++;
    }
  }

  // Copy workflow.yaml to .kanban/workflow.yaml
  const workflowSource = path.join(sourceDir, 'workflow.yaml');
  const workflowDest = path.join(kanbanDir, 'workflow.yaml');
  if (fs.existsSync(workflowSource)) {
    copyFile(workflowSource, workflowDest);
    kanbanCopied++;
  }

  logStep('3/4', 'Setting up config...');

  // Copy config.yaml if it doesn't exist (don't overwrite user config)
  const configSource = path.join(templatesDest, 'config.yaml');
  const configDest = path.join(kanbanDir, 'config.yaml');
  if (!fs.existsSync(configDest) && fs.existsSync(configSource)) {
    fs.copyFileSync(configSource, configDest);
    logSuccess('Created .kanban/config.yaml');
  } else if (fs.existsSync(configDest)) {
    logSuccess('.kanban/config.yaml already exists, skipping');
  }

  logStep('4/4', 'Saving manifest...');

  // Save manifest to .claude for tracking
  const manifest = {
    _version: require('../package.json').version,
    _installedAt: new Date().toISOString(),
    skillsDir: '.claude/skills/',
    kanbanDir: '.kanban/'
  };
  const manifestPath = path.join(claudeDir, 'kanban-manifest.json');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Summary
  console.log();
  logSuccess('Installation complete!');
  console.log();
  console.log(`  Skills copied to .claude/skills/: ${skillsCopied}`);
  console.log(`  Files copied to .kanban/: ${kanbanCopied}`);
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
