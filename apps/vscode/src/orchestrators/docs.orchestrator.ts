/**
 * Docs Orchestrator
 *
 * Policy decisions for documentation management: product and engineering docs.
 * Coordinates docs-related capabilities.
 */

import * as vscode from 'vscode';

import type { CreateTerminalOrchestratorReturn } from './terminal.orchestrator';
import { createDocsViewCapability } from '../capabilities/docs-view.capability';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';

/**
 * Dependencies required by the docs orchestrator.
 */
export interface DocsOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly festinalenteDir: string;
  readonly terminal: CreateTerminalOrchestratorReturn;
}

/**
 * Return type for the docs orchestrator factory.
 */
export interface CreateDocsOrchestratorReturn {
  /**
   * TreeDataProvider for the product docs view.
   */
  readonly productDocsProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * TreeDataProvider for the engineering docs view.
   */
  readonly engineeringDocsProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * Refresh the product docs view.
   */
  readonly refreshProductDocs: () => void;

  /**
   * Refresh the engineering docs view.
   */
  readonly refreshEngineeringDocs: () => void;

  /**
   * Create file watcher for product docs.
   *
   * @param kanbanPath - Path to the .kanban folder.
   * @returns Disposable file watcher.
   */
  readonly createProductDocsWatcher: (kanbanPath: string) => vscode.Disposable;

  /**
   * Create file watcher for engineering docs.
   *
   * @param kanbanPath - Path to the .kanban folder.
   * @returns Disposable file watcher.
   */
  readonly createEngineeringDocsWatcher: (kanbanPath: string) => vscode.Disposable;

  /**
   * Register global action command for docs.
   *
   * @param context - Extension context for subscriptions.
   */
  readonly registerCommands: (context: vscode.ExtensionContext) => void;
}

/**
 * Create a docs orchestrator for documentation domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Docs orchestrator with domain policy.
 */
export function createDocsOrchestrator(
  deps: DocsOrchestratorDeps
): CreateDocsOrchestratorReturn {
  // Initialize docs view capability
  const docsView = createDocsViewCapability(
    {
      readDir: deps.fs.readDir,
      isDirectory: deps.fs.isDirectory,
      exists: deps.fs.exists,
      joinPath: deps.fs.joinPath,
    },
    deps.festinalenteDir
  );

  // Create providers
  const productDocsProvider = docsView.createProductDocsProvider();
  const engineeringDocsProvider = docsView.createEngineeringDocsProvider();
  const refreshProductDocs = docsView.createProductRefresh();
  const refreshEngineeringDocs = docsView.createEngineeringRefresh();

  /**
   * Create file watcher for product docs.
   */
  function createProductDocsWatcher(kanbanPath: string): vscode.Disposable {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(kanbanPath, 'product/**/*.md')
    );

    watcher.onDidChange(() => refreshProductDocs());
    watcher.onDidCreate(() => refreshProductDocs());
    watcher.onDidDelete(() => refreshProductDocs());

    return watcher;
  }

  /**
   * Create file watcher for engineering docs.
   */
  function createEngineeringDocsWatcher(kanbanPath: string): vscode.Disposable {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(kanbanPath, 'engineering/**/*.md')
    );

    watcher.onDidChange(() => refreshEngineeringDocs());
    watcher.onDidCreate(() => refreshEngineeringDocs());
    watcher.onDidDelete(() => refreshEngineeringDocs());

    return watcher;
  }

  /**
   * Register docs-related commands.
   */
  function registerCommands(context: vscode.ExtensionContext): void {
    // Run global action command (for docs mapping actions)
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'festinalente.runGlobalAction',
        (args: { command: string }) => {
          if (!args?.command) {
            vscode.window.showErrorMessage('Invalid global action arguments');
            return;
          }
          deps.terminal.executeInTerminal(args.command);
        }
      )
    );
  }

  return {
    productDocsProvider,
    engineeringDocsProvider,
    refreshProductDocs,
    refreshEngineeringDocs,
    createProductDocsWatcher,
    createEngineeringDocsWatcher,
    registerCommands,
  };
}
