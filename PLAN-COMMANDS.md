# Plan: Eliminate Commands in Favor of Skills

## Quick Reference (TL;DR)

**Goal**: Remove the commands layer entirely. Skills now provide autocomplete.

**Before**: `/kanban:create` (command delegates to skill)
**After**: `/kanban-create` (skill only)

**Key changes**:
1. Add `argument-hint` and `disable-model-invocation: true` to all 16 existing skills
2. Create 3 new skills from report commands (kanban-report-label, kanban-report-task, kanban-report-user)
3. Update `tools/build.ts` - remove command compilation (lines 134-137)
4. Update `bin/install.cjs` - remove `'commands/kanban'` from KANBAN_PATHS
5. Search/replace `/kanban:` → `/kanban-` in all skills, partials, README
6. Delete `src/content/commands/` directory

**Files to edit**: See Phase 1-6 for exact line numbers and code snippets.

---

## Background

This document plans the migration from a dual command/skill system to a skills-only system.

### Current State

The claude-kanban system currently has **two layers**:

1. **Commands** (`src/content/commands/kanban/*.md`) - 19 thin wrapper files
2. **Skills** (`src/content/skills/kanban-*/SKILL.md`) - 16 detailed instruction files

Commands exist primarily for one reason: **autocomplete in the Claude Code console**. They allow users to type `/kanban:create` and see it in the menu.

### Why Commands Were Needed (Historical)

Previously, Claude Code had a distinction:
- **Commands**: User-invokable via `/name`, appeared in autocomplete menu
- **Skills**: AI-discoverable, loaded automatically when relevant

### Why Commands Are Now Redundant

As of Claude Code v2.1.3 (January 2026), **skills and commands merged**:
- Skills appear in the `/` autocomplete menu by default (`user-invocable: true`)
- Skills can be invoked as `/skill-name` just like commands
- Skills support `argument-hint` for showing expected arguments in autocomplete
- A skill at `.claude/skills/kanban-create/SKILL.md` creates `/kanban-create` command

**Source**: [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)

---

## Socratic Analysis

### Q1: What value do commands currently provide that skills don't?

**Answer**: Based on my analysis of the codebase:

| Feature | Commands | Skills |
|---------|----------|--------|
| Autocomplete menu | ✅ | ✅ (as of v2.1.3) |
| `/name` invocation | ✅ | ✅ |
| `argument-hint` | ✅ | ✅ |
| `allowed-tools` | ✅ | ✅ |
| Supporting files | ❌ | ✅ |
| Auto-loading by AI | ❌ | ✅ |
| `disable-model-invocation` | ❌ | ✅ |

**Conclusion**: Commands provide no unique value. Skills have feature parity plus additional capabilities.

---

### Q2: What is the current relationship between commands and skills?

**Answer**: Commands are thin wrappers that delegate to skills.

Example from `create.md`:
```yaml
---
name: create
skill: .claude/skills/kanban-create/SKILL.md
---
# Create Kanban Task
> **Skill Reference:** This command invokes `.claude/skills/kanban-create/SKILL.md`
> You MUST read and follow the instructions in that skill file.
```

The command does almost nothing - it just points to the skill. This is pure overhead.

**Note**: Commands contain only brief summaries (branch requirements, workflow overview, examples). Skills already contain all this information in greater detail. No content migration needed - we can safely delete commands without losing any information.

---

### Q3: What naming convention should skills use?

**Current commands**: `/kanban:create`, `/kanban:refine`, etc.
**Current skills**: `kanban-create`, `kanban-refine`, etc.

**Question**: Should we keep the `kanban:` prefix or use `kanban-`?

**Options**:

| Option | Invocation | Pros | Cons |
|--------|------------|------|------|
| A. `kanban-create` | `/kanban-create` | Simple, standard | Loses visual namespace grouping |
| B. Keep current | `/kanban:create` | Familiar to users | Requires commands layer |
| C. Directory namespace | `/kanban/create` | Uses skill directory structure | Not supported by Claude Code |

**Decision needed**: Which naming convention to adopt?

