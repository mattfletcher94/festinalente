# Claude Kanban - VSCode Extension

AI-powered task management for Claude Code.

## Features

- **Task Sidebar**: TreeView showing tasks grouped by status (In Progress, Planned, Backlog, etc.)
- **CodeLens Actions**: Run kanban skills directly from task.xml files
- **Integrated Terminal**: Execute Claude commands with output capture
- **Auto-refresh**: File watcher updates task list when files change

## Usage

1. Open a folder containing a `.kanban/` directory
2. Click the Kanban icon in the Activity Bar
3. Browse tasks grouped by status
4. Click on a task file to open it
5. Use CodeLens buttons to run actions (Scope, Plan, Implement, etc.)

## Development

```bash
# From monorepo root
pnpm vscode:compile   # Compile TypeScript
pnpm vscode:watch     # Watch mode
pnpm vscode:package   # Create .vsix

# Or press F5 to launch Extension Development Host
```
