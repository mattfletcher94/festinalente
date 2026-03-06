/**
 * Festina Lente VSCode Extension - Composition Root
 *
 * Thin entry point that wires domain orchestrators together.
 * All policy decisions are delegated to domain orchestrators.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { createConfigOrchestrator } from './orchestrators/config.orchestrator';
import { createDirectivesOrchestrator } from './orchestrators/directives.orchestrator';
import { createDocsOrchestrator } from './orchestrators/docs.orchestrator';
import { createFileSystemCapability } from './capabilities/file-system.capability';
import { createQuicksOrchestrator } from './orchestrators/quicks.orchestrator';
import { createTasksOrchestrator } from './orchestrators/tasks.orchestrator';
import { createTerminalOrchestrator } from './orchestrators/terminal.orchestrator';

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
 * Initialize all domain orchestrators, register TreeViews, commands, watchers, and set context.
 *
 * @param context - VSCode extension context.
 * @param festinalenteDir - Path to the .festinalente directory.
 * @param fs - File system capability.
 */
function initializeOrchestrators(
  context: vscode.ExtensionContext,
  festinalenteDir: string,
  fs: ReturnType<typeof createFileSystemCapability>
): void {
  const workspaceRoot = path.dirname(festinalenteDir);

  // --- Create domain orchestrators ---

  // Terminal orchestrator (shared by other orchestrators)
  const terminalOrch = createTerminalOrchestrator({
    fs,
    workspaceRoot
  });

  // Tasks orchestrator
  const tasksOrch = createTasksOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch
  });

  // Quicks orchestrator
  const quicksOrch = createQuicksOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch
  });

  // Docs orchestrator
  const docsOrch = createDocsOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch
  });

  // Config orchestrator
  const configOrch = createConfigOrchestrator({
    fs,
    festinalenteDir
  });

  // Directives orchestrator
  const directivesOrch = createDirectivesOrchestrator({
    fs,
    festinalenteDir,
    terminal: terminalOrch
  });

  // --- Register TreeViews ---

  // Tasks TreeView
  const tasksTreeView = vscode.window.createTreeView('festinalenteTasks', {
    treeDataProvider: tasksOrch.treeDataProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(tasksTreeView);

  // Quicks TreeView
  const quicksTreeView = vscode.window.createTreeView('festinalenteQuicks', {
    treeDataProvider: quicksOrch.treeDataProvider,
    showCollapseAll: true
  });
  context.subscriptions.push(quicksTreeView);

  // Product Docs TreeView
  const productDocsTreeView = vscode.window.createTreeView('festinalenteProductDocs', {
    treeDataProvider: docsOrch.productDocsProvider
  });
  context.subscriptions.push(productDocsTreeView);

  // Engineering Docs TreeView
  const engineeringDocsTreeView = vscode.window.createTreeView('festinalenteEngineeringDocs', {
    treeDataProvider: docsOrch.engineeringDocsProvider
  });
  context.subscriptions.push(engineeringDocsTreeView);

  // Config TreeView
  const configTreeView = vscode.window.createTreeView('festinalenteConfig', {
    treeDataProvider: configOrch.treeDataProvider
  });
  context.subscriptions.push(configTreeView);

  // Directives TreeView
  const directivesTreeView = vscode.window.createTreeView('festinalenteDirectives', {
    treeDataProvider: directivesOrch.treeDataProvider
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
  context.subscriptions.push(directivesOrch.diagnosticsDisposable);

  // --- Set initial context ---

  vscode.commands.executeCommand('setContext', 'festinalente.hasConfigFile', configOrch.checkConfigExists());

  // --- Workspace change handler ---

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newFestinalenteDir = findFestinalenteFolder(vscode.workspace.workspaceFolders, fs);
      if (newFestinalenteDir !== festinalenteDir) {
        vscode.window
          .showInformationMessage('Workspace changed. Reload to update Festina Lente extension?', 'Reload')
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
 * Extension activation - composes and wires domain orchestrators.
 *
 * @param context - VSCode extension context.
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize shared file system capability
  const fs = createFileSystemCapability();

  // Find festinalente folder
  const festinalenteDir = findFestinalenteFolder(vscode.workspace.workspaceFolders, fs);

  if (festinalenteDir) {
    vscode.commands.executeCommand('setContext', 'festinalente.hasFestinalenteFolder', true);
    initializeOrchestrators(context, festinalenteDir, fs);
    return;
  }

  // No .festinalente folder found - set context to false and watch for its creation
  vscode.commands.executeCommand('setContext', 'festinalente.hasFestinalenteFolder', false);

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    const dirWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, '.festinalente/**')
    );

    let initialized = false;

    dirWatcher.onDidCreate(() => {
      if (initialized) {
        return;
      }

      const detectedDir = findFestinalenteFolder(vscode.workspace.workspaceFolders, fs);
      if (detectedDir) {
        initialized = true;
        vscode.commands.executeCommand('setContext', 'festinalente.hasFestinalenteFolder', true);
        initializeOrchestrators(context, detectedDir, fs);
        dirWatcher.dispose();
      }
    });

    context.subscriptions.push(dirWatcher);
  }
}

/**
 * Extension deactivation.
 */
export function deactivate(): void {
  console.log('Festina Lente extension deactivated');
}