**Recommendation**: Option A (`kanban-create`) because:
1. It's the existing skill naming convention
2. Claude Code skills don't support `:` in names (it's a command-layer feature)
3. Users can still easily identify kanban commands by prefix

---

### Q4: What changes are needed to skill files?

**Current skill frontmatter** (kanban-create):
```yaml
---
name: kanban-create
description: Create a new task in the kanban board and commit...
allowed-tools: Read, Write, Bash(...), Grep
---
```

**Required additions** to match command features:
```yaml
---
name: kanban-create
description: Create a new task in the kanban board and commit...
allowed-tools: Read, Write, Bash(...), Grep
argument-hint: "[task title]"           # NEW: From commands
disable-model-invocation: true          # NEW: User-triggered only
---
```

**Changes needed per skill**:
- Add `argument-hint` (copy from corresponding command)
- Add `disable-model-invocation: true`

Note: `user-invocable` defaults to `true`, so we don't need to specify it.

---

### Q5: Which skills should disable model invocation?

**Decision**: ALL skills should have `disable-model-invocation: true`.

**Rationale**:
- All kanban skills are workflow actions that the user explicitly triggers
- Skills reference other skills in "Next Steps" output, but these are **text suggestions** for the user, not AI auto-invocations
- Users want full control over when kanban actions run

| Skill | Recommendation |
|-------|----------------|
| ALL 19 skills | `disable-model-invocation: true` |

---

### Q6: What about the three report commands that don't have skills?

Looking at the command list:
- `report-label.md` - No corresponding skill
- `report-task.md` - No corresponding skill
- `report-user.md` - No corresponding skill

**Analysis**: These commands are **NOT thin wrappers**. They contain complete logic:

| Command | Purpose | Side Effects |
|---------|---------|--------------|
| `report-label` | Query tasks by label (bug, feature, etc.) | None (read-only) |
| `report-task` | Query specific task's history and state | None (read-only) |
| `report-user` | Query tasks a git user has worked on | None (read-only) |

**Content summary**:
- `report-label`: Searches `.kanban/tasks/*.md` for label matches, answers NL questions
- `report-task`: Gathers task file + spec + plan + git history, answers NL questions
- `report-user`: Uses `git log --author` to find tasks user touched, answers NL questions

**Decision**: These need to be converted to proper skills.

**Decision**:
1. Create `kanban-report-label/SKILL.md`, `kanban-report-task/SKILL.md`, `kanban-report-user/SKILL.md`
2. Copy content from commands (they already have complete logic)
3. Add frontmatter with `disable-model-invocation: true` (consistent with all other skills)

---

### Q7: What build system changes are needed?

**Current build process**:
```
src/content/commands/kanban/*.md  →  dist/commands/kanban/*.md
src/content/skills/kanban-*/      →  dist/skills/kanban-*/
```

**New build process**:
```
src/content/skills/kanban-*/      →  dist/skills/kanban-*/
(commands directory removed)
```

**Files to modify**:
1. `tools/build.ts` - Remove command compilation
2. `bin/install.cjs` - Remove commands from KANBAN_PATHS
3. Delete `src/content/commands/` directory

Note: `package.json` has no command references - no changes needed.

---

### Q8: What documentation changes are needed?

**Files to update**:
1. `README.md` - Update invocation examples (e.g., `/kanban-create` instead of `/kanban:create`)
2. Skill files - Update any references to `/kanban:*` commands
3. `PLAN.md` - Note the change

**Example changes**:
```diff
- Next: /kanban:refine {id}
+ Next: /kanban-refine {id}
```

---

## Implementation Plan

### Phase 1: Prepare Skills

For each of the 16 existing skills, update frontmatter:

1. [ ] Add `argument-hint` (copy from corresponding command file)
2. [ ] Add `disable-model-invocation: true`

**Argument hints to add** (from commands):

| Skill | argument-hint |
|-------|---------------|
| kanban-approve | `"[task-id]"` |
| kanban-create | `"[task title]"` |
| kanban-define-product | (none) |
| kanban-docs | `"[task-id]"` |
| kanban-implement | `"[task-id]"` |
| kanban-init | (none) |
| kanban-map-product | (none) |
| kanban-merge | `"[task-id]"` |
| kanban-plan | `"[task-id]"` |
| kanban-refine | `"[task-id]"` |
| kanban-rework | `"[task-id]"` |
| kanban-save | `"[task-id]"` |
| kanban-scope | `"[task-id]"` |
| kanban-status | (none) |
| kanban-verify | `"[task-id]"` |
| kanban-view | `"[task-id]"` |

