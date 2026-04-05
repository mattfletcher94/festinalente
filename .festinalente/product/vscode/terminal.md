---
id: vscode/terminal
title: "Terminal Integration"
type: feature
tldr: "Fresh terminal per command ensures clean Claude context"
summary: "Terminal integration spawns a fresh terminal for each skill invocation, preventing context pollution between sessions and enabling YOLO mode for unattended execution."
keywords: [terminal, fresh, context, clean, yolo, session]
aliases: [terminal-manager, fresh-terminal]
boundary: "Does not manage external terminals - VSCode integrated only"
references: [vscode/codelens]
uses: [systems/vscode-extension]
intent: procedural
prerequisites: []
---

# Terminal Integration

> **TL;DR:** Fresh terminal per command ensures clean Claude context

## Overview

Each skill invocation from CodeLens or command palette spawns a fresh terminal. This ensures Claude starts with clean context rather than inheriting previous session state.

**Summary:** Fresh terminals prevent context pollution.

<!-- Tier 2 boundary: content above this line is loaded at standard tier -->

## Features

- **Fresh per command**: New terminal for each skill
- **Auto-naming**: Terminal named for the command
- **YOLO mode**: Optional unattended execution

## YOLO Mode

When enabled, skills run without prompts:
- No confirmation dialogs
- Auto-approve safe operations
- Still pauses for destructive actions

## Boundaries

- **Does NOT:** Reuse existing terminals
- **Does NOT:** Run in external terminal apps
