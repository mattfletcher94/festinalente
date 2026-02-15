---
name: view
description: Visualize the Kanban board in the terminal with box-drawing characters
skill: .claude/skills/kanban-view/SKILL.md
allowed-tools: Read, Glob, Grep
---

# Kanban Board View

> **Skill Reference:** This command invokes `.claude/skills/kanban-view/SKILL.md`
> You MUST read and follow the instructions in that skill file.

Display the Kanban board as a visual terminal output with box-drawing characters.

## Usage

`/kanban:view` - Show visual board (asks for view preset)

## Workflow

1. Invoke the **kanban-view** skill
2. Skill asks user for view preset (Quick/Full/Custom)
3. Skill reads task files and renders the board

## Example

`/kanban:view`

Displays the board grouped by column with box borders.
