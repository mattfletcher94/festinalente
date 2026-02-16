# Claude Kanban

A file-based kanban board for AI-assisted development. Task and planning data lives with your code - transparent, versionable, and accessible to both humans and AI.

## Installation

```bash
npx claude-kanban@latest
```

This installs the kanban skills to `.claude/` and creates the `.kanban/` directory structure.

**To update:**
```bash
npx claude-kanban@latest
```

The installer detects existing installations and backs up any files you've modified before updating.

## Quick Start

### 1. Document Your Product (Recommended)

For **existing codebases** with features but no documentation:
```bash
/kanban-map-product
```
The AI analyzes your code, asks clarifying questions, and generates product docs.

For **new projects** where you want to define vision first:
```bash
/kanban-define-product
```
The AI asks "What problem are you trying to solve?" and guides you through defining features.

Both create docs in `.kanban/product/` that give the AI context for future task work. They will also ask for your project name and update the config.

Product docs are organized by domain:
```
.kanban/product/
├── overview.md           # Product overview
├── auth/                 # Domain folder
│   ├── login.md         # Feature doc
│   └── permissions.md   # Concept doc
└── billing/
    └── subscriptions.md
```

Each doc has an ID matching its path (e.g., `auth/login` for `.kanban/product/auth/login.md`).

### 2. Create Your First Task

```bash
/kanban-create "Add user authentication"
```

This creates a task file, assigns it an ID (e.g., `001`), and commits it to git.

### 3. Work Through the Workflow

Each task progresses through columns. Run `/clear` before each command to reset context:

```bash
# On main branch
/clear
/kanban-refine 001              # Clarify requirements via Q&A

/clear
/kanban-scope 001               # Research codebase, create spec
                                # Creates task/001 branch automatically

# Now on task/001 branch
/clear
/kanban-plan 001                # Create implementation plan

/clear
/kanban-implement 001           # Write the code

/clear
/kanban-codecheck 001              # Run AI checks (auto-retries, auto-advances to QA)

# Human tests the application...

/clear
/kanban-approve 001             # Approve QA, commit code

/clear
/kanban-docs 001                # Update docs, push branch

# Create PR on GitHub, get it reviewed...

/clear
/kanban-merge 001               # Merge PR, delete branch, done!
                                # Returns to main branch
```

That's it. Your PR is merged and git history tells the story of your task.

---

## The Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                 │
│  MAIN BRANCH                                                                                    │
│  ═══════════                                                                                    │
│   create              refine              scope                                                 │
│   + commit            + commit            + creates task/{id} branch                            │
│       │                   │                   │                                                 │
│       ▼                   ▼                   ▼                                                 │
│   ┌────────┐         ┌─────────┐         ┌────────┐                                             │
│   │Backlog │────────▶│ Refined │────────▶│ Scoped │─────────────────────────────────────────┐   │
│   └────────┘         └─────────┘         └────────┘                                         │   │
│                                                                                             │   │
│  TASK BRANCH (task/{id})                                                                    │   │
│  ═══════════════════════                                                                    │   │
│                                               plan            implement                     │   │
│                                               + commit        (no commit)                   │   │
│                                                   │                │                        │   │
│                                                   ▼                ▼                        │   │
│                                              ┌─────────┐    ┌───────────┐                   │   │
│                                              │ Planned │───▶│In Progress│◀──────────┐      │   │
│                                              └─────────┘    └─────┬─────┘           │      │   │
│                                                                   │                 │      │   │
│                                                                   ▼                 │      │   │
│                                                            ┌────────────┐           │      │   │
│                                                            │ Code Check │           │      │   │
│                                                            └─────┬──────┘           │      │   │
│                                                              codecheck              │      │   │
│                                                                   │                 │      │   │
│                                                                   ▼                 │      │   │
│                                                              ┌─────────┐            │      │   │
│                                                              │   QA    │            │      │   │
│                                                              └────┬────┘            │      │   │
│                                                    ┌──────────────┴──────┐          │      │   │
│                                                    │                     │          │      │   │
│                                               approve               rework ─────────┘      │   │
│                                               + commit code                                │   │
│                                                    │                                       │   │
│                                                    ▼                                       │   │
│                                             ┌────────────┐                                 │   │
│                                             │Update Docs │                                 │   │
│                                             └─────┬──────┘                                 │   │
│                                                   │                                        │   │
│                                                 docs                                       │   │
│                                              + commit + push                               │   │
│                                                   │                                        │   │
│   ┌──────┐    ┌──────┐                           ▼                                        │   │
│   │ Done │◀───│  PR  │◀───────────────────[create PR on GitHub]                           │   │
│   └──────┘    └──┬───┘                                                                    │   │
│       ▲         │                                                                         │   │
│       │    ┌────┴────┐                                                                    │   │
│       │    │         │                                                                    │   │
│       │  merge    rework ─────────────────────────────────────────────────────────────────┘   │
│       │    │                                                                                  │
│       └────┘                                                                                  │
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key principles:**
- **Branch isolation:** Task work happens on `task/{id}` branches, keeping main clean
- **PR-based review:** Code is merged via pull request for proper code review
- **Each command is a stopping point:** You run a command, review the result, then decide to continue
- **Commits happen at most phases:** Git history tells the complete story
- **Code check is interactive:** If checks fail, AI asks before attempting fixes
- **Code check auto-advances:** Once checks pass, task moves to QA automatically

