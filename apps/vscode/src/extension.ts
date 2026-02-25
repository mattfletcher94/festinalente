/**
 * Claude Kanban VSCode Extension - Orchestrator
 *
 * Coordinates capabilities and computers to provide kanban task management.
 * Policy decisions (when/should) belong here, mechanism (how) in capabilities.
 */

import * as vscode from 'vscode';
import * as path from 'path';

// Computers (pure functions)
import { createTaskParserComputer } from './computers/task-parser.computer';
import { createTaskActionsComputer } from './computers/task-actions.computer';
import { createTaskGroupingComputer } from './computers/task-grouping.computer';
import { createClaudeSettingsComputer } from './computers/claude-settings.computer';

// Capabilities (mechanism)
import { createFileSystemCapability } from './capabilities/file-system.capability';
import { createTerminalCapability } from './capabilities/terminal.capability';
import { createClaudeSettingsCapability } from './capabilities/claude-settings.capability';
import { createTasksViewCapability, TaskItem } from './capabilities/tasks-view.capability';
import { createCodeLensCapability } from './capabilities/codelens.capability';
import { createConfigViewCapability } from './capabilities/config-view.capability';
import { createDocsViewCapability } from './capabilities/docs-view.capability';

// Types
import type { Task, TaskAction } from './types/task-types';

