/**
 * Claude Kanban VSCode Extension - Composition Root
 *
 * Thin entry point that wires domain orchestrators together.
 * All policy decisions are delegated to domain orchestrators.
 */

import * as vscode from 'vscode';
import * as path from 'path';

// Shared capabilities
import { createFileSystemCapability } from './capabilities/file-system.capability';

// Domain orchestrators
import { createTerminalOrchestrator } from './orchestrators/terminal.orchestrator';
import { createTasksOrchestrator } from './orchestrators/tasks.orchestrator';
import { createQuicksOrchestrator } from './orchestrators/quicks.orchestrator';
import { createDocsOrchestrator } from './orchestrators/docs.orchestrator';
import { createConfigOrchestrator } from './orchestrators/config.orchestrator';

/**
 * Find the .kanban folder in the workspace.
 *
 * @param workspaceFolders - VSCode workspace folders.
 * @param fs - File system capability.
 * @returns Path to .kanban folder or undefined if not found.
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
 * Extension activation - composes and wires domain orchestrators.
 *
 * @param context - VSCode extension context.
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize shared file system capability
  const fs = createFileSystemCapability();

  // Find kanban folder
  const kanbanDir = findKanbanFolder(vscode.workspace.workspaceFolders, fs);

  if (!kanbanDir) {
    vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', false);
    return;
  }

  vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', true);

  const workspaceRoot = path.dirname(kanbanDir);

  // --- Create domain orchestrators ---

  // Terminal orchestrator (shared by other orchestrators)
  const terminalOrch = createTerminalOrchestrator({
    fs,
    workspaceRoot,
  });

  // Tasks orchestrator
  const tasksOrch = createTasksOrchestrator({
    fs,
    kanbanDir,
    terminal: terminalOrch,
  });

  // Quicks orchestrator
  const quicksOrch = createQuicksOrchestrator({
    fs,
    kanbanDir,
    terminal: terminalOrch,
  });

  // Docs orchestrator
  const docsOrch = createDocsOrchestrator({
    fs,
    kanbanDir,
    terminal: terminalOrch,
  });

  // Config orchestrator
  const configOrch = createConfigOrchestrator({
    fs,
    kanbanDir,
  });

  // --- Register TreeViews ---

  // Tasks TreeView
  const tasksTreeView = vscode.window.createTreeView('kanbanTasks', {
    treeDataProvider: tasksOrch.treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(tasksTreeView);

  // Quicks TreeView
  const quicksTreeView = vscode.window.createTreeView('kanbanQuicks', {
    treeDataProvider: quicksOrch.treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(quicksTreeView);

  // Product Docs TreeView
  const productDocsTreeView = vscode.window.createTreeView('kanbanProductDocs', {
    treeDataProvider: docsOrch.productDocsProvider,
  });
  context.subscriptions.push(productDocsTreeView);

  // Engineering Docs TreeView
  const engineeringDocsTreeView = vscode.window.createTreeView('kanbanEngineeringDocs', {
    treeDataProvider: docsOrch.engineeringDocsProvider,
  });
  context.subscriptions.push(engineeringDocsTreeView);

  // Config TreeView
  const configTreeView = vscode.window.createTreeView('kanbanConfig', {
    treeDataProvider: configOrch.treeDataProvider,
  });
  context.subscriptions.push(configTreeView);

  // --- Register CodeLens ---

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/.kanban/tasks/*/task.xml' },
      tasksOrch.codeLensProvider
    )
  );

  // --- Register Commands ---

  // Shared open file command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.openFile', (args: { filePath: string }) => {
      if (args?.filePath) {
        const uri = vscode.Uri.file(args.filePath);
        vscode.window.showTextDocument(uri);
      }
    })
  );

  // Domain-specific commands
  tasksOrch.registerCommands(context, tasksTreeView);
  quicksOrch.registerCommands(context, quicksTreeView);
  docsOrch.registerCommands(context);

  // --- Register File Watchers ---

  context.subscriptions.push(tasksOrch.createFileWatcher(kanbanDir));
  context.subscriptions.push(quicksOrch.createFileWatcher(kanbanDir));
  context.subscriptions.push(docsOrch.createProductDocsWatcher(kanbanDir));
  context.subscriptions.push(docsOrch.createEngineeringDocsWatcher(kanbanDir));
  context.subscriptions.push(configOrch.createFileWatcher(kanbanDir));

  // --- Set initial context ---

  vscode.commands.executeCommand('setContext', 'kanban.hasConfigFile', configOrch.checkConfigExists());

  // --- Workspace change handler ---

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newKanbanDir = findKanbanFolder(vscode.workspace.workspaceFolders, fs);
      if (newKanbanDir !== kanbanDir) {
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