---

## Commands Reference

| Command | From | To | Branch | Commits |
|---------|------|-----|--------|---------|
| `kanban-status [id]` | — | — | any | No |
| `kanban-create "title"` | (new) | Backlog | main | Yes |
| `kanban-refine [id]` | Backlog | Refined | main | Yes |
| `kanban-scope [id]` | Refined | Scoped | main → task/{id} | Yes |
| `kanban-plan [id]` | Scoped | Planned | task/{id} | Yes |
| `kanban-implement [id]` | Planned | Code Check | task/{id} | No |
| `kanban-save [id]` | In Progress | In Progress | task/{id} | Yes |
| `kanban-codecheck [id]` | Code Check | QA | task/{id} | On retry |
| `kanban-approve [id]` | QA | Update Docs | task/{id} | Yes |
| `kanban-docs [id]` | Update Docs | PR | task/{id} | Yes |
| `kanban-merge [id]` | PR | Done | task/{id} → main | Yes |
| `kanban-rework [id]` | QA or PR | In Progress | task/{id} | Yes |

**Utility commands:**

| Command | Purpose |
|---------|---------|
| `kanban-status` | Show board status and suggest next command |
| `kanban-status [id]` | Show detailed status for a specific task |

**Product discovery commands:**

| Command | Purpose |
|---------|---------|
| `kanban-map-product` | Analyze existing codebase and create product docs |
| `kanban-define-product` | Define a new product through Q&A before coding |

---

## Happy Path Example

```bash
/kanban-create "Add dark mode support"    # → Backlog
/kanban-refine 001                        # → Refined
/kanban-scope 001                         # → Scoped (creates task branch)
/kanban-plan 001                          # → Planned
/kanban-implement 001                     # → In Progress
/kanban-codecheck 001                        # → QA (runs checks, asks before fixing)
# Human tests the application...
/kanban-approve 001                       # → Update Docs (commits code)
/kanban-docs 001                          # → PR (commits docs, pushes)
# User creates PR on GitHub, reviews, approves...
/kanban-merge 001                         # → Done
```

---

## Branching Strategy

Claude Kanban uses a `task/{id}` branching strategy for code isolation and PR-based review:

### Branch Lifecycle

1. **Create & Refine on main:** Task creation and refinement happen on main (no code changes yet)
2. **Scope creates branch:** When you scope a task, a `task/{id}` branch is created automatically
3. **All work on task branch:** Planning, implementation, verification, and QA happen on the task branch
4. **PR for merge:** When docs are complete, push branch and create PR on GitHub
5. **Merge completes task:** Merging the PR deletes the branch and returns you to main

### Branch Requirements by Command

| Phase | Commands | Required Branch |
|-------|----------|-----------------|
| **Early** | `create`, `refine` | `main` |
| **Transition** | `scope` | `main` → creates `task/{id}` |
| **Work** | All other task commands | `task/{id}` |
| **Complete** | `merge` | `task/{id}` → returns to `main` |

---

## Custom Skills

Skills are markdown files that provide guidance to the AI during specific commands.

### Configuring Skills

Edit `.kanban/config.yaml` to attach skills to commands:

```yaml
user-skills:
  "kanban-implement":
    skills:
      - coding-standards    # Reads .claude/skills/coding-standards/SKILL.md
      - architecture        # Reads .claude/skills/architecture/SKILL.md

  "kanban-codecheck":
    skills:
      - check-typescript    # Reads .claude/skills/check-typescript/SKILL.md
      - check-tests         # Reads .claude/skills/check-tests/SKILL.md
      - check-lint          # Reads .claude/skills/check-lint/SKILL.md

  "kanban-approve":
    skills:
      - code-review-checklist  # Reads .claude/skills/code-review-checklist/SKILL.md
```

