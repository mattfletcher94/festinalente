/**
 * Tasks Orchestrator
 *
 * Policy decisions for task management: loading, viewing, and actions.
 * Coordinates task-related capabilities and computers.
 */

import * as vscode from 'vscode';
import * as path from 'path';

import { createTaskParserComputer } from '../computers/task-parser.computer';
import { createTaskActionsComputer } from '../computers/task-actions.computer';
import { createTaskGroupingComputer } from '../computers/task-grouping.computer';
import { createPlanParserComputer } from '../computers/plan-parser.computer';
import { createTasksViewCapability, TaskItem } from '../capabilities/tasks-view.capability';
import { createCodeLensCapability } from '../capabilities/codelens.capability';
import { createPlanSymbolCapability } from '../capabilities/plan-symbol.capability';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';
import type { Task, TaskAction, TaskStatus } from '../types/task-types';
import type { CreateTerminalOrchestratorReturn } from './terminal.orchestrator';

/**
 * Dependencies required by the tasks orchestrator.
 */
export interface TasksOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly festinalenteDir: string;
  readonly terminal: CreateTerminalOrchestratorReturn;
}

/**
 * Return type for the tasks orchestrator factory.
 */
export interface CreateTasksOrchestratorReturn {
  /**
   * TreeDataProvider for the tasks view.
   */
  readonly treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * CodeLensProvider for task.xml files.
   */
  readonly codeLensProvider: vscode.CodeLensProvider;

  /**
   * DocumentSymbolProvider for plan.xml files.
   */
  readonly planSymbolProvider: vscode.DocumentSymbolProvider;

  /**
   * Refresh the tasks view, codelens, and plan symbols.
   */
  readonly refresh: () => void;

  /**
   * Load all tasks from the kanban folder.
   */
  readonly loadAllTasks: () => Task[];

  /**
   * Find a status group item by status.
   */
  readonly findStatusGroup: (status: TaskStatus) => vscode.TreeItem | undefined;

  /**
   * Find a task item by task ID.
   */
  readonly findTaskItem: (taskId: string) => TaskItem | undefined;

  /**
   * Register task-related commands.
   *
   * @param context - Extension context for subscriptions.
   * @param treeView - The tasks tree view for reveal operations.
   */
  readonly registerCommands: (
    context: vscode.ExtensionContext,
    treeView: vscode.TreeView<vscode.TreeItem>
  ) => void;

  /**
   * Create file watcher for task files.
   *
   * @param kanbanPath - Path to the .kanban folder.
   * @returns Disposable file watcher.
   */
  readonly createFileWatcher: (kanbanPath: string) => vscode.Disposable;
}

/**
 * Create a tasks orchestrator for task domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Tasks orchestrator with domain policy.
 */
