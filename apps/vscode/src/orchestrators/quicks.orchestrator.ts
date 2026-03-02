/**
 * Quicks Orchestrator
 *
 * Policy decisions for quick task management: loading, viewing, and actions.
 * Coordinates quick-related capabilities and computers.
 */

import * as vscode from 'vscode';

import { createQuickParserComputer } from '../computers/quick-parser.computer';
import { createQuicksViewCapability, QuickItem } from '../capabilities/quicks-view.capability';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';
import type { Quick } from '../types/quick-types';
import type { CreateTerminalOrchestratorReturn } from './terminal.orchestrator';

/**
 * Dependencies required by the quicks orchestrator.
 */
export interface QuicksOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly festinalenteDir: string;
  readonly terminal: CreateTerminalOrchestratorReturn;
}

/**
 * Return type for the quicks orchestrator factory.
 */
export interface CreateQuicksOrchestratorReturn {
  /**
   * TreeDataProvider for the quicks view.
   */
  readonly treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * Refresh the quicks view.
   */
  readonly refresh: () => void;

  /**
   * Load all quicks from the kanban folder.
   */
  readonly loadAllQuicks: () => Quick[];

  /**
   * Find a quick item by quick ID.
   */
  readonly findQuickItem: (quickId: string) => QuickItem | undefined;

  /**
   * Register quick-related commands.
   *
   * @param context - Extension context for subscriptions.
   * @param treeView - The quicks tree view for reveal operations.
   */
  readonly registerCommands: (
    context: vscode.ExtensionContext,
    treeView: vscode.TreeView<vscode.TreeItem>
  ) => void;

  /**
   * Create file watcher for quick files.
   *
   * @param kanbanPath - Path to the .kanban folder.
   * @returns Disposable file watcher.
   */
  readonly createFileWatcher: (kanbanPath: string) => vscode.Disposable;
}

/**
 * Create a quicks orchestrator for quick task domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Quicks orchestrator with domain policy.
 */
export function createQuicksOrchestrator(
  deps: QuicksOrchestratorDeps
): CreateQuicksOrchestratorReturn {
  // Initialize computers
  const quickParser = createQuickParserComputer();

  /**
   * Policy: Load all quicks from kanban folder.
   */
  function loadAllQuicks(): Quick[] {
    const quicksDir = deps.fs.joinPath(deps.festinalenteDir, 'quick');
    if (!deps.fs.exists(quicksDir)) {
      return [];
    }

    const quicks: Quick[] = [];

    try {
      const entries = deps.fs.readDir(quicksDir);

      for (const entry of entries) {
        const quickPath = deps.fs.joinPath(quicksDir, entry);
        if (!deps.fs.isDirectory(quickPath)) continue;

        const quickXml = deps.fs.joinPath(quickPath, 'quick.xml');
        if (deps.fs.exists(quickXml)) {
          try {
            const content = deps.fs.readFile(quickXml);
            const quick = quickParser.parseQuickWithPath(content, quickXml);
            quicks.push(quick);
          } catch (err) {
            console.error(`Failed to parse ${quickXml}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to read quicks directory:', err);
    }

    return quicks;
  }

  // Initialize view capability with dependencies
  const quicksView = createQuicksViewCapability({
    loadQuicks: loadAllQuicks,
  });

  // Create providers
  const treeDataProvider = quicksView.createTreeDataProvider();
  const refreshQuicks = quicksView.createRefreshCallback();

  /**
   * Refresh the quicks view.
   */
  function refresh(): void {
    refreshQuicks();
  }

  /**
   * Register quick-related commands.
   */
  function registerCommands(
    context: vscode.ExtensionContext,
    treeView: vscode.TreeView<vscode.TreeItem>
  ): void {
    // Create quick command
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.createQuick', async () => {
        const title = await vscode.window.showInputBox({
          prompt: 'Enter quick task title',
          placeHolder: 'e.g., Fix typo in README',
        });

        if (!title) {
          return;
        }

        deps.terminal.executeInTerminal(`/festina-quick ${title}`);
      })
    );

    // Refresh quicks command
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.refreshQuicks', () => {
        refresh();
        vscode.window.showInformationMessage('Festina Lente quicks refreshed');
      })
    );

    // Find quick command (QuickPick search)
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.findQuick', async () => {
        const quicks = loadAllQuicks();

        if (quicks.length === 0) {
          vscode.window.showInformationMessage('No quick tasks found');
          return;
        }

        const items = quicks.map((quick) => ({
          label: `${quick.id}: ${quick.title}`,
          description: quick.status,
          detail: quick.problem || 'No problem description',
          quick,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Search quicks by ID or title...',
          matchOnDescription: true,
          matchOnDetail: true,
        });

        if (selected) {
          const quickItem = quicksView.findQuickItem(selected.quick.id);
          if (quickItem) {
            await treeView.reveal(quickItem, { select: true, focus: true });
          }
        }
      })
    );
  }

  /**
   * Create file watcher for quick files.
   */
  function createFileWatcher(kanbanPath: string): vscode.Disposable {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(kanbanPath, 'quick/**/*.xml')
    );

    watcher.onDidChange(() => refresh());
    watcher.onDidCreate(() => refresh());
    watcher.onDidDelete(() => refresh());

    return watcher;
  }

  return {
    treeDataProvider,
    refresh,
    loadAllQuicks,
    findQuickItem: quicksView.findQuickItem,
    registerCommands,
    createFileWatcher,
  };
}
