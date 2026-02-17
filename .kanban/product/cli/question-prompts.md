---
id: "cli/question-prompts"
title: "Question Prompts"
type: feature
summary: "Keyboard-navigable interactive prompts for kanban skill workflows"
keywords: [prompts, keyboard, navigation, AskUserQuestion, interactive, selection]
related: []
updated: 2026-02-17
---

# Question Prompts

## Overview

Question Prompts provide keyboard-navigable interactive selection for kanban skill workflows. When a skill needs user input with predefined options, prompts appear as selectable lists navigated with arrow keys and confirmed with Enter.

## How It Works

1. Skill reaches a decision point requiring user input
2. System presents options as an interactive list
3. User navigates with arrow keys (up/down) and confirms with Enter
4. Workflow continues with selected option

### Key Workflows

**Option Selection:**
- Arrow up/down to highlight desired option
- Enter to confirm selection
- "Other" option available for custom input when needed

**Confirmation Prompts:**
- Yes/No options presented as selectable list
- Recommended option appears first with "(Recommended)" suffix
- No typing required for standard confirmations

## Key Concepts

- **Keyboard Navigation**: Using arrow keys to move between options instead of typing responses
- **Structured Options**: Predefined choices with labels and descriptions
- **Dynamic Options**: Options populated from data (e.g., task lists) at runtime

## Prompt Types

| Type | Example | Options |
|------|---------|---------|
| Confirmation | "Proceed with documentation?" | Yes, No |
| Multi-choice | "Which view preset?" | Quick, Full, Custom |
| Task selection | "Which task to scope?" | Dynamic list of available tasks |
| Priority | "What priority?" | High, Medium, Low |

## Interactions

- **All Kanban Skills**: Skills with decision points use keyboard prompts
- **AskUserQuestion Tool**: Underlying Claude Code tool that renders prompts

## Limitations

- Maximum 4 options per prompt (plus automatic "Other" for custom input)
- Option header limited to 12 characters
- Prompts requiring free-form text (e.g., task titles) remain as typed input
- 60-second timeout on prompts (click "Type something else..." to pause)
