/**
 * Tasks view capability - mechanism for VSCode TreeView operations.
 */

import * as vscode from 'vscode';
import type { Task, TaskStatus, TaskColumn, TaskAction } from '../types/task-types';

/**
 * Tree item types.
 */
type TreeItem = StatusGroupItem | TaskItem | ActionItem | FileItem;

/**
 * Status group tree item (e.g., "In Progress (2)").
 */
class StatusGroupItem extends vscode.TreeItem {
  constructor(
    public readonly status: TaskStatus,
    public readonly statusName: string,
    count: number,
    collapsed: boolean
  ) {
    super(
      `${statusName} (${count})`,
      collapsed
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.contextValue = 'statusGroup';
    this.iconPath = this.getStatusIcon(status);
  }

  private getStatusIcon(status: TaskStatus): vscode.ThemeIcon {
    switch (status) {
      case 'in-progress':
        return new vscode.ThemeIcon('play-circle');
      case 'codecheck':
        return new vscode.ThemeIcon('beaker');
      case 'qa':
        return new vscode.ThemeIcon('checklist');
      case 'update-docs':
        return new vscode.ThemeIcon('book');
      case 'pr':
        return new vscode.ThemeIcon('git-pull-request');
      case 'planned':
        return new vscode.ThemeIcon('list-ordered');
      case 'scoped':
        return new vscode.ThemeIcon('telescope');
      case 'backlog':
        return new vscode.ThemeIcon('inbox');
      case 'done':
        return new vscode.ThemeIcon('check');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * Task tree item (e.g., "001: Add settings panel").
 */
export class TaskItem extends vscode.TreeItem {
  constructor(
    public readonly task: Task,
    public readonly files: { hasSpec: boolean; hasPlan: boolean },
    public readonly actions: readonly TaskAction[]
  ) {
    super(`${task.id}: ${task.title}`, vscode.TreeItemCollapsibleState.Collapsed);

    this.description = this.buildDescription();
    this.contextValue = 'task';
    this.tooltip = this.buildTooltip();
    this.iconPath = this.getPriorityIcon();
  }

  private buildDescription(): string {
    const parts: string[] = [];

    // Priority indicator
    if (this.task.priority) {
      const prioMap: Record<string, string> = {
        critical: '!!!',
        high: '!!',
        medium: '!',
        low: '·',
      };
      parts.push(prioMap[this.task.priority.toLowerCase()] || '');
    }

    // Labels (first 2 only to save space)
    if (this.task.labels.length > 0) {
      const displayLabels = this.task.labels.slice(0, 2);
      parts.push(displayLabels.map((l) => `#${l}`).join(' '));
      if (this.task.labels.length > 2) {
        parts.push(`+${this.task.labels.length - 2}`);
      }
    }

    // File indicators
    const fileIndicators: string[] = [];
    if (this.files.hasSpec) fileIndicators.push('S');
    if (this.files.hasPlan) fileIndicators.push('P');
    if (fileIndicators.length > 0) {
      parts.push(`[${fileIndicators.join('')}]`);
    }

    // Next action (show primary action)
    if (this.actions.length > 0) {
      parts.push(`→ ${this.actions[0].label}`);
    }

    return parts.join(' ');
  }

  private buildTooltip(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.supportHtml = true;

    // Title
    md.appendMarkdown(`### ${this.task.title}\n\n`);

    // Priority with color
    if (this.task.priority) {
      const prioColors: Record<string, string> = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
      };
      const icon = prioColors[this.task.priority.toLowerCase()] || '⚪';
      md.appendMarkdown(`**Priority:** ${icon} ${this.task.priority}\n\n`);
    }

    // Labels
    if (this.task.labels.length > 0) {
      md.appendMarkdown(`**Labels:** ${this.task.labels.map((l) => `\`${l}\``).join(' ')}\n\n`);
    }

    // Files
    md.appendMarkdown(`**Files:**\n`);
    md.appendMarkdown(`- task.xml ✓\n`);
    md.appendMarkdown(`- spec.xml ${this.files.hasSpec ? '✓' : '✗'}\n`);
    md.appendMarkdown(`- plan.xml ${this.files.hasPlan ? '✓' : '✗'}\n`);

    // Next action (show primary action)
    if (this.actions.length > 0) {
      md.appendMarkdown(`\n**Next:** $(play) ${this.actions[0].label} - ${this.actions[0].description}\n`);
    }

    // Dates
    if (this.task.created) {
      md.appendMarkdown(`\n---\n*Created: ${this.task.created}*`);
    }

    return md;
  }

  private getPriorityIcon(): vscode.ThemeIcon {
    switch (this.task.priority?.toLowerCase()) {
      case 'critical':
        return new vscode.ThemeIcon('flame', new vscode.ThemeColor('charts.red'));
      case 'high':
        return new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('charts.orange'));
      case 'medium':
        return new vscode.ThemeIcon('dash', new vscode.ThemeColor('charts.yellow'));
      case 'low':
        return new vscode.ThemeIcon('arrow-down', new vscode.ThemeColor('charts.blue'));
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * Action tree item (e.g., "Scope task 003").
 *
 * @param taskId - The task ID this action belongs to.
 * @param action - The action definition.
 * @param isPrimary - Whether this is the primary action (index 0) for icon styling.
 */
class ActionItem extends vscode.TreeItem {
  constructor(
    public readonly taskId: string,
    public readonly action: TaskAction,
    public readonly isPrimary: boolean
  ) {
    super(action.label, vscode.TreeItemCollapsibleState.None);

    this.description = action.description;
    this.iconPath = isPrimary
      ? new vscode.ThemeIcon('play', new vscode.ThemeColor('charts.green'))
      : new vscode.ThemeIcon('reply', new vscode.ThemeColor('charts.orange'));
    this.contextValue = 'action';
    this.command = {
      command: 'kanban.runAction',
      title: 'Run Action',
      arguments: [{ command: action.command, taskId }],
    };
  }
}

/**
 * File tree item (e.g., "task.xml").
 */
class FileItem extends vscode.TreeItem {
  constructor(
    public readonly fileName: string,
    public readonly filePath: string
  ) {
    super(fileName, vscode.TreeItemCollapsibleState.None);

    this.command = {
      command: 'kanban.openFile',
      title: 'Open File',
      arguments: [{ filePath }],
    };

    this.iconPath = this.getFileIcon();
    this.contextValue = 'file';
    this.resourceUri = vscode.Uri.file(filePath);
  }

  private getFileIcon(): vscode.ThemeIcon {
    switch (this.fileName) {
      case 'task.xml':
        return new vscode.ThemeIcon('tasklist');
      case 'spec.xml':
        return new vscode.ThemeIcon('note');
      case 'plan.xml':
        return new vscode.ThemeIcon('list-tree');
      default:
        return new vscode.ThemeIcon('file');
    }
  }
}

export interface TasksViewCapabilityDeps {
  loadTasks: () => Task[];
  getColumns: () => readonly TaskColumn[];
  groupByStatus: (tasks: readonly Task[]) => Map<TaskStatus, Task[]>;
  getVisibleColumns: (
    columns: readonly TaskColumn[],
    grouped: Map<TaskStatus, Task[]>
  ) => readonly TaskColumn[];
  getTaskFiles: (taskPath: string) => string[];
  checkTaskFiles: (taskPath: string) => { hasSpec: boolean; hasPlan: boolean };
  getAllActions: (task: Task) => readonly TaskAction[];
}

export interface CreateTasksViewCapabilityReturn {
  createTreeDataProvider(): vscode.TreeDataProvider<TreeItem>;
  createRefreshCallback(): () => void;
}

export function createTasksViewCapability(
  deps: TasksViewCapabilityDeps
): CreateTasksViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | void>();

  function createTreeDataProvider(): vscode.TreeDataProvider<TreeItem> {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,

      getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
      },

      getChildren(element?: TreeItem): TreeItem[] {
        if (!element) {
          return getStatusGroups();
        }

        if (element instanceof StatusGroupItem) {
          return getTasksForStatus(element.status);
        }

        if (element instanceof TaskItem) {
          return getChildrenForTask(element);
        }

        return [];
      },
    };
  }

  function getStatusGroups(): StatusGroupItem[] {
    const tasks = deps.loadTasks();
    const columns = deps.getColumns();
    const grouped = deps.groupByStatus(tasks);
    const visibleColumns = deps.getVisibleColumns(columns, grouped);
    const groups: StatusGroupItem[] = [];

    for (const column of visibleColumns) {
      const columnTasks = grouped.get(column.id) || [];
      const collapsed = column.id === 'done';
      groups.push(new StatusGroupItem(column.id, column.name, columnTasks.length, collapsed));
    }

    return groups;
  }

  function getTasksForStatus(status: TaskStatus): TaskItem[] {
    const tasks = deps.loadTasks();
    return tasks
      .filter((t) => t.status === status)
      .map((t) => new TaskItem(t, deps.checkTaskFiles(t.taskPath), deps.getAllActions(t)));
  }

  function getFilesForTask(taskPath: string): FileItem[] {
    const files = deps.getTaskFiles(taskPath);
    return files.map((filePath) => {
      const fileName = filePath.split(/[/\\]/).pop() || '';
      return new FileItem(fileName, filePath);
    });
  }

  function getChildrenForTask(taskItem: TaskItem): (ActionItem | FileItem)[] {
    const children: (ActionItem | FileItem)[] = [];

    // Prepend ActionItems for all available actions (FR1)
    // Primary action (index 0) gets green play icon (FR2)
    // Secondary actions (index > 0) get orange reply icon (FR3)
    // Done status has empty actions array, so no ActionItems (FR5)
    taskItem.actions.forEach((action, index) => {
      children.push(new ActionItem(taskItem.task.id, action, index === 0));
    });

    // Add file items
    children.push(...getFilesForTask(taskItem.task.taskPath));

    return children;
  }

  function createRefreshCallback(): () => void {
    return () => onDidChangeTreeData.fire();
  }

  return {
    createTreeDataProvider,
    createRefreshCallback,
  };
}