### Phase 2: Create Report Skills

Create new skill directories and files.

**Directory structure to create**:
```
src/content/skills/
├── kanban-report-label/
│   └── SKILL.md
├── kanban-report-task/
│   └── SKILL.md
└── kanban-report-user/
    └── SKILL.md
```

**1. Create `kanban-report-label/SKILL.md`**:
```yaml
---
name: kanban-report-label
description: Query tasks filtered by label (bug, feature, docs, refactor)
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{label} [question]"
disable-model-invocation: true
---

# Report Label

[Copy remaining content from src/content/commands/kanban/report-label.md]
[Update /kanban:report-label → /kanban-report-label in examples]
```

**2. Create `kanban-report-task/SKILL.md`**:
```yaml
---
name: kanban-report-task
description: Query a specific task's history and current state
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{id} [question]"
disable-model-invocation: true
---

# Report Task

[Copy remaining content from src/content/commands/kanban/report-task.md]
[Update /kanban:report-task → /kanban-report-task in examples]
```

**3. Create `kanban-report-user/SKILL.md`**:
```yaml
---
name: kanban-report-user
description: Query what tasks a git user has worked on
allowed-tools: Read, Glob, Grep, Bash(git log *)
argument-hint: "{name} [question]"
disable-model-invocation: true
---

# Report User

[Copy remaining content from src/content/commands/kanban/report-user.md]
[Update /kanban:report-user → /kanban-report-user in examples]
```

**Note**: The command files have content AFTER the frontmatter (Usage, Workflow, Examples sections). Copy everything after the `---` closing the frontmatter.

### Phase 3: Update Build System

**File**: `tools/build.ts`

**Current structure** (lines 129-137):
```typescript
// Compile skills
console.log('\n2. Compiling skills...');
const skillCount = await compileDirectory('skills');
console.log(`  Compiled ${skillCount} skill files`);

// Compile commands
console.log('\n3. Compiling commands...');
const commandCount = await compileDirectory('commands');
console.log(`  Compiled ${commandCount} command files`);
```

**Changes needed**:
1. [ ] Remove lines 134-137 (the command compilation block)
2. [ ] Renumber remaining steps (step 3 becomes copying templates, etc.)
3. [ ] Update console output messages accordingly

**Verification**:
```bash
pnpm run build:content
# Should only show skills, templates, workflow - no commands
ls dist/
# Should NOT contain commands/ directory
```

### Phase 4: Update Installer

**File**: `bin/install.cjs`

**Current KANBAN_PATHS array** (lines 28-36):
```javascript
const KANBAN_PATHS = [
  'commands/kanban',      // <-- REMOVE THIS LINE
  'skills/kanban-',
  'kanban-templates',
  'kanban-workflow.yaml',
  'kanban-manifest.json',
  'kanban-local-patches',
  'scripts/'
];
```

**Changes needed**:
1. [ ] Remove `'commands/kanban'` from `KANBAN_PATHS` array (line 29)
2. [ ] Update help text (line 277): Change `/kanban:init` to `/kanban-init`

**Verification**:
```bash
npx . --local
ls .claude/
# Should have skills/, scripts/, kanban-templates/, kanban-workflow.yaml
# Should NOT have commands/
```

### Phase 5: Update References

**Total occurrences of `/kanban:`**: 106 in skills + partials + README

**1. Update Handlebars partial** (critical - fixes all skills using this partial):

**File**: `src/content/partials/next-steps.md`
```diff
- /kanban:{{next_command}}{{#unless no_id}} \{id\}{{/unless}}
+ /kanban-{{next_command}}{{#unless no_id}} \{id\}{{/unless}}
```

**2. Update skills manually** (occurrences not using the partial):

Search and replace in all files under `src/content/skills/`:
```
Find:    /kanban:
Replace: /kanban-
```

