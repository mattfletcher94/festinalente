#!/usr/bin/env node

// Festina Lente Installer
//
// Installs festinalente files to two locations:
//   - .claude/skills/festina-*  (skills)
//   - .festinalente/                  (scripts, templates, workflow, config, data)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const readline = require('readline');

const PACKAGE_NAME = '@mattfletcher94/festinalente';
const SOURCE_DIR = 'dist';

// Runtime configurations
const RUNTIMES = {
  claude: {
    name: 'Claude Code',
    skillsDir: '.claude/skills'
  },
  opencode: {
    name: 'OpenCode',
    skillsDir: '.opencode/skills'
  }
};

// Tool name mapping: Claude Code -> OpenCode
const TOOL_NAME_MAP = {
  Read: 'read',
  Write: 'write',
  Edit: 'edit',
  Glob: 'glob',
  Grep: 'grep',
  Bash: 'bash',
  WebSearch: 'websearch',
  WebFetch: 'webfetch',
  AskUserQuestion: 'question',
  Skill: 'skill',
  Task: 'task',
  TaskCreate: 'task_create',
  TaskUpdate: 'task_update',
  TaskList: 'task_list',
  TaskGet: 'task_get'
};

// Path replacements for OpenCode
const PATH_REPLACEMENTS = {
  '.claude/skills/': '.opencode/skills/',
  '~/.claude/': '~/.config/opencode/'
};

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