Each skill name resolves to `.claude/skills/{name}/SKILL.md`.

### Creating Code Checks

Code checks run during `codecheck`. Create them in `.kanban/skills/`. There are two types:

**1. Command-based (automated)**

Runs a command and checks the exit code:

**`.kanban/skills/check-typescript.md`**
```markdown
# Check: TypeScript

Run `pnpm typecheck`

### Pass criteria
Exit code 0, no errors in output.

### Common failures
- "Cannot find module X" — missing dependency
- "Type X is not assignable to Y" — type mismatch
```

**2. AI-driven review (guidelines)**

AI reviews code against your documented patterns:

**`.kanban/skills/coding-patterns.md`**
```markdown
# Check: Coding Patterns

### Guidelines
- Use factory functions instead of classes
- API handlers belong in src/routes/
- Use arrow functions for callbacks
- Prefer composition over inheritance

### Review focus
Check new/modified files against the above patterns.
```

When a check fails, the AI shows the issues and asks: "Should I try to fix this?" You decide whether to let it attempt a fix or handle it manually.

---

## Board Configuration

Your project's `.kanban/config.yaml`:

```yaml
name: My Project

# Skill names resolve to .claude/skills/{name}/SKILL.md
user-skills:
  "kanban-status":
    skills:
  "kanban-create":
    skills:
  "kanban-refine":
    skills:
  "kanban-scope":
    skills:
  "kanban-plan":
    skills:
  "kanban-implement":
    skills:
  "kanban-save":
    skills:
  "kanban-codecheck":
    skills:
  "kanban-approve":
    skills:
  "kanban-docs":
    skills:
  "kanban-merge":
    skills:
  "kanban-rework":
    skills:
  "kanban-map-product":
    skills:
  "kanban-define-product":
    skills:

settings:
  version: "2.0"
  idPrefix: ""
  idPadding: 3
  archiveOnComplete: false
```

---

## Git History

The commit format makes your git history searchable:

```bash
# All commits for task 001
git log --grep="(001)"

# All feature commits
git log --grep="^feat"

# All verification retries
git log --grep="codecheck-retry"
```

Complete task lifecycle in git:
```
docs(001): create - Add user authentication     # on main
docs(001): refine - Add user authentication     # on main
docs(001): scope - Add user authentication      # creates task/001 branch
docs(001): plan - Add user authentication       # on task/001
wip(001): completed auth routes                 # optional, on task/001
docs(001): codecheck-retry - Add user auth...      # optional, if codecheck failed
docs(001): rework - Add user authentication     # optional, if QA/PR failed
feat(001): Add user authentication              # when QA passes, on task/001
docs(001): product - add authentication guide   # on task/001
# PR merged to main
docs(001): done - Add user authentication       # on main, task complete
```

---

## Helper Scripts

Claude Kanban includes helper scripts that the AI uses to reliably find files:

| Script | Purpose |
|--------|---------|
| `find-task.cjs` | Find task file by ID |
| `find-spec.cjs` | Find spec file by task ID |
| `find-plan.cjs` | Find plan file by task ID |
| `list-tasks.cjs` | List all tasks with optional filtering |
| `next-id.cjs` | Get next available task ID |
| `get-date-time.cjs` | Get formatted date/time strings |
| `list-product.cjs` | List all product docs with metadata |
| `search-product.cjs` | Search product docs by keywords |
| `check-product.cjs` | Check if product docs exist by ID |

Scripts are installed to `.claude/kanban-scripts/` and return JSON output.

See [scripts/README.md](.claude/kanban-scripts/README.md) for full documentation.

---

## Development

This section is for contributors or those who want to modify Claude Kanban.

### Prerequisites

- Node.js >= 18
- pnpm (`npm install -g pnpm`)

### Project Structure

