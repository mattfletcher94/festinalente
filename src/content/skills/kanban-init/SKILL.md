---
name: kanban-init
description: Initialize kanban board structure in current project
allowed-tools: Read, Write, Bash(ls *, mkdir *, git status)
---

# Initialize Kanban Board

Create the `.kanban/` directory structure for a new project.

## Directory Reference
- **`.claude/`** — System config (workflow, templates, skills) — READ ONLY
- **`.kanban/`** — Project data (tasks, specs, plans, product docs) — READ/WRITE

## Steps

1. **Check if already initialized**:
   - Check if `.kanban/` directory exists
   - If exists, ask user: "Kanban already initialized. Reinitialize? (This will NOT delete existing tasks)"
   - If user declines, exit

2. **Check for git repository**:
   - Run `git status` to verify we're in a git repo
   - If not a git repo, warn: "Not a git repository. Kanban works best with git for commit tracking."
   - Ask if user wants to continue anyway

3. **Create directory structure**:
   ```bash
   mkdir -p .kanban/tasks
   mkdir -p .kanban/specs
   mkdir -p .kanban/plans
   mkdir -p .kanban/product
   mkdir -p .kanban/skills
   ```

4. **Create config.yaml**:
   - Read template from `.claude/kanban-templates/config.yaml`
   - Write to `.kanban/config.yaml` **exactly as-is** (do not modify or add properties)
   - If template not found, create minimal config **exactly as shown below**:

   **CRITICAL: Do NOT add, invent, or improvise any properties not shown in the template.**
   The config.yaml schema has exactly three top-level keys: `name`, `user-skills`, `settings`.
   Do NOT add keys like `verification`, `checks`, `hooks`, `commands`, or anything else.
     ```yaml
     # Skill names resolve to .claude/skills/{name}/SKILL.md
     name: My Project

     user-skills:
       "kanban:create":
         skills:
       "kanban:refine":
         skills:
       "kanban:scope":
         skills:
       "kanban:plan":
         skills:
       "kanban:implement":
         skills:
       "kanban:save":
         skills:
       "kanban:verify":
         skills:
       "kanban:approve":
         skills:
       "kanban:docs":
         skills:
       "kanban:merge":
         skills:
       "kanban:rework":
         skills:
       "kanban:map-product":
         skills:
       "kanban:define-product":
         skills:

     settings:
       version: "2.0"
       idPrefix: ""
       idPadding: 3
       archiveOnComplete: false
     ```

5. **Confirm initialization**:
   - Print created directories
   - Print config location
   - Suggest next steps

## File Naming Conventions

**IMPORTANT:** When working with kanban files, always glob/search first to discover existing naming conventions rather than guessing.

| Directory | File Pattern | Example |
|-----------|-------------|---------|
| `.kanban/tasks/` | `{id}-{slug}.md` | `001-add-login.md` |
| `.kanban/specs/` | `{id}-{slug}.spec.md` | `001-add-login.spec.md` |
| `.kanban/plans/` | `{id}-{slug}.plan.md` | `001-add-login.plan.md` |
| `.kanban/product/` | `{feature}.md` | `authentication.md` |
| `.kanban/skills/` | `{name}.md` | `check-typescript.md` |

User-defined skills in `.kanban/skills/` are simple `.md` files (NOT directories with `SKILL.md` inside).

## Validation

**STOP. You MUST verify ALL items pass before declaring success. Do not skip validation.**

All must pass. If any fail, fix and retry.

- [ ] `.kanban/` directory exists
- [ ] `.kanban/tasks/` directory exists
- [ ] `.kanban/specs/` directory exists
- [ ] `.kanban/plans/` directory exists
- [ ] `.kanban/product/` directory exists
- [ ] `.kanban/skills/` directory exists
- [ ] `.kanban/config.yaml` exists
- [ ] `.kanban/config.yaml` has ONLY these top-level keys: `name`, `user-skills`, `settings` (no extra keys)

## Arguments

- `$ARGUMENTS` - None expected

## Example

User: `/kanban:init`

```
Initializing kanban board...

Created directories:
- .kanban/tasks/
- .kanban/specs/
- .kanban/plans/
- .kanban/product/
- .kanban/skills/

Created config:
- .kanban/config.yaml

Kanban initialized!

Next steps:
- Define your product: /kanban:define-product
- Or map existing code: /kanban:map-product
- Or create a task: /kanban:create "Your first task"
```

## Next Steps

For new projects:
```
/clear
/kanban:define-product
```

For existing codebases:
```
/clear
/kanban:map-product
```

Or skip product discovery and create a task:
```
/clear
/kanban:create "Task title"
```