export function createTasksOrchestrator(
  deps: TasksOrchestratorDeps
): CreateTasksOrchestratorReturn {
  // Initialize computers
  const taskParser = createTaskParserComputer();
  const taskActions = createTaskActionsComputer();
  const taskGrouping = createTaskGroupingComputer();
  const planParser = createPlanParserComputer();

  /**
   * Policy: Load all tasks from kanban folder.
   */
  function loadAllTasks(): Task[] {
    const tasksDir = deps.fs.joinPath(deps.festinalenteDir, 'tasks');
    if (!deps.fs.exists(tasksDir)) {
      return [];
    }

    const tasks: Task[] = [];

    try {
      const entries = deps.fs.readDir(tasksDir);

      for (const entry of entries) {
        const taskPath = deps.fs.joinPath(tasksDir, entry);
        if (!deps.fs.isDirectory(taskPath)) continue;

        const taskXml = deps.fs.joinPath(taskPath, 'task.xml');
        if (deps.fs.exists(taskXml)) {
          try {
            const content = deps.fs.readFile(taskXml);
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

  /**
   * Policy: Get task files for a task path.
   */
  function getTaskFiles(taskPath: string): string[] {
    const fileNames = ['task.xml', 'spec.xml', 'plan.xml'];
    const files: string[] = [];

    for (const name of fileNames) {
      const filePath = deps.fs.joinPath(taskPath, name);
      if (deps.fs.exists(filePath)) {
        files.push(filePath);
      }
    }

    return files;
  }

  /**
   * Policy: Check which task files exist.
   */
  function checkTaskFiles(taskPath: string): { hasSpec: boolean; hasPlan: boolean } {
    return {
      hasSpec: deps.fs.exists(deps.fs.joinPath(taskPath, 'spec.xml')),
      hasPlan: deps.fs.exists(deps.fs.joinPath(taskPath, 'plan.xml')),
    };
  }

  /**
   * Policy: Parse task from URI.
   */
  function parseTaskFromUri(uri: vscode.Uri): Task | undefined {
    const taskPath = path.dirname(uri.fsPath);
    const taskXml = deps.fs.joinPath(taskPath, 'task.xml');

    if (!deps.fs.exists(taskXml)) {
      return undefined;
    }

    try {
      const content = deps.fs.readFile(taskXml);
      return taskParser.parseTaskWithPath(content, taskPath);
    } catch {
      return undefined;
    }
  }

  /**
   * Policy: Get all actions for a task.
   */
  function getAllActions(task: Task): readonly TaskAction[] {
    return taskActions.getActions(task);
  }

  // Initialize view capability with dependencies
  const tasksView = createTasksViewCapability({
    loadTasks: loadAllTasks,
    getColumns: taskGrouping.getColumns,
    groupByStatus: taskGrouping.groupByStatus,
    getVisibleColumns: taskGrouping.getVisibleColumns,
    getTaskFiles,
    checkTaskFiles,
    getAllActions,
  });

  // Initialize codelens capability with dependencies
  const codelens = createCodeLensCapability({
    parseTaskFromUri,
    getActions: taskActions.getActions,
  });

  // Initialize plan symbol capability
  const planSymbol = createPlanSymbolCapability({
    parsePlanSymbols: planParser.parsePlanSymbols,
  });

  // Create providers
  const treeDataProvider = tasksView.createTreeDataProvider();
  const codeLensProvider = codelens.createCodeLensProvider();
  const planSymbolProvider = planSymbol.createDocumentSymbolProvider();

  const refreshTree = tasksView.createRefreshCallback();
  const refreshCodeLens = codelens.createRefreshCallback();
  const refreshPlanSymbols = planSymbol.createRefreshCallback();

  /**
   * Refresh tree, codelens, and plan symbols.
   */
  function refresh(): void {
    refreshTree();
    refreshCodeLens();
    refreshPlanSymbols();
  }

  /**
   * Register task-related commands.
   */
  function registerCommands(
    context: vscode.ExtensionContext,
    treeView: vscode.TreeView<vscode.TreeItem>
  ): void {
    // Refresh command
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.refresh', () => {
        refresh();
        vscode.window.showInformationMessage('Festina Lente tasks refreshed');
      })
    );

    // Run action command
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'festinalente.runAction',
        (args: { command: string; taskId: string }) => {
          if (!args?.command || !args?.taskId) {
            vscode.window.showErrorMessage('Invalid action arguments');
            return;
          }
          deps.terminal.executeInTerminal(args.command);
        }
      )
    );

    // Create task command
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.createTask', async () => {
        const title = await vscode.window.showInputBox({
          prompt: 'Enter task title',
          placeHolder: 'e.g., Add user authentication',
        });

        if (!title) {
          return;
        }

        deps.terminal.executeInTerminal(`/festina-create ${title}`);
      })
    );

    // Run next action command (from inline button)
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.runNextAction', (item: TaskItem) => {
        if (!item?.task || item.actions.length === 0) {
          vscode.window.showWarningMessage('No action available for this task');
          return;
        }

        const primaryAction = item.actions[0];
        deps.terminal.executeInTerminal(primaryAction.command);
      })
    );

    // Open task folder command
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.openTaskFolder', (item: TaskItem) => {
        if (!item?.task?.taskPath) {
          return;
        }
        const uri = vscode.Uri.file(item.task.taskPath);
        vscode.commands.executeCommand('revealInExplorer', uri);
      })
    );

    // Find task command (QuickPick search)
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.findTask', async () => {
        const tasks = loadAllTasks();

        if (tasks.length === 0) {
          vscode.window.showInformationMessage('No tasks found');
          return;
        }

        const items = tasks.map((task) => ({
          label: `${task.id}: ${task.title}`,
          description: task.labels.map((l) => `#${l}`).join(' '),
          detail: `Status: ${task.status} | Priority: ${task.priority || 'none'}`,
          task,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Search tasks by ID or title...',
          matchOnDescription: true,
          matchOnDetail: true,
        });

        if (selected) {
          const statusGroup = tasksView.findStatusGroup(selected.task.status);
          const taskItem = tasksView.findTaskItem(selected.task.id);

          if (statusGroup && taskItem) {
            await treeView.reveal(statusGroup, { expand: true });
            await treeView.reveal(taskItem, { select: true, focus: true });
          }
        }
      })
    );
  }

  /**
   * Create file watcher for task files.
   */
  function createFileWatcher(kanbanPath: string): vscode.Disposable {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(kanbanPath, 'tasks/**/*.xml')
    );

    watcher.onDidChange(() => refresh());
    watcher.onDidCreate(() => refresh());
    watcher.onDidDelete(() => refresh());

    return watcher;
  }

  return {
    treeDataProvider,
    codeLensProvider,
    planSymbolProvider,
    refresh,
    loadAllTasks,
    findStatusGroup: tasksView.findStatusGroup,
    findTaskItem: tasksView.findTaskItem,
    registerCommands,
    createFileWatcher,
  };
}
