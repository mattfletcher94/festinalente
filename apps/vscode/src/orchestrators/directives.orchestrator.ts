/**
 * Directives Orchestrator
 *
 * Policy decisions for directives view management.
 * Coordinates directives config parsing and view capability.
 */

import * as vscode from 'vscode';

import type { Workflow } from '../types/directives-types';
import { createDirectivesConfigComputer } from '../computers/directives-config.computer';
import { createDirectiveValidatorComputer } from '../computers/directive-validator.computer';
import { createDirectivesViewCapability } from '../capabilities/directives-view.capability';
import { createDirectiveDiagnosticsCapability } from '../capabilities/directive-diagnostics.capability';
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

  /**
   * Disposable for diagnostics subscriptions and cleanup.
   */
  readonly diagnosticsDisposable: vscode.Disposable;
}

/**
 * Create a directives orchestrator for directives domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Directives orchestrator with domain policy.
 */
export function createDirectivesOrchestrator(deps: DirectivesOrchestratorDeps): CreateDirectivesOrchestratorReturn {
  const configComputer = createDirectivesConfigComputer();
  const validatorComputer = createDirectiveValidatorComputer();
  const diagnosticsCap = createDirectiveDiagnosticsCapability({ validator: validatorComputer });

  /**
   * Check whether a document is a directive XML file.
   *
   * Matches pattern: .festinalente/directives/*.xml (not subdirectories).
   * Supports both forward and backslash separators for cross-platform use.
   */
  function isDirectiveFile(document: vscode.TextDocument): boolean {
    const fsPath = document.uri.fsPath;
    const sep = /[\\/]/;
    const segments = fsPath.split(sep);

    const festinalenteIdx = segments.lastIndexOf('.festinalente');
    if (festinalenteIdx === -1) {
      return false;
    }

    // Must be exactly .festinalente/directives/<file>.xml
    if (segments.length !== festinalenteIdx + 3 || segments[festinalenteIdx + 1] !== 'directives') {
      return false;
    }

    return fsPath.endsWith('.xml');
  }

  // Debounce infrastructure for document change events
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Document event subscriptions for directive diagnostics
  const openSubscription = vscode.workspace.onDidOpenTextDocument((document) => {
    if (isDirectiveFile(document)) {
      diagnosticsCap.validateDocument(document);
    }
  });

  const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
    const document = event.document;
    if (isDirectiveFile(document)) {
      const key = document.uri.toString();
      const existing = debounceTimers.get(key);
      if (existing !== undefined) {
        clearTimeout(existing);
      }
      debounceTimers.set(
        key,
        setTimeout(() => {
          debounceTimers.delete(key);
          diagnosticsCap.validateDocument(document);
        }, 300)
      );
    }
  });

  const closeSubscription = vscode.workspace.onDidCloseTextDocument((document) => {
    if (isDirectiveFile(document)) {
      const key = document.uri.toString();
      const existing = debounceTimers.get(key);
      if (existing !== undefined) {
        clearTimeout(existing);
        debounceTimers.delete(key);
      }
      diagnosticsCap.clearDiagnostics(document.uri);
    }
  });

  // Validate all currently open directive files
  for (const document of vscode.workspace.textDocuments) {
    if (isDirectiveFile(document)) {
      diagnosticsCap.validateDocument(document);
    }
  }

  // Composite disposable for diagnostics cleanup
  const diagnosticsDisposable = vscode.Disposable.from(
    { dispose: () => diagnosticsCap.dispose() },
    openSubscription,
    changeSubscription,
    closeSubscription,
    {
      dispose: () => {
        for (const timer of debounceTimers.values()) clearTimeout(timer);
        debounceTimers.clear();
      }
    }
  );

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
    registerCommands,
    diagnosticsDisposable
  };
}
