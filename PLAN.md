# Plan: Add OpenCode Runtime Support

## Overview

This plan documents the changes required to support OpenCode as an alternative runtime to Claude Code. The goal is to eliminate vendor lock-in by allowing users to choose their preferred AI CLI tool.

**Motivation:** Vendor lock-in concerns - users at a company should be able to choose their model/runtime.

**Key Finding:** OpenCode supports "Anthropic-compatible" skills following the Agent Skills Specification, but with different syntax for tool restrictions and paths.

---

## Current System

### Architecture

Claude Kanban is a monorepo with two apps:

| App | Purpose | Location |
|-----|---------|----------|
| `kanban` | CLI tool / npm package | `apps/kanban/` |
| `vscode` | VSCode extension | `apps/vscode/` |

### Key Directories

```
.claude/
  skills/
    kanban-*/SKILL.md     # 17 skill definitions

.kanban/
  config.yaml             # Project configuration
  workflow.yaml           # Column/status definitions
  tasks/                  # Task data
  scripts/                # Helper scripts
  templates/              # Document templates
```

### Build Process

Skills are authored as Handlebars templates and compiled during build:

```
Source:  apps/kanban/src/content/skills/kanban-*/SKILL.md  (Handlebars templates)
         ↓ pnpm build (compiles Handlebars)
Built:   apps/kanban/dist/skills/kanban-*/SKILL.md        (plain markdown)
         ↓ npx install (copies to user project)
Installed: .claude/skills/kanban-*/SKILL.md               (user's project)
```

**Important:** Transformation for OpenCode happens at **install time**, not build time. Source files stay in Claude format.

### Current Installer

Location: `apps/kanban/bin/install.cjs`

Currently:
- Reads skills from `dist/skills/` (built output)
- Hardcoded to install skills to `.claude/skills/`
- No runtime selection
- No skill transformation

### VSCode Extension

Location: `apps/vscode/src/extension.ts`

Currently invokes Claude via:
```typescript
function getClaudeCommand(command: string): string {
  return `claude "${command}"`;
}
```

---

## Target State

### Runtime Selection

Users can choose during install:
1. Claude Code
2. OpenCode
3. Both

### Directory Structure by Runtime

| Runtime | Skills Directory |
|---------|------------------|
| Claude Code | `.claude/skills/kanban-*/` |
| OpenCode | `.opencode/skills/kanban-*/` |

### Configuration

**Installer:** Asks which runtime(s) to install skills for. Installs to appropriate directories.

**VSCode Extension:** Runtime preference is a VSCode setting (per-user), not a project setting:

```json
// User or Workspace settings.json
{
  "kanban.runtime": "opencode"  // or "claude" (default)
}
```

This allows different team members to use different runtimes on the same project.

---

## Implementation Tasks

### Task 1: Update Installer with Runtime Selection

**File:** `apps/kanban/bin/install.cjs`

Add interactive runtime prompt:

```
Claude Kanban Installer

Which runtime(s) do you use?
  1) Claude Code
  2) OpenCode
  3) Both

Enter choice [1-3]: _
```

**Implementation:**

```javascript
const readline = require('readline');

const RUNTIMES = {
  claude: {
    name: 'Claude Code',
    skillsDir: '.claude/skills',
  },
  opencode: {
    name: 'OpenCode',
    skillsDir: '.opencode/skills',
  },
};

async function promptRuntime() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
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
```

---

### Task 2: Add Skill Transformer

**File:** `apps/kanban/bin/install.cjs`

Skills need transformation when installing for OpenCode.

#### 2.1 Tool Name Mapping

| Claude Code | OpenCode |
|-------------|----------|
| `Read` | `read` |
| `Write` | `write` |
| `Edit` | `edit` |
| `Glob` | `glob` |
| `Grep` | `grep` |
| `Bash` | `bash` |
| `WebSearch` | `websearch` |
| `WebFetch` | `webfetch` |
| `AskUserQuestion` | `question` |
| `Skill` | `skill` |
| `Task` | `task` |
| `TaskCreate` | `task_create` |
| `TaskUpdate` | `task_update` |
| `TaskList` | `task_list` |
| `TaskGet` | `task_get` |

**Implementation:**