```
claudeban/
├── src/
│   ├── content/                 # Markdown content (compiled with Handlebars)
│   │   ├── skills/              # Skill definitions (kanban-*/SKILL.md)
│   │   ├── partials/            # Shared template fragments
│   │   ├── kanban-templates/    # Document templates (copied as-is)
│   │   └── kanban-workflow.yaml # Workflow schema (copied as-is)
│   │
│   └── scripts/                 # Runtime helper scripts (TypeScript → CJS)
│       ├── find-task.ts
│       ├── find-spec.ts
│       └── ...
│
├── tools/
│   └── build.ts                 # Handlebars compilation build tool
│
├── dist/                        # Build output (generated, .gitignored)
│   ├── skills/                  # Compiled skills (no Handlebars syntax)
│   ├── scripts/*.cjs            # Compiled helper scripts
│   ├── tools/                   # Compiled build tools
│   ├── kanban-templates/        # Copied templates
│   └── kanban-workflow.yaml     # Copied schema
│
├── bin/
│   └── install.cjs              # Installer (reads from dist/)
│
├── turbo.json                   # Turborepo task configuration
├── tsdown.config.ts             # TypeScript bundler configuration
└── package.json
```

### Building

```bash
# Install dependencies
pnpm install

# Build everything (uses Turborepo for caching and parallelization)
pnpm run build

# Clean build artifacts
pnpm run clean
```

The build process:
1. **build:tools** - Compiles `tools/build.ts` to ESM in `dist/tools/`
2. **build:scripts** - Compiles `src/scripts/*.ts` to CJS (for Claude to run)
3. **build:content** - Runs Handlebars compilation on skills/commands, copies static files

Tasks 1 and 2 run in parallel. Task 3 depends on task 1.

### Handlebars Partials

Partials are shared template fragments in `src/content/partials/`. They reduce duplication across skills.

**Using a partial in a skill:**
```handlebars
{{> directory-reference}}

{{> user-skills command="refine" step_number="5"}}

{{> next-steps next_command="scope"}}
```

**Available partials:**

| Partial | Parameters | Purpose |
|---------|------------|---------|
| `directory-reference` | none | Standard directory reference section |
| `helper-scripts` | none | List of available helper scripts |
| `user-skills` | `command`, `step_number` | User skills loading instructions |
| `next-steps` | `next_command`, `no_id` | Required output format for next steps |
| `validation-intro` | none | Validation section header |
| `workflow-load` | `step_number` | Load workflow schema instruction |
| `branch-verify-main` | `step_number`, `reason` | Verify on main branch |
| `branch-verify-task` | `step_number` | Verify on task branch |

**Creating a new partial:**

1. Create `src/content/partials/my-partial.md`
2. Use it in skills with `{{> my-partial param="value"}}`
3. Run `pnpm run build`

### Modifying Skills

1. Edit the skill in `src/content/skills/kanban-*/SKILL.md`
2. Use partials for repeated sections
3. Run `pnpm run build`
4. Test with `node bin/install.cjs --local`

### Modifying Scripts

1. Edit the TypeScript file in `src/scripts/*.ts`
2. Run `pnpm run build`
3. Test the compiled script: `node dist/scripts/script-name.cjs`

### Testing Locally

```bash
# Build
pnpm run build

# Install to current directory
node bin/install.cjs --local

# Files are now in .claude/
# Test commands in Claude Code
```

### Publishing

```bash
# Build first
pnpm run build

# Publish (dist/ is included via package.json "files")
npm publish
```

---

## Product Documentation

Product documentation lives in `.kanban/product/` and represents the **current state** of your application. It serves as context for the AI when working on tasks.

### How It Works

1. **Task Creation:** When creating a task, the AI searches product docs for related features. Matching docs are linked via the `affects` field in the task.

2. **Task Refinement & Scoping:** The AI reads affected product docs to understand current behavior before planning changes.

3. **After Implementation:** During `/kanban-docs`, the AI updates existing docs or creates new ones based on what was built.

### Document Types

| Type | Purpose |
|------|---------|
| `overview` | Product overview (one per project) |
| `feature` | How a specific feature works |
| `concept` | Domain terms, business rules, mental models |

### The `affects` Field

Tasks link to product docs via the `affects` field in frontmatter:

```yaml
affects: [auth/login, auth/password-reset]  # Existing docs to UPDATE
affects: [payments/stripe]                   # New doc to CREATE
affects: []                                  # AI analyzes at doc time
```

When `affects` contains an ID for a doc that doesn't exist, the doc will be created during `/kanban-docs`.

---

## Philosophy

- **Branch isolation.** Task work happens on `task/{id}` branches, keeping main clean.
- **PR-based review.** Code merges via pull request for proper code review.
- **Commit at each phase.** Git history tells your task's story.
- **Each command is a stopping point.** Review, then continue.
- **Skills are mandatory guidance.** The AI must follow them.
- **Data lives with code.** Tasks are markdown in your repo.
- **Human in the loop.** You decide when to proceed.
- **Transparency over magic.** All state is in plain text files.
- **No auto-push.** You push when ready.
