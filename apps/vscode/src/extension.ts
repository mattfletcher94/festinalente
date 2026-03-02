/**
 * Festina Lente VSCode Extension - Composition Root
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
import { createDirectivesOrchestrator } from './orchestrators/directives.orchestrator';

/**
 * Find the .festinalente folder in the workspace.
 *
 * @param workspaceFolders - VSCode workspace folders.
 * @param fs - File system capability.
 * @returns Path to .festinalente folder or undefined if not found.
 */
function findFestinalenteFolder(
  workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined,
  fs: ReturnType<typeof createFileSystemCapability>
): string | undefined {
  if (!workspaceFolders) {
    return undefined;
  }

  for (const folder of workspaceFolders) {
    const festinalentePath = fs.joinPath(folder.uri.fsPath, '.festinalente');
    if (fs.exists(festinalentePath)) {
      return festinalentePath;
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

  // Find festinalente folder
  const festinalenteDir = findFestinalenteFolder(vscode.workspace.workspaceFolders, fs);

  if (!festinalenteDir) {
    vscode.commands.executeCommand('setContext', 'festinalente.hasFestinalenteFolder', false);
    return;
  }

  vscode.commands.executeCommand('setContext', 'festinalente.hasFestinalenteFolder', true);

  const workspaceRoot = path.dirname(festinalenteDir);

  // --- Create domain orchestrators ---

  // Terminal orchestrator (shared by other orchestrators)
  const terminalOrch = createTerminalOrchestrator({
    fs,
    workspaceRoot,
  });

  // Tasks orchestrator
  const tasksOrch = createTasksOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch,
  });

  // Quicks orchestrator
  const quicksOrch = createQuicksOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch,
  });

  // Docs orchestrator
  const docsOrch = createDocsOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch,
  });

  // Config orchestrator
  const configOrch = createConfigOrchestrator({
    fs,
    festinalenteDir,
  });

  // Directives orchestrator
  const directivesOrch = createDirectivesOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch,
  });

  // --- Register TreeViews ---

  // Tasks TreeView
  const tasksTreeView = vscode.window.createTreeView('festinalenteTasks', {
    treeDataProvider: tasksOrch.treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(tasksTreeView);

  // Quicks TreeView
  const quicksTreeView = vscode.window.createTreeView('festinalenteQuicks', {
    treeDataProvider: quicksOrch.treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(quicksTreeView);

  // Product Docs TreeView
  const productDocsTreeView = vscode.window.createTreeView('festinalenteProductDocs', {
    treeDataProvider: docsOrch.productDocsProvider,
  });
  context.subscriptions.push(productDocsTreeView);

  // Engineering Docs TreeView
  const engineeringDocsTreeView = vscode.window.createTreeView('festinalenteEngineeringDocs', {
    treeDataProvider: docsOrch.engineeringDocsProvider,
  });
  context.subscriptions.push(engineeringDocsTreeView);

  // Config TreeView
  const configTreeView = vscode.window.createTreeView('festinalenteConfig', {
    treeDataProvider: configOrch.treeDataProvider,
  });
  context.subscriptions.push(configTreeView);

  // Directives TreeView
  const directivesTreeView = vscode.window.createTreeView('festinalenteDirectives', {
    treeDataProvider: directivesOrch.treeDataProvider,
  });
  context.subscriptions.push(directivesTreeView);

  // --- Register CodeLens ---

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/.festinalente/tasks/*/task.xml' },
      tasksOrch.codeLensProvider
    )
  );

  // --- Register DocumentSymbolProvider ---

  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      { pattern: '**/.festinalente/tasks/*/plan.xml' },
      tasksOrch.planSymbolProvider
    )
  );

  // --- Register Commands ---

  // Shared open file command
  context.subscriptions.push(
    vscode.commands.registerCommand('festinalente.openFile', (args: { filePath: string }) => {
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
  directivesOrch.registerCommands(context);

  // --- Register File Watchers ---

  context.subscriptions.push(tasksOrch.createFileWatcher(festinalenteDir));
  context.subscriptions.push(quicksOrch.createFileWatcher(festinalenteDir));
  context.subscriptions.push(docsOrch.createProductDocsWatcher(festinalenteDir));
  context.subscriptions.push(docsOrch.createEngineeringDocsWatcher(festinalenteDir));
  context.subscriptions.push(configOrch.createFileWatcher(festinalenteDir));
  context.subscriptions.push(directivesOrch.createFileWatcher(festinalenteDir));

  // --- Set initial context ---

  vscode.commands.executeCommand('setContext', 'festinalente.hasConfigFile', configOrch.checkConfigExists());

  // --- Workspace change handler ---

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newFestinalenteDir = findFestinalenteFolder(vscode.workspace.workspaceFolders, fs);
      if (newFestinalenteDir !== festinalenteDir) {
        vscode.window
          .showInformationMessage(
            'Workspace changed. Reload to update Festina Lente extension?',
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

  console.log('Festina Lente extension activated');
}

/**
 * Extension deactivation.
 */
export function deactivate(): void {
  console.log('Festina Lente extension deactivated');
}
