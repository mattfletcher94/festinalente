/**
 * Config Orchestrator
 *
 * Policy decisions for config file management.
 * Coordinates config-related capabilities.
 */

import * as vscode from 'vscode';

import { createConfigViewCapability } from '../capabilities/config-view.capability';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';

/**
 * Dependencies required by the config orchestrator.
 */
export interface ConfigOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly kanbanDir: string;
}

/**
 * Return type for the config orchestrator factory.
 */
export interface CreateConfigOrchestratorReturn {
  /**
   * TreeDataProvider for the config view.
   */
  readonly treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * Refresh the config view.
   */
  readonly refresh: () => void;

  /**
   * Check if config file exists.
   */
  readonly checkConfigExists: () => boolean;

  /**
   * Create file watcher for config file.
   *
   * @param kanbanPath - Path to the .kanban folder.
   * @returns Disposable file watcher.
   */
  readonly createFileWatcher: (kanbanPath: string) => vscode.Disposable;
}

/**
 * Create a config orchestrator for config domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Config orchestrator with domain policy.
 */
export function createConfigOrchestrator(
  deps: ConfigOrchestratorDeps
): CreateConfigOrchestratorReturn {
  /**
   * Policy: Check if config exists.
   */
  function checkConfigExists(): boolean {
    return deps.fs.exists(deps.fs.joinPath(deps.kanbanDir, 'config.yaml'));
  }

  /**
   * Get the config file path.
   */
  function getConfigPath(): string {
    return deps.fs.joinPath(deps.kanbanDir, 'config.yaml');
  }

  // Initialize config view capability
  const configView = createConfigViewCapability({
    checkConfigExists,
    getConfigPath,
  });

  // Create providers
  const treeDataProvider = configView.createTreeDataProvider();
  const refreshConfigView = configView.createRefreshCallback();

  /**
   * Refresh the config view.
   */
  function refresh(): void {
    refreshConfigView();
  }

  /**
   * Create file watcher for config file.
   */
  function createFileWatcher(kanbanPath: string): vscode.Disposable {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(kanbanPath, 'config.yaml')
    );

    watcher.onDidChange(() => refresh());

    watcher.onDidCreate(() => {
      vscode.commands.executeCommand('setContext', 'kanban.hasConfigFile', true);
      refresh();
    });

    watcher.onDidDelete(() => {
      vscode.commands.executeCommand('setContext', 'kanban.hasConfigFile', false);
      refresh();
    });

    return watcher;
  }

  return {
    treeDataProvider,
    refresh,
    checkConfigExists,
    createFileWatcher,
  };
}
