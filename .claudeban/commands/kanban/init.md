---
name: init
description: Initialize kanban board structure in current project
skill: .claudeban/skills/kanban-init/SKILL.md
allowed-tools: Read, Write, Bash(ls *, mkdir *, git status)
argument-hint: (no arguments)
---

# Initialize Kanban Board

> **Skill Reference:** This command invokes `.claudeban/skills/kanban-init/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Create the `.kanban/` directory structure for a new project.

## Usage

`/kanban:init`

## Workflow

1. Invoke the **kanban-init** skill
2. Skill handles directory creation, config setup, and confirmation

## What Gets Created

```
.kanban/
├── config.yaml    # Board configuration (from template)
├── tasks/         # Task files
├── specs/         # Functional specifications
├── plans/         # Implementation plans
├── product/       # Product documentation
└── skills/        # Project-specific verification checks (files named {name}.md)
```

## Example

`/kanban:init`

Creates the kanban directory structure and confirms setup.