```javascript
const TOOL_NAME_MAP = {
  'Read': 'read',
  'Write': 'write',
  'Edit': 'edit',
  'Glob': 'glob',
  'Grep': 'grep',
  'Bash': 'bash',
  'WebSearch': 'websearch',
  'WebFetch': 'webfetch',
  'AskUserQuestion': 'question',
  'Skill': 'skill',
  'Task': 'task',
  'TaskCreate': 'task_create',
  'TaskUpdate': 'task_update',
  'TaskList': 'task_list',
  'TaskGet': 'task_get',
};
```

#### 2.2 Frontmatter Conversion

**Claude Code format:**
```yaml
---
name: kanban-discover
description: Investigate problems...
allowed-tools: Read, Glob, Grep, WebSearch, WebFetch, AskUserQuestion, Skill, Task
argument-hint: "[problem to investigate]"
---
```

**OpenCode format:**
```yaml
---
name: kanban-discover
description: Investigate problems...
tools:
  read: true
  glob: true
  grep: true
  websearch: true
  webfetch: true
  question: true
  skill: true
  task: true
argument-hint: "[problem to investigate]"
---
```

**Implementation:**

```javascript
/**
 * Convert allowed-tools string to OpenCode tools object
 */
function convertAllowedTools(allowedToolsStr) {
  if (!allowedToolsStr) return null;

  const tools = {};
  const toolList = allowedToolsStr.split(',').map(t => t.trim());

  for (const tool of toolList) {
    const mappedName = TOOL_NAME_MAP[tool] || tool.toLowerCase();
    tools[mappedName] = true;
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
```

#### 2.3 Path Replacements

In skill body content, replace:

| From | To |
|------|-----|
| `.claude/skills/` | `.opencode/skills/` |
| `~/.claude/` | `~/.config/opencode/` |

**Implementation:**

```javascript
const PATH_REPLACEMENTS = {
  '.claude/skills/': '.opencode/skills/',
  '~/.claude/': '~/.config/opencode/',
};

function replacePathsForOpencode(content) {
  let result = content;
  for (const [from, to] of Object.entries(PATH_REPLACEMENTS)) {
    result = result.split(from).join(to);
  }
  return result;
}
```

#### 2.4 Full Transformer

```javascript
/**
 * Parse YAML frontmatter from a SKILL.md file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };

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

  if (!frontmatter) return content;

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
```

#### 2.5 Copy Skill File Function

```javascript
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
```

---

### Task 3: Update Install Flow

**File:** `apps/kanban/bin/install.cjs`

Modify `main()` to:

1. Prompt for runtime selection
2. Loop through selected runtimes
3. Copy skills with transformation for OpenCode
4. Store runtime in config.yaml

```javascript
async function main() {
  // ... existing setup ...

  // Prompt for runtime
  const selectedRuntimes = await promptRuntime();

  console.log();
  console.log(`Installing for: ${selectedRuntimes.map(r => RUNTIMES[r].name).join(' + ')}`);

  // Install skills for each runtime (additive - doesn't remove existing)
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

  // ... rest of install (scripts, templates, etc.) ...

  // config.yaml handled as before (no runtime field - that's a VSCode setting)
}
```

---

### Task 4: Update VSCode Extension

#### 4.1 Add Extension Setting

**File:** `apps/vscode/package.json`

Add the runtime setting to the extension's contribution points:

```json
{
  "contributes": {
    "configuration": {
      "title": "Kanban",
      "properties": {
        "kanban.runtime": {
          "type": "string",
          "enum": ["claude", "opencode"],
          "default": "claude",
          "description": "Which AI CLI runtime to use for running skills"
        }
      }
    }
  }
}
```

#### 4.2 Update Extension Code

**File:** `apps/vscode/src/extension.ts`

The extension already has a `getClaudeCommand` function (line 80). We need to modify it to read from VSCode settings.

Add helper function to get runtime from VSCode settings:

```typescript
// Policy: Determine which runtime to use based on VSCode settings
function getRuntime(): 'claude' | 'opencode' {
  const config = vscode.workspace.getConfiguration('kanban');
  const runtime = config.get<string>('runtime', 'claude');
  return runtime === 'opencode' ? 'opencode' : 'claude';
}
```

Replace the existing `getClaudeCommand` function (lines 80-89) with:

```typescript
// Policy: Build CLI command based on runtime and settings
function getClaudeCommand(command: string): string {
  const projectSettings = settings.readProjectSettings(workspaceRoot);
  const globalSettings = settings.readGlobalSettings();
  const runtime = getRuntime();

  if (runtime === 'opencode') {
    // OpenCode uses: opencode run "prompt"
    // Note: OpenCode permissions are managed via opencode.json, not CLI flags
    return `opencode run "${command}"`;
  }

  // Claude Code uses: claude "prompt"
  const isYolo = claudeSettings.isYoloEnabled(projectSettings, globalSettings);
  if (isYolo) {
    return `claude --dangerously-skip-permissions "${command}"`;
  }
  return `claude "${command}"`;
}
```