function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`);
}

// Prompt user to select runtime(s)
async function promptRuntime() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log();
  console.log('Which runtime(s) do you use?');
  console.log();
  console.log('  1) Claude Code');
  console.log('  2) OpenCode');
  console.log('  3) Both');
  console.log();

  return new Promise((resolve) => {
    rl.question('Enter choice [1-3]: ', (answer) => {
      rl.close();
      const choice = answer.trim();
      if (choice === '1') resolve(['claude']);
      else if (choice === '2') resolve(['opencode']);
      else if (choice === '3') resolve(['claude', 'opencode']);
      else {
        console.log('Invalid choice, defaulting to Claude Code');
        resolve(['claude']);
      }
    });
  });
}

/**
 * Convert allowed-tools string to OpenCode tools object
 * Handles patterns like "Bash(*)" -> bash: "*"
 */
function convertAllowedTools(allowedToolsStr) {
  if (!allowedToolsStr) return null;

  const tools = {};
  const toolList = allowedToolsStr.split(',').map((t) => t.trim());

  for (const tool of toolList) {
    // Check for pattern syntax: ToolName(pattern)
    const patternMatch = tool.match(/^(\w+)\((.+)\)$/);
    if (patternMatch) {
      const toolName = patternMatch[1];
      const pattern = patternMatch[2];
      const mappedName = TOOL_NAME_MAP[toolName] || toolName.toLowerCase();
      tools[mappedName] = `"${pattern}"`;
    } else {
      const mappedName = TOOL_NAME_MAP[tool] || tool.toLowerCase();
      tools[mappedName] = true;
    }
  }

  return tools;
}

/**
 * Serialize tools object to YAML format
 */
function serializeToolsYaml(tools, indent = 2) {
  const spaces = ' '.repeat(indent);
  return Object.entries(tools)
    .map(([key, value]) => `${spaces}${key}: ${value}`)
    .join('\n');
}

/**
 * Replace paths in content for OpenCode
 */
function replacePathsForOpencode(content) {
  let result = content;
  for (const [from, to] of Object.entries(PATH_REPLACEMENTS)) {
    result = result.split(from).join(to);
  }
  return result;
}

/**
 * Parse YAML frontmatter from a SKILL.md file
 */
function parseFrontmatter(content) {
  // Normalize line endings (Windows CRLF -> LF)
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: normalized };

  const yamlStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * Transform a SKILL.md file for OpenCode
 */
function transformSkillForOpencode(content) {
  const { frontmatter, body } = parseFrontmatter(content);

  if (!frontmatter) return replacePathsForOpencode(content);

  // Build new frontmatter
  const newFrontmatter = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === 'allowed-tools') {
      const tools = convertAllowedTools(value);
      if (tools) {
        newFrontmatter.push('tools:');
        newFrontmatter.push(serializeToolsYaml(tools));
      }
    } else {
      newFrontmatter.push(`${key}: ${value}`);
    }
  }

  // Replace paths in body
  const transformedBody = replacePathsForOpencode(body);

  return `---\n${newFrontmatter.join('\n')}\n---\n${transformedBody}`;
}

/**
 * Copy a skill file, transforming for OpenCode if needed
 */
function copySkillFile(srcFile, destFile, runtime) {
  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  let content = fs.readFileSync(srcFile, 'utf-8');

  // Transform for OpenCode
  if (runtime === 'opencode') {
    content = transformSkillForOpencode(content);
  }

  const srcHash = crypto.createHash('sha256').update(content).digest('hex');
  const destHash = getFileHash(destFile);

  fs.writeFileSync(destFile, content, 'utf-8');

  const normalized = destFile.replace(/\\/g, '/');
  if (destHash && destHash !== srcHash) {
    logSuccess(`Updated: ${normalized}`);
  } else if (!destHash) {
    logSuccess(`Added: ${normalized}`);
  }

  return srcHash;
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
${colors.bright}${PACKAGE_NAME}${colors.reset} - Spec-driven development for Claude Code

${colors.bright}Usage:${colors.reset}
  npx ${PACKAGE_NAME}           Install to current directory

${colors.bright}Options:${colors.reset}
  -h, --help      Show this help message
  -v, --version   Show version number

${colors.bright}After installation:${colors.reset}
  Run /festina-create-project (new projects) or /festina-map-product (existing code) in Claude Code
  Optionally run /festina-map-engineering to document codebase architecture
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
  log(`${colors.bright}${colors.cyan}Festina Lente Installer${colors.reset}`);

  // Determine source directory (where this package is installed)
  const packageDir = path.resolve(__dirname, '..');
  const sourceDir = path.join(packageDir, SOURCE_DIR);

  if (!fs.existsSync(sourceDir)) {
    logError(`Source files not found at: ${sourceDir}`);
    process.exit(1);
  }

  // Prompt for runtime selection
  const selectedRuntimes = await promptRuntime();

  console.log();
  console.log(`Installing for: ${selectedRuntimes.map((r) => RUNTIMES[r].name).join(' + ')}`);
  console.log();

  const cwd = process.cwd();
  const festinalenteDir = path.join(cwd, '.festinalente');

  logStep('1/4', 'Installing festinalente skills...');

  // Install skills for each selected runtime
  const skillsSource = path.join(sourceDir, 'skills');

  for (const runtime of selectedRuntimes) {
    const config = RUNTIMES[runtime];
    const skillsDest = path.join(cwd, config.skillsDir);

    logStep('Skills', `Installing to ${config.skillsDir}/...`);

    if (fs.existsSync(skillsSource)) {
      const skillFiles = getAllFiles(skillsSource);
      for (const relativePath of skillFiles) {
        const srcFile = path.join(skillsSource, relativePath);
        const destFile = path.join(skillsDest, relativePath);
        copySkillFile(srcFile, destFile, runtime);
      }
    }
  }

  logStep('2/4', 'Installing scripts, templates, and workflow to .festinalente/...');

  // Ensure .festinalente directory structure exists
  const festinalenteSubDirs = [
    'tasks',
    'quick',
    'product',
    'engineering',
    'directives',
    'scripts',
    'templates',
    'projects'
  ];
  for (const dir of festinalenteSubDirs) {
    const dirPath = path.join(festinalenteDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  let festinalenteCopied = 0;

  // Copy CLI dispatcher to .festinalente/scripts/festinalente.cjs
  const cliSource = path.join(sourceDir, 'cli', 'dispatcher.cjs');
  const scriptsDest = path.join(festinalenteDir, 'scripts');
  if (fs.existsSync(cliSource)) {
    const destFile = path.join(scriptsDest, 'festinalente.cjs');
    copyFile(cliSource, destFile);
    festinalenteCopied++;
  }

  // Copy templates to .festinalente/templates/
  const templatesSource = path.join(sourceDir, 'templates');
  const templatesDest = path.join(festinalenteDir, 'templates');
  if (fs.existsSync(templatesSource)) {
    const templateFiles = getAllFiles(templatesSource);
    for (const relativePath of templateFiles) {
      const srcFile = path.join(templatesSource, relativePath);
      const destFile = path.join(templatesDest, relativePath);
      copyFile(srcFile, destFile);
      festinalenteCopied++;
    }
  }

  // Copy workflow.yaml to .festinalente/workflow.yaml
  const workflowSource = path.join(sourceDir, 'workflow.yaml');
  const workflowDest = path.join(festinalenteDir, 'workflow.yaml');
  if (fs.existsSync(workflowSource)) {
    copyFile(workflowSource, workflowDest);
    festinalenteCopied++;
  }

  // Copy default directives (don't overwrite user customizations)
  const directivesSource = path.join(sourceDir, 'directives');
  const directivesDest = path.join(festinalenteDir, 'directives');
  if (fs.existsSync(directivesSource)) {
    const directiveFiles = getAllFiles(directivesSource);
    for (const relativePath of directiveFiles) {
      const srcFile = path.join(directivesSource, relativePath);
      const destFile = path.join(directivesDest, relativePath);
      if (!fs.existsSync(destFile)) {
        copyFile(srcFile, destFile);
        logSuccess(`Created directive: .festinalente/directives/${relativePath}`);
      } else {
        logSuccess(`.festinalente/directives/${relativePath} already exists, skipping`);
      }
    }
  }

  logStep('3/4', 'Setting up config...');

  // Copy config.yaml if it doesn't exist (don't overwrite user config)
  const configSource = path.join(templatesDest, 'config.yaml');
  const configDest = path.join(festinalenteDir, 'config.yaml');
  if (!fs.existsSync(configDest) && fs.existsSync(configSource)) {
    fs.copyFileSync(configSource, configDest);
    logSuccess('Created .festinalente/config.yaml');
  } else if (fs.existsSync(configDest)) {
    logSuccess('.festinalente/config.yaml already exists, skipping');
  }

  // Copy glossary.yaml if it doesn't exist (don't overwrite user glossary)
  const glossarySource = path.join(templatesDest, 'glossary.yaml');
  const glossaryDest = path.join(festinalenteDir, 'glossary.yaml');
  if (!fs.existsSync(glossaryDest) && fs.existsSync(glossarySource)) {
    fs.copyFileSync(glossarySource, glossaryDest);
    logSuccess('Created .festinalente/glossary.yaml');
  } else if (fs.existsSync(glossaryDest)) {
    logSuccess('.festinalente/glossary.yaml already exists, skipping');
  }

  logStep('4/4', 'Saving manifest...');

  // Save manifest to .festinalente for tracking
  const manifest = {
    _version: require('../package.json').version,
    _installedAt: new Date().toISOString(),
    runtimes: selectedRuntimes,
    skillsDirs: selectedRuntimes.map((r) => RUNTIMES[r].skillsDir),
    festinalenteDir: '.festinalente/'
  };
  const manifestPath = path.join(festinalenteDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // Summary
  console.log();
  logSuccess('Installation complete!');
  console.log();
  for (const runtime of selectedRuntimes) {
    console.log(`  Skills copied to ${RUNTIMES[runtime].skillsDir}/`);
  }
  console.log(`  Files copied to .festinalente/: ${festinalenteCopied}`);
  console.log();
  console.log(`${colors.bright}Next steps:${colors.reset}`);
  const runtimeName = selectedRuntimes.includes('opencode') ? 'OpenCode' : 'Claude Code';
  console.log(`  1. Open ${runtimeName} in your project`);
  console.log(
    `  2. Run ${colors.cyan}/festina-create-project${colors.reset} (new projects) or ${colors.cyan}/festina-map-product${colors.reset} (existing code)`
  );
  console.log(`  3. Optionally run ${colors.cyan}/festina-map-engineering${colors.reset} to document architecture`);
  console.log();
}

main().catch((err) => {
  logError(`Installation failed: ${err.message}`);
  process.exit(1);
});
