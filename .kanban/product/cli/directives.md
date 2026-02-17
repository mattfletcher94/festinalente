---
id: cli/directives
title: "Custom Directives"
type: feature
summary: "Hook-based extension system for attaching custom AI instructions to workflow commands"
keywords: [directives, hooks, config, customization, codecheck, instructions]
related: [cli/task-workflow, cli/commands]
updated: 2026-02-17
---

# Custom Directives

## Overview

Directives are custom instructions that the AI follows at specific hooks (extension points) in the workflow. They enable project-specific rules, coding standards, and automated checks.

## How It Works

1. User creates a directive in `.kanban/directives/{name}/DIRECTIVE.md`
2. User configures `.kanban/config.yaml` to attach directive to a hook
3. When the hook runs, AI reads and follows the directive instructions
4. Directives are MANDATORY - the AI must follow them

### Key Workflows

**Adding a directive:**
1. Create folder: `.kanban/directives/my-directive/`
2. Create file: `DIRECTIVE.md` with frontmatter and instructions
3. Edit `.kanban/config.yaml` to attach to hook(s)

**Directive types:**

**Command-based directive:**
```markdown
# TypeScript Check
Run `pnpm typecheck`
## Pass criteria
Exit code 0, no errors in output.
```

**Guideline directive:**
```markdown
# Coding Standards
- Use factory functions instead of classes
- Keep files under 300 lines
```

## Key Concepts

- **Hook**: An extension point in the workflow (e.g., `kanban-codecheck`, `kanban-implement`)
- **Directive**: Custom instructions in a DIRECTIVE.md file
- **Context docs**: Product/engineering docs attached for guidance (not mandatory)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `hooks.{command}.directives` | List of directive names to run | `[]` |
| `hooks.{command}.product` | Product doc IDs for context | `[]` |
| `hooks.{command}.engineering` | Engineering doc IDs for context | `[]` |

## Interactions

- **Codecheck**: Common hook for attaching lint, type, and test directives
- **Implement**: Attach coding standards and architecture guidelines
- **Plan**: Attach architecture constraints

## Limitations

- Directives are per-hook, not per-task
- AI must have access to run any commands specified in directives
