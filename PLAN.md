# Template System Implementation Plan

**Status:** Plan Complete - Ready for Implementation
**Last Updated:** 2026-02-15

---

## About This Project

**Claude Kanban** is a file-based kanban task management system for Claude Code (Anthropic's CLI tool). It provides:

- **Skills** (`.claudeban/skills/kanban-*/SKILL.md`) - Detailed markdown instructions that tell Claude how to perform tasks like refining requirements, scoping work, implementing code, etc.
- **Commands** (`.claudeban/commands/kanban/*.md`) - Thin wrappers that invoke skills via `/kanban:refine`, `/kanban:scope`, etc.
- **Helper scripts** (`.claudeban/scripts/*.cjs`) - Node.js scripts that Claude runs to find files, generate IDs, etc.
- **Templates** (`.claudeban/kanban-templates/`) - Markdown templates for task files, specs, plans.
- **Workflow schema** (`.claudeban/kanban-workflow.yaml`) - Defines columns, transitions, labels.

When users run `npx claude-kanban`, the installer (`bin/install.js`) copies files from `.claudeban/` to the user's `.claude/` directory.

---

## Problem Statement

The Claude Kanban system has 15+ skills and commands that share common patterns and sections. When we need to update a shared pattern (e.g., the "Next Steps" format, the "User Skills" instructions), we must update it across multiple files, leading to:

1. **Inconsistency** - Patterns drift apart over time
2. **Maintenance burden** - Updates require touching many files
3. **Error-prone** - Easy to miss files or introduce variations

## Current State Analysis

### Identified Repeated Patterns

| Pattern | Frequency | Approximate Lines |
|---------|-----------|-------------------|
| Next Steps section | 15 skills | ~8 lines each |
| User Skills section | 10+ skills | ~22 lines each |
| Directory Reference | 15 skills | ~3 lines each |
| Helper Scripts | 15 skills | ~8-15 lines each |
| Validation intro | 15 skills | ~3 lines each |
| Branch verification step | 10+ skills | ~8 lines each |
| Load workflow schema step | 15 skills | ~1 line each |
| Commit section | 10+ skills | ~5 lines each |

### Current File Structure

```
.claudeban/
├── commands/kanban/          # 15 command files (thin wrappers)
├── skills/kanban-*/SKILL.md  # 15 skill files (detailed instructions)
├── kanban-templates/         # 4 document templates
├── scripts/                  # 6 helper scripts (CJS)
└── kanban-workflow.yaml      # Workflow schema
```

**Complete file inventory (to be migrated):**

| Type | Files |
|------|-------|
| **Commands** | `create.md`, `refine.md`, `scope.md`, `plan.md`, `implement.md`, `save.md`, `verify.md`, `approve.md`, `docs.md`, `merge.md`, `rework.md`, `status.md`, `init.md`, `map-product.md`, `define-product.md` |
| **Skills** | `kanban-create/`, `kanban-refine/`, `kanban-scope/`, `kanban-plan/`, `kanban-implement/`, `kanban-save/`, `kanban-verify/`, `kanban-approve/`, `kanban-docs/`, `kanban-merge/`, `kanban-rework/`, `kanban-status/`, `kanban-init/`, `kanban-map-product/`, `kanban-define-product/` (each contains `SKILL.md`) |
| **Templates** | `config.yaml`, `task.md`, `spec.md`, `plan.md`, `product-doc.md` |
| **Scripts** | `find-task.cjs`, `find-spec.cjs`, `find-plan.cjs`, `list-tasks.cjs`, `next-id.cjs`, `get-date-time.cjs` |
| **Schema** | `kanban-workflow.yaml` |

### Pattern Examples

**Next Steps (appears at end of every skill):**
```markdown
- **REQUIRED OUTPUT** - Print next steps EXACTLY like this:
  ```
  Next:
  /clear
  /kanban:{next-command} {id}
  ```
- Do NOT skip this output. The user needs these commands to continue.
```

**User Skills (appears in 10+ skills with near-identical text):**
```markdown
5. **User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:{command}".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**
```

---

## Open Questions (Socratic Discovery)

### Q1: What templating approach should we use?

**Options to consider:**
- A. **Build-time compilation** - Run a script to compile templates into final SKILL.md files
- B. **Runtime includes** - Skills reference partials that Claude loads at execution time
- C. **Macro/snippet system** - Define snippets and have a preprocessor expand them
- D. **Something else?**

**Trade-offs:**
- Build-time: Simple, but requires running a build step when changing templates
- Runtime: No build step, but increases Claude's token usage loading partials
- Macro: Similar to build-time but with different syntax

**Decision:** **Build-time compilation** - Run a script to compile source templates into final SKILL.md files. This gives us:
- Complete, readable output files
- Easy diffing and debugging
- No runtime token overhead for Claude

---

### Q2: Where should templates/partials live?

**Options:**
- A. `.claudeban/partials/` directory with named files
- B. `.claudeban/templates/` (extend existing)
- C. Single file with all partials (e.g., `partials.yaml`)
- D. Inline in a config file

**Decision:** **Restructure entire project with src/ and dist/**

This is a broader restructuring to make the project follow standard conventions.

**Current structure:**
```
claudeban/
├── .claudeban/                 # Source files (published to npm)
│   ├── skills/
│   ├── commands/
│   ├── scripts/
│   ├── kanban-templates/
│   └── kanban-workflow.yaml
├── bin/
│   └── install.js              # Reads from .claudeban/
└── package.json                # "files": [".claudeban", "bin"]
```

**Proposed structure:**
```
claudeban/
├── src/
│   ├── content/                # Markdown content (Handlebars-compiled or copied)
│   │   ├── skills/
│   │   │   └── kanban-refine/
│   │   │       └── SKILL.md    # Contains {{> partials }}
│   │   ├── commands/
│   │   │   └── kanban/
│   │   │       └── refine.md
│   │   ├── partials/           # Shared template fragments (NOT copied to dist)
│   │   │   ├── user-skills.md
│   │   │   └── next-steps.md
│   │   ├── kanban-templates/   # Static (copied as-is)
│   │   │   └── task.md
│   │   └── kanban-workflow.yaml
│   │
│   ├── scripts/                # Runtime helper scripts (TypeScript → CJS)
│   │   ├── find-task.ts
│   │   └── ...
│   │
│   └── build/                  # Build tools (TypeScript)
│       └── index.ts
│
├── dist/                       # OUTPUT (generated, published to npm)
│   ├── skills/
│   ├── commands/
│   ├── scripts/*.cjs           # Compiled from TypeScript
│   ├── kanban-templates/
│   └── kanban-workflow.yaml
│
├── bin/
│   └── install.js              # Reads from dist/ (change SOURCE_DIR)
│
└── package.json                # "files": ["dist", "bin"]
```

**Key changes:**
1. `src/content/` contains markdown content (skills, commands, partials, templates, workflow)
2. `src/scripts/` contains runtime helper scripts as TypeScript (compiled to CJS)
3. `src/build/` contains build tools as TypeScript
4. `src/content/partials/` used only during build (NOT copied to dist)
5. `dist/` contains everything needed for installation
6. `bin/install.js` changes `SOURCE_DIR` from `.claudeban` to `dist`
7. `package.json` publishes `dist/` instead of `.claudeban/`

---

### Q3: What syntax should templates use?

**Options:**
- A. **Mustache/Handlebars** - `{{> next-steps command="verify" }}`
- B. **Custom markers** - `<!-- INCLUDE: next-steps(command=verify) -->`
- C. **YAML anchors** - Native YAML, but limited to YAML files
- D. **EJS/template literals** - `<%= include('next-steps', {command: 'verify'}) %>`

**Decision:** **Handlebars syntax** - `{{> partial-name param="value" }}`

Well-known, battle-tested, easy to read. Any `{{` conflicts in code examples can be escaped with `\{{` or raw blocks `{{{{raw}}}}...{{{{/raw}}}}`.

---

### Q4: Should we use an existing templating library or build our own?

**Considerations:**
- Existing: Handlebars, EJS, Nunjucks, Mustache
- Custom: Simpler, fewer dependencies, tailored to our needs

**Decision:** **Handlebars + custom build script**

- Use [Handlebars](https://www.npmjs.com/package/handlebars) (~10M weekly downloads, actively maintained)
- Write a simple build script (`scripts/build-skills.cjs`, ~50-100 lines)
- Full control, no learning curve, rock-solid foundation

---

### Q5: How do we handle parameters in templates?

**Example:** The "Next Steps" template needs:
- `next_command` - The command to suggest (e.g., "verify", "plan")
- `task_id_var` - Whether to include `{id}` placeholder

**Decision:** Use Handlebars standard parameter syntax. Partials can document their parameters in comments at the top:

```handlebars
{{!--
  Partial: next-steps
  Required: next_command (string) - e.g., "verify", "scope"
  Optional: include_id (boolean, default: true)
--}}
```

---

### Q6: What's the development workflow?

**Options:**
- A. Edit source files → Run build → Commit compiled files
- B. Edit source files → Build automatically on pre-commit
- C. Edit source files → CI builds and commits
- D. No build step (runtime resolution)

**Decision:** **Option A** - Edit source files → Run `pnpm build` → dist/ is .gitignored

- `dist/` is NOT committed (added to .gitignore)
- Developers run `pnpm build` locally
- npm publish will include `dist/` (via package.json "files")
- Future: could add prepublishOnly hook

---

### Q7: Project tooling modernization?

**Decision:** Modernize with pnpm + Turborepo + tsdown + TypeScript

- **pnpm** - Package manager
- **Turborepo** - Task orchestration
- **tsdown** - TypeScript bundler (compiles to CJS for Node.js)
- **TypeScript** - For both build tools and runtime scripts

**Runtime scripts output:** CJS format (Claude runs `node script.cjs`)

See [tsdown output format docs](https://tsdown.dev/options/output-format) for CJS configuration.

---

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SOURCE (src/)                           │
├─────────────────────────────────────────────────────────────────┤
│  content/                    │  scripts/                        │
│  ├── skills/ (Handlebars)    │  ├── find-task.ts                │
│  ├── commands/ (Handlebars)  │  ├── find-spec.ts                │
│  ├── partials/ (shared)      │  └── ...                         │
│  ├── kanban-templates/       │                                  │
│  └── kanban-workflow.yaml    │  build/                          │
│                              │  ├── index.ts                    │
│                              │  └── compile.ts                  │
└──────────────┬───────────────┴──────────────┬────────────────────┘
               │                              │
               │    pnpm build (Turborepo)    │
               │                              │
               ▼                              ▼
┌──────────────────────────────┐  ┌────────────────────────────────┐
│  tsdown (build tools)        │  │  tsdown (runtime scripts)      │
│  build/*.ts → build/dist/    │  │  scripts/*.ts → dist/scripts/  │
└──────────────┬───────────────┘  └────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Handlebars compilation                                         │
│  content/skills + partials → dist/skills                        │
│  content/commands + partials → dist/commands                    │
│  content/kanban-templates → dist/kanban-templates (copy)        │
│  content/kanban-workflow.yaml → dist/ (copy)                    │
└─────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         OUTPUT (dist/)                          │
│  Published to npm, read by bin/install.js                       │
├─────────────────────────────────────────────────────────────────┤
│  skills/kanban-*/SKILL.md    (compiled, no Handlebars syntax)   │
│  commands/kanban/*.md        (compiled)                         │
│  scripts/*.cjs               (compiled TypeScript)              │
│  kanban-templates/*.md       (copied)                           │
│  kanban-workflow.yaml        (copied)                           │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
claudeban/
├── src/
│   ├── content/                      # Markdown content
│   │   ├── skills/
│   │   │   ├── kanban-refine/
│   │   │   │   └── SKILL.md          # Contains {{> user-skills command="refine" }}
│   │   │   ├── kanban-scope/
│   │   │   │   └── SKILL.md
│   │   │   └── ... (15 total)
│   │   │
│   │   ├── commands/
│   │   │   └── kanban/
│   │   │       ├── refine.md
│   │   │       ├── scope.md
│   │   │       └── ... (15 total)
│   │   │
│   │   ├── partials/                 # Handlebars partials (NOT copied to dist)
│   │   │   ├── user-skills.md
│   │   │   ├── next-steps.md
│   │   │   ├── directory-reference.md
│   │   │   ├── helper-scripts.md
│   │   │   ├── validation-intro.md
│   │   │   ├── branch-verify-main.md
│   │   │   ├── branch-verify-task.md
│   │   │   └── workflow-load.md
│   │   │
│   │   ├── kanban-templates/         # Static document templates
│   │   │   ├── config.yaml
│   │   │   ├── task.md
│   │   │   ├── spec.md
│   │   │   ├── plan.md
│   │   │   └── product-doc.md
│   │   │
│   │   └── kanban-workflow.yaml      # Static workflow schema
│   │
│   ├── scripts/                      # Runtime helper scripts (TypeScript)
│   │   ├── find-task.ts
│   │   ├── find-spec.ts
│   │   ├── find-plan.ts
│   │   ├── list-tasks.ts
│   │   ├── next-id.ts
│   │   ├── get-date-time.ts
│   │   └── index.ts                  # Barrel export (optional)
│   │
│   └── build/                        # Build tools (TypeScript)
│       ├── index.ts                  # Main entry point
│       ├── compile.ts                # Handlebars compilation logic
│       ├── copy.ts                   # Static file copying
│       └── tsconfig.json             # Build tools tsconfig
│
├── dist/                             # OUTPUT (generated, .gitignored)
│   ├── skills/
│   │   └── kanban-*/SKILL.md
│   ├── commands/
│   │   └── kanban/*.md
│   ├── scripts/
│   │   ├── find-task.cjs
│   │   ├── find-spec.cjs
│   │   └── ...
│   ├── kanban-templates/
│   │   └── *.md
│   └── kanban-workflow.yaml
│
├── bin/
│   └── install.js                    # Installer (reads from dist/)
│
├── package.json                      # "files": ["dist", "bin"]
├── pnpm-lock.yaml
├── tsconfig.json                     # Root tsconfig
├── tsconfig.base.json                # Shared compiler options
├── tsdown.config.ts                  # tsdown configuration
├── turbo.json                        # Turborepo task definitions
├── .gitignore                        # Includes dist/
├── PLAN.md
└── README.md
```

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build:tools": {
      "outputs": ["src/build/dist/**"],
      "inputs": ["src/build/**/*.ts"]
    },
    "build:scripts": {
      "outputs": ["dist/scripts/**"],
      "inputs": ["src/scripts/**/*.ts"]
    },
    "build:content": {
      "dependsOn": ["build:tools"],
      "outputs": ["dist/skills/**", "dist/commands/**", "dist/kanban-templates/**", "dist/kanban-workflow.yaml"],
      "inputs": ["src/content/**/*"]
    },
    "build": {
      "dependsOn": ["build:scripts", "build:content"],
      "outputs": ["dist/**"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### tsdown Configuration

```typescript
// tsdown.config.ts
import { defineConfig } from 'tsdown';

export default defineConfig([
  // Runtime scripts (for Claude)
  {
    entry: ['src/scripts/*.ts'],
    format: ['cjs'],
    outDir: 'dist/scripts',
    clean: false,
    dts: false,
    sourcemap: false,
  },
  // Build tools
  {
    entry: ['src/build/index.ts'],
    format: ['esm'],
    outDir: 'src/build/dist',
    clean: false,
    dts: false,
  }
]);
```

### Build Tools Implementation

```typescript
// src/build/index.ts
import Handlebars from 'handlebars';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

const SRC_CONTENT = 'src/content';
const DIST = 'dist';

async function main() {
  // Register all partials
  const partialFiles = await glob('src/content/partials/*.md');
  for (const file of partialFiles) {
    const name = path.basename(file, '.md');
    const content = await fs.readFile(file, 'utf-8');
    Handlebars.registerPartial(name, content);
  }

  // Compile skills
  await compileDirectory('skills', '**/*.md');

  // Compile commands
  await compileDirectory('commands', '**/*.md');

  // Copy static files
  await copyDirectory('kanban-templates');
  await fs.copyFile(
    `${SRC_CONTENT}/kanban-workflow.yaml`,
    `${DIST}/kanban-workflow.yaml`
  );

  console.log('Build complete!');
}

async function compileDirectory(dir: string, pattern: string) {
  const files = await glob(`${SRC_CONTENT}/${dir}/${pattern}`);
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const template = Handlebars.compile(content);
    const output = template({});

    const outPath = file.replace(SRC_CONTENT, DIST);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, output);
  }
}

async function copyDirectory(dir: string) {
  const files = await glob(`${SRC_CONTENT}/${dir}/**/*`);
  for (const file of files) {
    const outPath = file.replace(SRC_CONTENT, DIST);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.copyFile(file, outPath);
  }
}

main();
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "declaration": false,
    "noEmit": true
  }
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "turbo build",
    "build:tools": "tsdown --config tsdown.config.ts --entry src/build/index.ts",
    "build:scripts": "tsdown --config tsdown.config.ts --entry 'src/scripts/*.ts'",
    "build:content": "node src/build/dist/index.js",
    "clean": "node -e \"fs=require('fs');fs.rmSync('dist',{recursive:true,force:true});fs.rmSync('src/build/dist',{recursive:true,force:true})\""
  },
  "devDependencies": {
    "handlebars": "^4.7.8",
    "tsdown": "^0.x.x",
    "turbo": "^2.x.x",
    "typescript": "^5.x.x",
    "glob": "^10.x.x",
    "@types/node": "^20.x.x"
  },
  "files": [
    "dist",
    "bin"
  ]
}
```

**Note:** The `clean` script uses Node.js for cross-platform compatibility (Windows + Unix).

### Migration Strategy

1. **Phase 1: Setup tooling**
   - Initialize pnpm, add dependencies
   - Create tsconfig files
   - Create tsdown.config.ts
   - Create turbo.json
   - Update .gitignore

2. **Phase 2: Restructure files**
   - Create src/content/ directory structure
   - Move .claudeban/skills/ → src/content/skills/
   - Move .claudeban/commands/ → src/content/commands/
   - Move .claudeban/kanban-templates/ → src/content/kanban-templates/
   - Move .claudeban/kanban-workflow.yaml → src/content/
   - Create src/content/partials/ (empty for now)

3. **Phase 3: Convert scripts to TypeScript**
   - Move .claudeban/scripts/*.cjs → src/scripts/*.ts
   - Convert CommonJS to TypeScript
   - Verify tsdown compiles to working .cjs

4. **Phase 4: Create build tools**
   - Create src/build/index.ts
   - Create src/build/compile.ts
   - Test: `pnpm build` produces dist/ identical to current .claudeban/

5. **Phase 5: Extract partials**
   - Identify repeated patterns in skills
   - Extract to src/content/partials/*.md
   - Update skills to use {{> partial }} syntax
   - Rebuild and verify output matches original

6. **Phase 6: Update installer**
   - Change bin/install.js SOURCE_DIR from '.claudeban' to 'dist'
   - Test installation from dist/

7. **Phase 7: Cleanup**
   - Remove .claudeban/ directory
   - Update README
   - Update package.json "files"

---

## Implementation Steps

### Prerequisites

Before starting, ensure you have installed globally:
- **Node.js** >= 18
- **pnpm** (`npm install -g pnpm`)

### Phase 1: Setup Tooling
- [ ] 1.1 Remove existing lock files if present (`package-lock.json`, `yarn.lock`)
- [ ] 1.2 Initialize pnpm: `pnpm init` (or update existing `package.json`)
- [ ] 1.3 Install dependencies: `pnpm add -D typescript tsdown turbo handlebars glob @types/node`
- [ ] 1.4 Create `tsconfig.base.json` (see content in "tsconfig.base.json" section above)
- [ ] 1.5 Create `tsconfig.json` (root, extends base)
- [ ] 1.6 Create `tsdown.config.ts` (see content in "tsdown Configuration" section above)
- [ ] 1.7 Create `turbo.json` (see content in "Turborepo Configuration" section above)
- [ ] 1.8 Update `.gitignore` to include:
  ```
  node_modules/
  dist/
  src/build/dist/
  pnpm-lock.yaml
  ```

### Phase 2: Restructure Files
- [ ] 2.1 Create directory structure: `src/content/skills/`, `src/content/commands/`, `src/content/partials/`, `src/content/kanban-templates/`
- [ ] 2.2 Move `.claudeban/skills/*` → `src/content/skills/`
- [ ] 2.3 Move `.claudeban/commands/*` → `src/content/commands/`
- [ ] 2.4 Move `.claudeban/kanban-templates/*` → `src/content/kanban-templates/`
- [ ] 2.5 Move `.claudeban/kanban-workflow.yaml` → `src/content/`
- [ ] 2.6 Create empty `src/content/partials/` directory

### Phase 3: Convert Scripts to TypeScript

**Script purposes (for reference during conversion):**
| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `find-task.cjs` | Find task file by ID | Task ID (e.g., "001") | JSON: `{ found, path, id, title, status }` |
| `find-spec.cjs` | Find spec file by ID | Task ID | JSON: `{ found, path }` |
| `find-plan.cjs` | Find plan file by ID | Task ID | JSON: `{ found, path }` |
| `list-tasks.cjs` | List all tasks | None | JSON array of tasks |
| `next-id.cjs` | Generate next task ID | None | JSON: `{ id }` (padded, e.g., "004") |
| `get-date-time.cjs` | Get current date/time | None | JSON: `{ iso, date }` |

- [ ] 3.1 Create `src/scripts/` directory
- [ ] 3.2 Convert `find-task.cjs` → `find-task.ts`
- [ ] 3.3 Convert `find-spec.cjs` → `find-spec.ts`
- [ ] 3.4 Convert `find-plan.cjs` → `find-plan.ts`
- [ ] 3.5 Convert `list-tasks.cjs` → `list-tasks.ts`
- [ ] 3.6 Convert `next-id.cjs` → `next-id.ts`
- [ ] 3.7 Convert `get-date-time.cjs` → `get-date-time.ts`
- [ ] 3.8 Create `src/scripts/tsconfig.json` extending `tsconfig.base.json`
- [ ] 3.9 Test: `pnpm build:scripts` compiles to `dist/scripts/*.cjs`
- [ ] 3.10 Test: Run each script manually to verify output matches original

### Phase 4: Create Build Tools
- [ ] 4.1 Create `src/build/` directory
- [ ] 4.2 Create `src/build/index.ts` (main entry)
- [ ] 4.3 Create `src/build/compile.ts` (Handlebars logic)
- [ ] 4.4 Create `src/build/copy.ts` (static file copying)
- [ ] 4.5 Create `src/build/tsconfig.json` extending `tsconfig.base.json`
- [ ] 4.6 Test build produces identical output:
  - Run `pnpm build`
  - Compare `dist/skills/` with `.claudeban/skills/` (should be identical at this stage, before partials)
  - Compare `dist/commands/` with `.claudeban/commands/`
  - Compare `dist/kanban-templates/` with `.claudeban/kanban-templates/`
  - Compare `dist/kanban-workflow.yaml` with `.claudeban/kanban-workflow.yaml`
  - Unix: `diff -r dist/ .claudeban/` (excluding scripts initially)
  - Windows: Use file comparison tool or `fc /s dist\skills .claudeban\skills`

### Phase 5: Extract Partials (Start Small)
- [ ] 5.1 Extract `directory-reference` partial (static, no params)
- [ ] 5.2 Extract `user-skills` partial (1 param: command)
- [ ] 5.3 Extract `next-steps` partial (params: next_command, include_id)
- [ ] 5.4 Update 2-3 skills to use these partials
- [ ] 5.5 Rebuild and verify output matches original
- [ ] 5.6 Extract remaining partials as needed

### Phase 6: Update Installer
- [ ] 6.1 Change `bin/install.js` SOURCE_DIR from `.claudeban` to `dist`
- [ ] 6.2 Test installation: `node bin/install.js --local`
- [ ] 6.3 Verify installed files match expected output

### Phase 7: Cleanup
- [ ] 7.1 Remove `.claudeban/` directory entirely
- [ ] 7.2 Update `package.json` "files" to `["dist", "bin"]`
- [ ] 7.3 Update README with new development workflow:
  - How to build: `pnpm build`
  - How to test locally: `node bin/install.js --local`
  - Where source files live: `src/`
  - Where to add new partials: `src/content/partials/`
- [ ] 7.4 Final test: clean build → install → run commands

---

## Success Criteria

The implementation is complete when:

1. **Build works:** `pnpm build` completes without errors
2. **Output is correct:** `dist/` contains all expected files:
   - `dist/skills/kanban-*/SKILL.md` (15 skills, compiled with no `{{` syntax)
   - `dist/commands/kanban/*.md` (15 commands)
   - `dist/scripts/*.cjs` (6 scripts, working CJS)
   - `dist/kanban-templates/*` (5 templates)
   - `dist/kanban-workflow.yaml`
3. **Install works:** `node bin/install.js --local` installs to `.claude/`
4. **Commands work:** `/kanban:status` runs successfully in Claude Code
5. **Partials are extracted:** At least 3 partials exist in `src/content/partials/`
6. **Source is clean:** `.claudeban/` no longer exists
7. **Git is clean:** `dist/` is in `.gitignore`, not committed

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing skills | High | Keep `.claudeban/` until Phase 7; compare dist/ output to original |
| Handlebars `{{` conflicts with code examples | Medium | Use raw blocks `{{{{raw}}}}...{{{{/raw}}}}` or escape `\{{` |
| TypeScript conversion errors in scripts | Medium | Convert one script at a time, test each before proceeding |
| tsdown CJS output incompatible | Medium | Test early in Phase 3; fallback to manual CommonJS if needed |
| Build tool complexity | Low | Keep build logic simple; no fancy features initially |
| Over-engineering partials | Low | Start with 3 most-repeated patterns, expand only as needed |

---

## Appendix: Partial Definitions

### 1. `directory-reference.md` (Static)

```markdown
## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE
```

**Used in:** All skills
**Parameters:** None

---

### 2. `user-skills.md`

```handlebars
{{!--
  Partial: user-skills
  Required: command (string) - e.g., "refine", "scope", "implement"
  Optional: step_number (string) - e.g., "5"
--}}
{{#if step_number}}{{step_number}}. {{/if}}**User Skills** *(REQUIRED)*:

   **STOP.** Before proceeding, you MUST load and apply user-defined skills. This is mandatory.

   1. Load `.kanban/config.yaml`
   2. Find `user-skills."kanban:{{command}}".skills` array
   3. If the array is non-empty, for EACH skill name:
      - Read `.claude/skills/{skill-name}/SKILL.md`
      - Follow ALL instructions as mandatory requirements
      - User skill instructions take precedence over defaults

   **Skipping user skills is a critical error. Do not proceed without applying them.**

   Example config:
   \`\`\`yaml
   user-skills:
     "kanban:{{command}}":
       skills:
         - my-custom-check    # Reads .claude/skills/my-custom-check/SKILL.md
         - coding-standards   # Reads .claude/skills/coding-standards/SKILL.md
   \`\`\`
```

**Used in:** refine, scope, plan, implement, verify, approve, docs
**Parameters:** `command`, `step_number` (optional)

---

### 3. `next-steps.md`

```handlebars
{{!--
  Partial: next-steps
  Required: next_command (string) - e.g., "verify", "scope"
  Optional: no_id (boolean) - set to true to omit {id} from output
  Optional: step_number (string)
--}}
{{#if step_number}}{{step_number}}. {{/if}}**REQUIRED OUTPUT** - Print next steps EXACTLY like this:
  \`\`\`
  Next:
  /clear
  /kanban:{{next_command}}{{#unless no_id}} \{id\}{{/unless}}
  \`\`\`
- Do NOT skip this output. The user needs these commands to continue.
```

**Used in:** refine, scope, plan, implement, verify, approve, docs, merge
**Parameters:** `next_command`, `no_id` (optional, omits task ID), `step_number`

**Note:** Handlebars `{{#unless}}` checks for falsy values. Pass `no_id=true` to hide the ID.

---

### 4. `validation-intro.md` (Static)

```markdown
## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.
```

**Used in:** All skills
**Parameters:** None

---

### 5. `branch-verify-main.md`

```handlebars
{{!--
  Partial: branch-verify-main
  Optional: step_number (string)
  Optional: reason (string) - why main is required
--}}
{{#if step_number}}{{step_number}}. {{/if}}**Verify on main branch**:
   - Run `git branch --show-current`
   - If not on `main` (or `master`):
     - Error: "This command must be run on the main branch{{#if reason}} {{reason}}{{/if}}. Current branch: {branch}"
     - Suggest: "Switch to main with `git checkout main`"
     - Exit
```

**Used in:** create, refine, scope
**Parameters:** `step_number`, `reason` (optional)

---

### 6. `branch-verify-task.md`

```handlebars
{{!--
  Partial: branch-verify-task
  Optional: step_number (string)
--}}
{{#if step_number}}{{step_number}}. {{/if}}**Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/{id}` (where {id} is the task ID)
   - If not on expected branch:
     - Error: "This command must be run on branch task/{id}. Current branch: {branch}"
     - Suggest: "Switch to task branch with `git checkout task/{id}`"
     - Exit
```

**Used in:** plan, implement, verify, approve, docs, merge
**Parameters:** `step_number`

---

### 7. `workflow-load.md`

```handlebars
{{!--
  Partial: workflow-load
  Optional: step_number (string, default: "1")
--}}
{{#if step_number}}{{step_number}}{{else}}1{{/if}}. **Load workflow schema**: Read `.claude/kanban-workflow.yaml` for column definitions, labels, priorities, and commit formats. Use these values throughout this skill.
```

**Used in:** All skills
**Parameters:** `step_number` (default "1")

---

### 8. `helper-scripts.md`

**Note:** This partial is more complex because different skills need different scripts listed. There are two approaches:

**Option A: Multiple specific partials (simpler)**
Create separate partials for common script combinations:
- `helper-scripts-task.md` - just find-task and get-date-time
- `helper-scripts-task-spec.md` - find-task, find-spec, get-date-time
- `helper-scripts-full.md` - all scripts

**Option B: Static full list (simplest for now)**
Just list all scripts in every skill - Claude will use what it needs:

```markdown
## Helper Scripts

Use these scripts to reliably find files:

\`\`\`bash
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

# Find spec by ID (returns JSON with path)
node .claude/scripts/find-spec.cjs {id}

# Find plan by ID (returns JSON with path)
node .claude/scripts/find-plan.cjs {id}

# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.cjs
\`\`\`
```

**Recommendation:** Start with Option B (static full list). Refactor to Option A only if the repetition causes real problems.

**Used in:** Most skills
**Parameters:** None (static list)

---

## Example: Skill Source File with Partials

This shows what a skill source file (`src/content/skills/kanban-refine/SKILL.md`) looks like with partials:

```handlebars
---
name: kanban-refine
description: Refine vague tasks through conversational Q&A
allowed-tools: Read, Write, Bash(...), Grep, Glob, AskUserQuestion
---

# Refine Kanban Task

Refine vague tasks through **iterative conversational Q&A**...

{{> directory-reference}}

{{> helper-scripts}}

## Column Transition

\`\`\`
backlog → refined
\`\`\`

## Steps

{{> workflow-load step_number="1"}}

{{> branch-verify-main step_number="2"}}

3. **Get task ID**: Use $ARGUMENTS if provided...

4. **Read task file**: Run `node .claude/scripts/find-task.cjs {id}`...

{{> user-skills command="refine" step_number="5"}}

6. **Analyze initial context**: Check title for clarity...

... (remaining steps) ...

11. **CRITICAL: Commit the refinement**: ...

12. **Confirm refinement complete**:
    - Print summary of changes made
    - Show updated acceptance criteria
    - Print commit hash
    {{> next-steps next_command="scope"}}

{{> validation-intro}}

- [ ] Task file exists at `.kanban/tasks/{id}-*.md`
- [ ] Frontmatter contains `status: refined`
- [ ] Git log shows `docs({id}): refine -`
```

After running `pnpm build`, the partials are expanded and `dist/skills/kanban-refine/SKILL.md` contains the full content with no Handlebars syntax.