Files with occurrences (16 files, ~106 total):
- kanban-approve/SKILL.md (8)
- kanban-create/SKILL.md (5)
- kanban-define-product/SKILL.md (2)
- kanban-docs/SKILL.md (11)
- kanban-implement/SKILL.md (12)
- kanban-init/SKILL.md (7)
- kanban-map-product/SKILL.md (2)
- kanban-merge/SKILL.md (5)
- kanban-plan/SKILL.md (5)
- kanban-refine/SKILL.md (3)
- kanban-rework/SKILL.md (7)
- kanban-save/SKILL.md (6)
- kanban-scope/SKILL.md (4)
- kanban-status/SKILL.md (17)
- kanban-verify/SKILL.md (10)
- kanban-view/SKILL.md (2)

**3. Update README.md**:

Search and replace:
```
Find:    /kanban:
Replace: /kanban-
```

**4. Update GUIDE.md** (if exists):

Search and replace same pattern.

**5. `kanban-workflow.yaml`**: ✅ No changes needed (no command references found)

### Phase 6: Remove Commands

1. [ ] Delete entire `src/content/commands/` directory (19 files)
   ```bash
   rm -rf src/content/commands/
   ```
   **Note**: No content migration needed. Commands are thin wrappers - skills already contain all information in greater detail.

2. [ ] Verify no command-specific partials exist
   - Checked: All 8 partials in `src/content/partials/` are skill-related, not command-specific
   - No partials need to be removed

3. [ ] Clean up any dist artifacts
   ```bash
   rm -rf dist/commands/
   ```

### Phase 7: Testing

1. [ ] Run build: `pnpm run compile`
2. [ ] Fresh install: `npx . --local`
3. [ ] Verify all `/kanban-*` skills appear in autocomplete
4. [ ] Test a few skills work correctly (init, create, status)

---

## Decisions Made

1. **Naming**: ✅ Use `/kanban-create` (hyphen, not colon)
2. **Reports**: ✅ Convert to proper skills (`kanban-report-label`, `kanban-report-task`, `kanban-report-user`)
3. **Model Invocation**: ✅ ALL skills get `disable-model-invocation: true` (user-triggered only)
4. **Breaking Changes**: ✅ Allowed - no backward compatibility support
5. **No Migration**: ✅ Users with old installs must reinstall fresh

---

## Appendix: File Inventory

### Commands to Remove (19 files)
```
src/content/commands/kanban/
├── approve.md
├── create.md
├── define-product.md
├── docs.md
├── implement.md
├── init.md
├── map-product.md
├── merge.md
├── plan.md
├── refine.md
├── report-label.md
├── report-task.md
├── report-user.md
├── rework.md
├── save.md
├── scope.md
├── status.md
├── verify.md
└── view.md
```

### Skills to Update (16 existing + 3 new = 19 total)

**Existing skills to update**:
```
src/content/skills/
├── kanban-approve/SKILL.md
├── kanban-create/SKILL.md
├── kanban-define-product/SKILL.md
├── kanban-docs/SKILL.md
├── kanban-implement/SKILL.md
├── kanban-init/SKILL.md
├── kanban-map-product/SKILL.md
├── kanban-merge/SKILL.md
├── kanban-plan/SKILL.md
├── kanban-refine/SKILL.md
├── kanban-rework/SKILL.md
├── kanban-save/SKILL.md
├── kanban-scope/SKILL.md
├── kanban-status/SKILL.md
├── kanban-verify/SKILL.md
└── kanban-view/SKILL.md
```

**New skills to create** (from report commands):
```
src/content/skills/
├── kanban-report-label/SKILL.md   (NEW)
├── kanban-report-task/SKILL.md    (NEW)
└── kanban-report-user/SKILL.md    (NEW)
```

---

## Status

**Current Phase**: Ready for Implementation

**Decisions Made**:
- [x] Naming convention: `/kanban-*` (hyphen)
- [x] Report commands: Convert to skills
- [x] Model invocation: All skills `disable-model-invocation: true`
- [x] Breaking changes: Allowed

**Next Action**: Begin Phase 1 - Prepare Skills