**Note:** OpenCode handles permissions differently:
- Claude Code uses CLI flag: `--dangerously-skip-permissions`
- OpenCode uses config file `opencode.json`: `{ "permission": { "*": "allow" } }`
- OpenCode defaults to "allow" for most permissions, so YOLO mode is less necessary

The VSCode extension's YOLO toggle only applies to Claude Code. For OpenCode, permissions are managed via config file.

---

### Task 5: Update Manifest

**File:** `apps/kanban/bin/install.cjs`

Store selected runtimes in manifest for future reference:

```javascript
const manifest = {
  _version: require('../package.json').version,
  _installedAt: new Date().toISOString(),
  runtimes: selectedRuntimes,           // ['claude'] or ['opencode'] or ['claude', 'opencode']
  skillsDirs: selectedRuntimes.map(r => RUNTIMES[r].skillsDir),
  kanbanDir: '.kanban/',
};
```

---

## Files NOT Modified

The following files remain unchanged:

| Location | Reason |
|----------|--------|
| `apps/kanban/src/content/skills/*.md` | Skills stay in Claude format (source of truth) |
| `apps/kanban/tools/build.ts` | Build process unchanged |
| `apps/kanban/dist/*` | Built output, not source |

Transformation to OpenCode format happens at **install time** in the user's project, not in the source or build.

---

## Testing Strategy

### Manual Testing

1. **Install for Claude Code only**
   - Run `npx @mattfletcher94/claudeban`, select option 1
   - Verify skills in `.claude/skills/`
   - Verify no `.opencode/` directory created

2. **Install for OpenCode only**
   - Run installer, select option 2
   - Verify skills in `.opencode/skills/`
   - Verify skill frontmatter converted (tools object, not allowed-tools)
   - Verify paths replaced in skill body

3. **Install for Both**
   - Run installer, select option 3
   - Verify skills in both directories
   - Verify `.claude/skills/` has original format
   - Verify `.opencode/skills/` has converted format

4. **VSCode Extension Settings**
   - Set `kanban.runtime: "claude"` - verify `claude "skill"` invoked
   - Set `kanban.runtime: "opencode"` - verify `opencode run "skill"` invoked
   - Change setting while extension is running - verify new runtime used

5. **Install Both, Switch in VSCode**
   - Install with "Both" option
   - Verify `.claude/skills/` and `.opencode/skills/` both exist
   - In VSCode, set `kanban.runtime: "claude"` - works
   - In VSCode, set `kanban.runtime: "opencode"` - works
   - Two team members can have different settings on same project

### Transformation Verification

For each skill file, verify:

| Check | Claude Format | OpenCode Format |
|-------|---------------|-----------------|
| Tool restrictions | `allowed-tools: Read, Write` | `tools:\n  read: true\n  write: true` |
| Paths in body | `.claude/skills/` | `.opencode/skills/` |
| Global paths | `~/.claude/` | `~/.config/opencode/` |

---

## File Changes Summary

| File | Change |
|------|--------|
| `apps/kanban/bin/install.cjs` | Add runtime prompt, transformer, multi-runtime install |
| `apps/vscode/package.json` | Add `kanban.runtime` setting contribution |
| `apps/vscode/src/extension.ts` | Add `getRuntime()`, modify `getClaudeCommand()` |

---

## Open Questions / Future Work

1. **Migration support** - Currently not implementing a migration path. Users who switch runtimes should reinstall.

2. **Runtime switching in VSCode** - Should the extension provide a command to switch runtimes? Or require config edit?

3. **CI/CD flags** - Consider adding `--claude`, `--opencode`, `--both` flags for non-interactive install.

4. **Tool name mapping completeness** - Verify all tools used in skills are mapped. May need updates as skills evolve.

---

## References

- [OpenCode Documentation](https://opencode.ai/docs)
- [OpenCode Permissions](https://opencode.ai/docs/permissions/)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Anthropic Skills GitHub](https://github.com/anthropics/skills)
- [GSD Repository](https://github.com/gsd-build/get-shit-done) - Reference implementation for multi-runtime support