/**
 * Find the .kanban folder in the workspace (policy decision).
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
 * Extension activation - orchestrates all components.
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize computers
  const taskParser = createTaskParserComputer();
  const taskActions = createTaskActionsComputer();
  const taskGrouping = createTaskGroupingComputer();
  const claudeSettings = createClaudeSettingsComputer();

  // Initialize capabilities
  const fs = createFileSystemCapability();
  const terminal = createTerminalCapability();
  const settings = createClaudeSettingsCapability({ fs });

  // Policy: Find kanban folder
  const kanbanPath = findKanbanFolder(vscode.workspace.workspaceFolders, fs);

  if (!kanbanPath) {
    vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', false);
    return;
  }

  vscode.commands.executeCommand('setContext', 'kanban.hasKanbanFolder', true);

  // Reassign to a non-optional const so TypeScript knows it's defined in closures below
  const kanbanDir = kanbanPath;
  const workspaceRoot = path.dirname(kanbanDir);

  // Policy: Determine which runtime to use based on VSCode settings
  function getRuntime(): 'claude' | 'opencode' {
    const config = vscode.workspace.getConfiguration('kanban');
    const runtime = config.get<string>('runtime', 'claude');
    return runtime === 'opencode' ? 'opencode' : 'claude';
  }

  // Policy: Build CLI command based on runtime and settings
  function getRuntimeCommand(prompt: string): string {
    const projectSettings = settings.readProjectSettings(workspaceRoot);
    const globalSettings = settings.readGlobalSettings();
    const runtime = getRuntime();

    if (runtime === 'opencode') {
      // OpenCode uses: opencode --prompt "prompt" to start TUI with prefilled prompt
      return `opencode --prompt "${prompt}"`;
    }

    // Claude Code uses: claude "prompt" (interactive mode with initial prompt)
    const isYolo = claudeSettings.isYoloEnabled(projectSettings, globalSettings);
    if (isYolo) {
      return `claude --dangerously-skip-permissions "${prompt}"`;
    }
    return `claude "${prompt}"`;
  }

  // Policy: Execute a command in terminal
  function executeInTerminal(prompt: string): void {
    const kanbanTerminal = terminal.createFreshTerminal('Kanban', workspaceRoot);
    terminal.showTerminal(kanbanTerminal);
    terminal.sendCommand(kanbanTerminal, getRuntimeCommand(prompt));
  }

  // Policy: Load all tasks from kanban folder
  function loadAllTasks(): Task[] {
    const tasksDir = fs.joinPath(kanbanDir, 'tasks');
    if (!fs.exists(tasksDir)) {
      return [];
    }

    const tasks: Task[] = [];

    try {
      const entries = fs.readDir(tasksDir);

      for (const entry of entries) {
        const taskPath = fs.joinPath(tasksDir, entry);
        if (!fs.isDirectory(taskPath)) continue;

        const taskXml = fs.joinPath(taskPath, 'task.xml');
        if (fs.exists(taskXml)) {
          try {
            const content = fs.readFile(taskXml);
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

  // Policy: Get task files for a task path
  function getTaskFiles(taskPath: string): string[] {
    const fileNames = ['task.xml', 'spec.xml', 'plan.xml'];
    const files: string[] = [];

    for (const name of fileNames) {
      const filePath = fs.joinPath(taskPath, name);
      if (fs.exists(filePath)) {
        files.push(filePath);
      }
    }

    return files;
  }

  // Policy: Check which task files exist
  function checkTaskFiles(taskPath: string): { hasSpec: boolean; hasPlan: boolean } {
    return {
      hasSpec: fs.exists(fs.joinPath(taskPath, 'spec.xml')),
      hasPlan: fs.exists(fs.joinPath(taskPath, 'plan.xml')),
    };
  }

  // Policy: Parse task from URI
  function parseTaskFromUri(uri: vscode.Uri): Task | undefined {
    const taskPath = path.dirname(uri.fsPath);
    const taskXml = fs.joinPath(taskPath, 'task.xml');

    if (!fs.exists(taskXml)) {
      return undefined;
    }

    try {
      const content = fs.readFile(taskXml);
      return taskParser.parseTaskWithPath(content, taskPath);
    } catch {
      return undefined;
    }
  }

  // Policy: Get all actions for a task
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

  // Policy: Check if config exists
  function checkConfigExists(): boolean {
    return fs.exists(fs.joinPath(kanbanDir, 'config.yaml'));
  }

  function getConfigPath(): string {
    return fs.joinPath(kanbanDir, 'config.yaml');
  }

  // Set context for viewsWelcome
  vscode.commands.executeCommand('setContext', 'kanban.hasConfigFile', checkConfigExists());

  // Initialize config view capability
  const configView = createConfigViewCapability({
    checkConfigExists,
    getConfigPath,
  });

  // Initialize docs view capability
  const docsView = createDocsViewCapability(
    {
      readDir: fs.readDir,
      isDirectory: fs.isDirectory,
      exists: fs.exists,
      joinPath: fs.joinPath,
    },
    kanbanDir
  );

  // Initialize codelens capability with dependencies
  const codelens = createCodeLensCapability({
    parseTaskFromUri,
    getActions: taskActions.getActions,
  });

  // Create providers
  const treeDataProvider = tasksView.createTreeDataProvider();
  const configTreeDataProvider = configView.createTreeDataProvider();
  const codeLensProvider = codelens.createCodeLensProvider();

  const refreshTree = tasksView.createRefreshCallback();
  const refreshConfigView = configView.createRefreshCallback();
  const refreshCodeLens = codelens.createRefreshCallback();

  // Create docs providers
  const productDocsProvider = docsView.createProductDocsProvider();
  const engineeringDocsProvider = docsView.createEngineeringDocsProvider();
  const refreshProductDocs = docsView.createProductRefresh();
  const refreshEngineeringDocs = docsView.createEngineeringRefresh();

  // Register TreeView
  const treeView = vscode.window.createTreeView('kanbanTasks', {
    treeDataProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Register Config TreeView
  const configTreeView = vscode.window.createTreeView('kanbanConfig', {
    treeDataProvider: configTreeDataProvider,
  });
  context.subscriptions.push(configTreeView);

  // Register Product Docs TreeView
  const productDocsTreeView = vscode.window.createTreeView('kanbanProductDocs', {
    treeDataProvider: productDocsProvider,
  });
  context.subscriptions.push(productDocsTreeView);

  // Register Engineering Docs TreeView
  const engineeringDocsTreeView = vscode.window.createTreeView('kanbanEngineeringDocs', {
    treeDataProvider: engineeringDocsProvider,
  });
  context.subscriptions.push(engineeringDocsTreeView);

  // Register CodeLens
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { pattern: '**/.kanban/tasks/*/task.xml' },
      codeLensProvider
    )
  );

  // --- Commands (policy decisions) ---

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.refresh', () => {
      refreshTree();
      refreshCodeLens();
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

  // Run action command (policy: when to run actions)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kanban.runAction',
      (args: { command: string; taskId: string }) => {
        if (!args?.command || !args?.taskId) {
          vscode.window.showErrorMessage('Invalid action arguments');
          return;
        }
        executeInTerminal(args.command);
      }
    )
  );

  // Run global action command (policy: when to run global actions)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'kanban.runGlobalAction',
      (args: { command: string }) => {
        if (!args?.command) {
          vscode.window.showErrorMessage('Invalid global action arguments');
          return;
        }
        executeInTerminal(args.command);
      }
    )
  );

  // Start discovery session command (policy: when to start discovery)
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.startDiscovery', () => {
      executeInTerminal('/kanban-discover');
    })
  );

  // Create task command (policy: how to create tasks)
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.createTask', async () => {
      const title = await vscode.window.showInputBox({
        prompt: 'Enter task title',
        placeHolder: 'e.g., Add user authentication',
      });

      if (!title) {
        return;
      }

      executeInTerminal(`/kanban-create ${title}`);
    })
  );

  // Run next action command (from inline button)
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.runNextAction', (item: TaskItem) => {
      if (!item?.task || item.actions.length === 0) {
        vscode.window.showWarningMessage('No action available for this task');
        return;
      }

      const primaryAction = item.actions[0];
      executeInTerminal(primaryAction.command);
    })
  );

  // Open task folder command
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.openTaskFolder', (item: TaskItem) => {
      if (!item?.task?.taskPath) {
        return;
      }
      const uri = vscode.Uri.file(item.task.taskPath);
      vscode.commands.executeCommand('revealInExplorer', uri);
    })
  );

  // Find task command (QuickPick search)
  context.subscriptions.push(
    vscode.commands.registerCommand('kanban.findTask', async () => {
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
        // Reveal task in tree view (implemented in next step)
        const statusGroup = tasksView.findStatusGroup(selected.task.status);
        const taskItem = tasksView.findTaskItem(selected.task.id);

        if (statusGroup && taskItem) {
          await treeView.reveal(statusGroup, { expand: true });
          await treeView.reveal(taskItem, { select: true, focus: true });
        }
      }
    })
  );

  // --- File Watcher (policy: when to refresh) ---
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'tasks/**/*.xml')
  );

  watcher.onDidChange(() => {
    refreshTree();
    refreshCodeLens();
  });

  watcher.onDidCreate(() => {
    refreshTree();
    refreshCodeLens();
  });

  watcher.onDidDelete(() => {
    refreshTree();
    refreshCodeLens();
  });

  context.subscriptions.push(watcher);

  // --- Config File Watcher (policy: when to refresh config view) ---
  const configWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'config.yaml')
  );

  configWatcher.onDidChange(() => {
    refreshConfigView();
  });

  configWatcher.onDidCreate(() => {
    vscode.commands.executeCommand('setContext', 'kanban.hasConfigFile', true);
    refreshConfigView();
  });

  configWatcher.onDidDelete(() => {
    vscode.commands.executeCommand('setContext', 'kanban.hasConfigFile', false);
    refreshConfigView();
  });

  context.subscriptions.push(configWatcher);

  // --- Product Docs Watcher (policy: when to refresh product docs view) ---
  const productDocsWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'product/**/*.md')
  );

  productDocsWatcher.onDidChange(() => {
    refreshProductDocs();
  });

  productDocsWatcher.onDidCreate(() => {
    refreshProductDocs();
  });

  productDocsWatcher.onDidDelete(() => {
    refreshProductDocs();
  });

  context.subscriptions.push(productDocsWatcher);

  // --- Engineering Docs Watcher (policy: when to refresh engineering docs view) ---
  const engineeringDocsWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(kanbanPath, 'engineering/**/*.md')
  );

  engineeringDocsWatcher.onDidChange(() => {
    refreshEngineeringDocs();
  });

  engineeringDocsWatcher.onDidCreate(() => {
    refreshEngineeringDocs();
  });

  engineeringDocsWatcher.onDidDelete(() => {
    refreshEngineeringDocs();
  });

  context.subscriptions.push(engineeringDocsWatcher);

  // --- Workspace changes (policy: when to prompt reload) ---
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const newKanbanPath = findKanbanFolder(vscode.workspace.workspaceFolders, fs);
      if (newKanbanPath !== kanbanPath) {
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
