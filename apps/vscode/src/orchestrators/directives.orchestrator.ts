/**
 * Directives Orchestrator
 *
 * Policy decisions for directives view management.
 * Coordinates directives config parsing and view capability.
 */

import * as vscode from 'vscode';

import type { Workflow } from '../types/directives-types';
import { createDirectivesConfigComputer } from '../computers/directives-config.computer';
import { createDirectivesViewCapability } from '../capabilities/directives-view.capability';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';
import type { createTerminalOrchestrator } from './terminal.orchestrator';

/**
 * Dependencies required by the directives orchestrator.
 */
export interface DirectivesOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly festinalenteDir: string;
  readonly terminal: ReturnType<typeof createTerminalOrchestrator>;
}

/**
 * Return type for the directives orchestrator factory.
 */
export interface CreateDirectivesOrchestratorReturn {
  /**
   * TreeDataProvider for the directives view.
   */
  readonly treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * Refresh the directives view.
   */
  readonly refresh: () => void;

  /**
   * Create file watcher for config.yaml and directive files.
   *
   * @param festinalenteDir - Path to the .festinalente folder.
   * @returns Disposable file watcher.
   */
  readonly createFileWatcher: (festinalenteDir: string) => vscode.Disposable;

  /**
   * Register directives-related commands.
   *
   * @param context - VSCode extension context.
   */
  readonly registerCommands: (context: vscode.ExtensionContext) => void;
}

/**
 * Create a directives orchestrator for directives domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Directives orchestrator with domain policy.
 */
export function createDirectivesOrchestrator(deps: DirectivesOrchestratorDeps): CreateDirectivesOrchestratorReturn {
  const configComputer = createDirectivesConfigComputer();

  /**
   * Policy: Load all workflows with directives from config.yaml.
   */
  function loadWorkflows(): Workflow[] {
    const configPath = deps.fs.joinPath(deps.festinalenteDir, 'config.yaml');

    if (!deps.fs.exists(configPath)) {
      return [];
    }

    const content = deps.fs.readFile(configPath);
    const directivesDir = deps.fs.joinPath(deps.festinalenteDir, 'directives');

    return configComputer.parseConfig(content, directivesDir, deps.fs.exists);
  }

  // Initialize directives view capability
  const directivesView = createDirectivesViewCapability({
    loadWorkflows
  });

  // Create providers
  const treeDataProvider = directivesView.createTreeDataProvider();
  const refreshDirectivesView = directivesView.createRefreshCallback();

  /**
   * Refresh the directives view.
   */
  function refresh(): void {
    refreshDirectivesView();
  }

  /**
   * Create file watcher for config.yaml and directive files.
   *
   * Watches both config.yaml (for directive assignments) and
   * directives/*.xml (for file existence changes).
   */
  function createFileWatcher(festinalenteDir: string): vscode.Disposable {
    const disposables: vscode.Disposable[] = [];

    // Watch config.yaml for directive assignment changes
    const configWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(festinalenteDir, 'config.yaml')
    );
    configWatcher.onDidChange(() => refresh());
    configWatcher.onDidCreate(() => refresh());
    configWatcher.onDidDelete(() => refresh());
    disposables.push(configWatcher);

    // Watch directives folder for file existence changes
    const directivesWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(festinalenteDir, 'directives/*.xml')
    );
    directivesWatcher.onDidChange(() => refresh());
    directivesWatcher.onDidCreate(() => refresh());
    directivesWatcher.onDidDelete(() => refresh());
    disposables.push(directivesWatcher);

    return vscode.Disposable.from(...disposables);
  }

  /**
   * Register directives-related commands.
   *
   * @param context - VSCode extension context.
   */
  function registerCommands(context: vscode.ExtensionContext): void {
    // Create directive command
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.createDirective', () => {
        deps.terminal.executeInTerminal('/festina-directive');
      })
    );
  }

  return {
    treeDataProvider,
    refresh,
    createFileWatcher,
    registerCommands
  };
}
