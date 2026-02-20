/**
 * Tasks view capability - mechanism for VSCode TreeView operations.
 */

import * as vscode from 'vscode';
import type { Task, TaskStatus, TaskColumn } from '../types/task-types';

/**
 * Tree item types.
 */
type TreeItem = StatusGroupItem | TaskItem | FileItem;

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
class TaskItem extends vscode.TreeItem {
  constructor(public readonly task: Task) {
    super(`${task.id}: ${task.title}`, vscode.TreeItemCollapsibleState.Collapsed);

    this.description = task.priority ? `[${task.priority}]` : undefined;
    this.contextValue = 'task';
    this.tooltip = this.buildTooltip();
    this.iconPath = this.getPriorityIcon();
  }

  private buildTooltip(): string {
    const lines = [this.task.title];
    if (this.task.priority) {
      lines.push(`Priority: ${this.task.priority}`);
    }
    if (this.task.labels.length > 0) {
      lines.push(`Labels: ${this.task.labels.join(', ')}`);
    }
    return lines.join('\n');
  }

  private getPriorityIcon(): vscode.ThemeIcon {
    switch (this.task.priority?.toLowerCase()) {
      case 'critical':
        return new vscode.ThemeIcon('flame', new vscode.ThemeColor('errorForeground'));
      case 'high':
        return new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('errorForeground'));
      case 'medium':
        return new vscode.ThemeIcon('dash', new vscode.ThemeColor('warningForeground'));
      case 'low':
        return new vscode.ThemeIcon('arrow-down', new vscode.ThemeColor('descriptionForeground'));
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
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
          return getFilesForTask(element.task.taskPath);
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
    return tasks.filter((t) => t.status === status).map((t) => new TaskItem(t));
  }

  function getFilesForTask(taskPath: string): FileItem[] {
    const files = deps.getTaskFiles(taskPath);
    return files.map((filePath) => {
      const fileName = filePath.split(/[/\\]/).pop() || '';
      return new FileItem(fileName, filePath);
    });
  }

  function createRefreshCallback(): () => void {
    return () => onDidChangeTreeData.fire();
  }

  return {
    createTreeDataProvider,
    createRefreshCallback,
  };
}
