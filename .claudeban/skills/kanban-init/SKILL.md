---
name: kanban-init
description: Initialize kanban board structure in current project
allowed-tools: Read, Write, Bash(ls *, mkdir *, git status)
---

# Initialize Kanban Board

Create the `.kanban/` directory structure for a new project.

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
   - Read template from `.claudeban/templates/config.yaml`
   - Write to `.kanban/config.yaml`
   - If template not found, create minimal config:
     ```yaml
     name: My Project

     commands:
       "kanban:define-task":
         skills: []
       "kanban:backlog-refine-task":
         skills: []
       "kanban:refined-scope-task":
         skills: []
       "kanban:scoped-plan-task":
         skills: []
       "kanban:planned-implement-task":
         skills: []
       "kanban:in-progress-wip-commit":
         skills: []
       "kanban:in-progress-verify-task":
         skills: []
       "kanban:verify-pass-task":
         skills: []
       "kanban:verify-fail-task":
         skills: []
       "kanban:review-pass-task":
         skills: []
       "kanban:review-fail-task":
         skills: []
       "kanban:update-docs-complete-task":
         skills: []
       "kanban:map-product":
         skills: []
       "kanban:define-product":
         skills: []

     settings:
       version: "2.0"
       idPrefix: ""
       idPadding: 3
       archiveOnComplete: false
       productDocsPath: ".kanban/product"
     ```

5. **Confirm initialization**:
   - Print created directories
   - Print config location
   - Suggest next steps

## Validation

All must pass. If any fail, fix and retry.

- [ ] `.kanban/` directory exists
- [ ] `.kanban/tasks/` directory exists
- [ ] `.kanban/specs/` directory exists
- [ ] `.kanban/plans/` directory exists
- [ ] `.kanban/product/` directory exists
- [ ] `.kanban/skills/` directory exists
- [ ] `.kanban/config.yaml` exists

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
- Or create a task: /kanban:define-task "Your first task"
```

## Next Steps

For new projects:
```
/kanban:define-product
```

For existing codebases:
```
/kanban:map-product
```

To create a task:
```
/kanban:define-task "Task title"
```
