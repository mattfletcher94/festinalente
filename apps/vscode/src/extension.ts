/**
 * Claude Kanban VSCode Extension
 *
 * AI-powered task management for Claude Code.
 * Provides a sidebar TreeView, CodeLens actions, and integrated terminal.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TaskTreeProvider } from './tasks/task-tree-provider';
import { KanbanCodeLensProvider } from './editor/codelens-provider';
import { runKanbanAction } from './terminal/kanban-terminal';

/**
 * Find the .kanban folder in the workspace.
 */
function findKanbanFolder(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return undefined;
  }

  for (const folder of workspaceFolders) {
    const kanbanPath = path.join(folder.uri.fsPath, '.kanban');
    if (fs.existsSync(kanbanPath)) {
      return kanbanPath;
    }
  }

  return undefined;
}

/**
 * Get workspace root from kanban path.
 */
function getWorkspaceRoot(kanbanPath: string): string {
  return path.dirname(kanbanPath);
}

/**
 * Extension activation.
 */
export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Claude Kanban');
  output.appendLine('Claude Kanban extension activating...');

  const workspaceFolders = vscode.workspace.workspaceFolders;
  output.appendLine(`Workspace folders: ${workspaceFolders?.length ?? 0}`);

  if (workspaceFolders) {
    for (const folder of workspaceFolders) {
      output.appendLine(`  - ${folder.uri.fsPath}`);
      const kanbanCheck = path.join(folder.uri.fsPath, '.kanban');
      output.appendLine(`    Checking: ${kanbanCheck}`);
      output.appendLine(`    Exists: ${fs.existsSync(kanbanCheck)}`);
    }
  }

  const kanbanPath = findKanbanFolder();

  if (!kanbanPath) {
    output.appendLine('No .kanban folder found, extension inactive');
    vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', false);
    return;
  }

  output.appendLine(`Found .kanban folder at: ${kanbanPath}`);

  // Set context for "when" clauses
  vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', true);

  const workspaceRoot = getWorkspaceRoot(kanbanPath);

  // --- TreeView ---
  const treeProvider = new TaskTreeProvider(kanbanPath);
  const treeView = vscode.window.createTreeView('kanbanTasks', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // --- CodeLens ---
  const codeLensProvider = new KanbanCodeLensProvider(kanbanPath);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/.kanban/tasks/*/task.xml' },
      codeLensProvider
    )
  );

  // --- Commands ---

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.refresh', () => {
      treeProvider.refresh();
      codeLensProvider.refresh();
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

  // Run action command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kanban.runAction',
      (args: { command: string; taskId: string }) => {
        if (!args?.command || !args?.taskId) {
          vscode.window.showErrorMessage('Invalid action arguments');
          return;
        }

        const autoplay = vscode.workspace.getConfiguration('kanban').get<boolean>('autoplay');

        runKanbanAction(workspaceRoot, args.command, args.taskId, () => {
          // On completion
          treeProvider.refresh();
          codeLensProvider.refresh();

          if (autoplay) {
            vscode.window.showInformationMessage(
              `Task ${args.taskId} stage complete. Autoplay enabled.`
            );
            // Note: Full autoplay (running next action) would require
            // re-parsing the task and determining the new action
          }
        });
      }
    )
  );

  // Create task command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.createTask', async () => {
      const title = await vscode.window.showInputBox({
        prompt: 'Enter task title',
        placeHolder: 'e.g., Add user authentication',
      });

      if (!title) {
        return; // User cancelled
      }

      runKanbanAction(workspaceRoot, `/kanban-create ${title}`, 'new', () => {
        treeProvider.refresh();
        codeLensProvider.refresh();
        vscode.window.showInformationMessage(`Task created: ${title}`);
      });
    })
  );

  // --- File Watcher ---
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'tasks/**/*.xml')
  );

  watcher.onDidChange(() => {
    treeProvider.refresh();
    codeLensProvider.refresh();
  });

  watcher.onDidCreate(() => {
    treeProvider.refresh();
    codeLensProvider.refresh();
  });

  watcher.onDidDelete(() => {
    treeProvider.refresh();
    codeLensProvider.refresh();
  });

  context.subscriptions.push(watcher);

  // --- Watch for workspace changes ---
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      // Re-check for kanban folder
      const newKanbanPath = findKanbanFolder();
      if (newKanbanPath !== kanbanPath) {
        // Reload the extension by showing a prompt
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
