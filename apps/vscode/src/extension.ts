/**
 * Claude Kanban VSCode Extension - Orchestrator
 *
 * Coordinates capabilities and computers to provide kanban task management.
 * Policy decisions (when/should) belong here, mechanism (how) in capabilities.
 */

import * as vscode from 'vscode';
import * as path from 'path';

// Computers (pure functions)
import { createTaskParserComputer } from './computers/task-parser.computer';
import { createTaskActionsComputer } from './computers/task-actions.computer';
import { createTaskGroupingComputer } from './computers/task-grouping.computer';

// Capabilities (mechanism)
import { createFileSystemCapability } from './capabilities/file-system.capability';
import { createTerminalCapability } from './capabilities/terminal.capability';
import { createTasksViewCapability } from './capabilities/tasks-view.capability';
import { createCodeLensCapability } from './capabilities/codelens.capability';

// Types
import type { Task } from './types/task-types';

/**
 * Find the .kanban folder in the workspace (policy decision).
 */
function findKanbanFolder(
  workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined,
  fs: ReturnType<typeof createFileSystemCapability>
): string | undefined {
  if (!workspaceFolders) {
    return undefined;
  }

  for (const folder of workspaceFolders) {
    const kanbanPath = fs.joinPath(folder.uri.fsPath, '.kanban');
    if (fs.exists(kanbanPath)) {
      return kanbanPath;
    }
  }

  return undefined;
}

/**
 * Extension activation - orchestrates all components.
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize computers
  const taskParser = createTaskParserComputer();
  const taskActions = createTaskActionsComputer();
  const taskGrouping = createTaskGroupingComputer();

  // Initialize capabilities
  const fs = createFileSystemCapability();
  const terminal = createTerminalCapability();

  // Policy: Find kanban folder
  const kanbanPath = findKanbanFolder(vscode.workspace.workspaceFolders, fs);

  if (!kanbanPath) {
    vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', false);
    return;
  }

  vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', true);

  const workspaceRoot = path.dirname(kanbanPath);

  // Policy: Load all tasks from kanban folder
  function loadAllTasks(): Task[] {
    const tasksDir = fs.joinPath(kanbanPath, 'tasks');
    if (!fs.exists(tasksDir)) {
      return [];
    }

    const tasks: Task[] = [];

    try {
      const entries = fs.readDir(tasksDir);

      for (const entry of entries) {
        const taskPath = fs.joinPath(tasksDir, entry);
        if (!fs.isDirectory(taskPath)) continue;

        const taskXml = fs.joinPath(taskPath, 'task.xml');
        if (fs.exists(taskXml)) {
          try {
            const content = fs.readFile(taskXml);
            const task = taskParser.parseTaskWithPath(content, taskPath);
            tasks.push(task);
          } catch (err) {
            console.error(`Failed to parse ${taskXml}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to read tasks directory:', err);
    }

    return tasks;
  }

  // Policy: Get task files for a task path
  function getTaskFiles(taskPath: string): string[] {
    const fileNames = ['task.xml', 'spec.xml', 'plan.xml'];
    const files: string[] = [];

    for (const name of fileNames) {
      const filePath = fs.joinPath(taskPath, name);
      if (fs.exists(filePath)) {
        files.push(filePath);
      }
    }

    return files;
  }

  // Policy: Parse task from URI
  function parseTaskFromUri(uri: vscode.Uri): Task | undefined {
    const taskPath = path.dirname(uri.fsPath);
    const taskXml = fs.joinPath(taskPath, 'task.xml');

    if (!fs.exists(taskXml)) {
      return undefined;
    }

    try {
      const content = fs.readFile(taskXml);
      return taskParser.parseTaskWithPath(content, taskPath);
    } catch {
      return undefined;
    }
  }

  // Initialize view capability with dependencies
  const tasksView = createTasksViewCapability({
    loadTasks: loadAllTasks,
    getColumns: taskGrouping.getColumns,
    groupByStatus: taskGrouping.groupByStatus,
    getVisibleColumns: taskGrouping.getVisibleColumns,
    getTaskFiles,
  });

  // Initialize codelens capability with dependencies
  const codelens = createCodeLensCapability({
    parseTaskFromUri,
    getActions: taskActions.getActions,
  });

  // Create providers
  const treeDataProvider = tasksView.createTreeDataProvider();
  const codeLensProvider = codelens.createCodeLensProvider();

  const refreshTree = tasksView.createRefreshCallback();
  const refreshCodeLens = codelens.createRefreshCallback();

  // Register TreeView
  const treeView = vscode.window.createTreeView('kanbanTasks', {
    treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Register CodeLens
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/.kanban/tasks/*/task.xml' },
      codeLensProvider
    )
  );

  // --- Commands (policy decisions) ---

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.refresh', () => {
      refreshTree();
      refreshCodeLens();
      vscode.window.showInformationMessage('Kanban tasks refreshed');
    })
  );

  // Open file command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.openFile', (args: { filePath: string }) => {
      if (args?.filePath) {
        const uri = vscode.Uri.file(args.filePath);
        vscode.window.showTextDocument(uri);
      }
    })
  );

  // Run action command (policy: when to run actions)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kanban.runAction',
      (args: { command: string; taskId: string }) => {
        if (!args?.command || !args?.taskId) {
          vscode.window.showErrorMessage('Invalid action arguments');
          return;
        }

        const kanbanTerminal = terminal.getOrCreateTerminal('Kanban', workspaceRoot);
        terminal.showTerminal(kanbanTerminal);
        terminal.sendCommand(kanbanTerminal, `claude "${args.command}"`);
      }
    )
  );

  // Create task command (policy: how to create tasks)
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.createTask', async () => {
      const title = await vscode.window.showInputBox({
        prompt: 'Enter task title',
        placeHolder: 'e.g., Add user authentication',
      });

      if (!title) {
        return;
      }

      const kanbanTerminal = terminal.getOrCreateTerminal('Kanban', workspaceRoot);
      terminal.showTerminal(kanbanTerminal);
      terminal.sendCommand(kanbanTerminal, `claude "/kanban-create ${title}"`);
    })
  );

  // --- File Watcher (policy: when to refresh) ---
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'tasks/**/*.xml')
  );

  watcher.onDidChange(() => {
    refreshTree();
    refreshCodeLens();
  });

  watcher.onDidCreate(() => {
    refreshTree();
    refreshCodeLens();
  });

  watcher.onDidDelete(() => {
    refreshTree();
    refreshCodeLens();
  });

  context.subscriptions.push(watcher);

  // --- Workspace changes (policy: when to prompt reload) ---
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newKanbanPath = findKanbanFolder(vscode.workspace.workspaceFolders, fs);
      if (newKanbanPath !== kanbanPath) {
        vscode.window
          .showInformationMessage(
            'Workspace changed. Reload to update Kanban extension?',
            'Reload'
          )
          .then((selection) => {
            if (selection === 'Reload') {
              vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
          });
      }
    })
  );

  console.log('Claude Kanban extension activated');
}

/**
 * Extension deactivation.
 */
export function deactivate(): void {
  console.log('Claude Kanban extension deactivated');
}
