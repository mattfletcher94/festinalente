/**
 * TreeDataProvider for the kanban tasks sidebar.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseTaskXml, type ParsedTask } from './task-parser';
import type { TaskStatus, TaskColumn } from './task-types';

/**
 * Column ordering - active work first, done last.
 */
const COLUMNS: TaskColumn[] = [
  { id: 'in-progress', name: 'In Progress', open: true },
  { id: 'codecheck', name: 'Code Check', open: true },
  { id: 'qa', name: 'QA', open: true },
  { id: 'update-docs', name: 'Update Docs', open: true },
  { id: 'pr', name: 'PR', open: true },
  { id: 'planned', name: 'Planned', open: true },
  { id: 'scoped', name: 'Scoped', open: true },
  { id: 'backlog', name: 'Backlog', open: true },
  { id: 'done', name: 'Done', open: false },
];

/**
 * Tree item types.
 */
type TreeItem = StatusGroupItem | TaskItem | FileItem;

/**
 * Task with path information.
 */
interface TaskWithPath extends ParsedTask {
  taskPath: string;
}

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
  constructor(public readonly task: TaskWithPath) {
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

/**
 * Tree data provider for kanban tasks.
 */
export class TaskTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private kanbanPath: string) {}

  /**
   * Refresh the tree view.
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item representation.
   */
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children of a tree item.
   */
  getChildren(element?: TreeItem): TreeItem[] {
    if (!element) {
      return this.getStatusGroups();
    }

    if (element instanceof StatusGroupItem) {
      return this.getTasksForStatus(element.status);
    }

    if (element instanceof TaskItem) {
      return this.getFilesForTask(element.task.taskPath);
    }

    return [];
  }

  /**
   * Get status group items (only non-empty categories).
   */
  private getStatusGroups(): StatusGroupItem[] {
    const tasks = this.loadAllTasks();
    const groups: StatusGroupItem[] = [];

    for (const column of COLUMNS) {
      const count = tasks.filter((t) => t.status === column.id).length;
      // Only show categories that have tasks
      if (count === 0) continue;
      // Done is collapsed by default
      const collapsed = column.id === 'done';
      groups.push(new StatusGroupItem(column.id, column.name, count, collapsed));
    }

    return groups;
  }

  /**
   * Get task items for a status.
   */
  private getTasksForStatus(status: TaskStatus): TaskItem[] {
    return this.loadAllTasks()
      .filter((t) => t.status === status)
      .map((t) => new TaskItem(t));
  }

  /**
   * Get file items for a task.
   */
  private getFilesForTask(taskPath: string): FileItem[] {
    const files: FileItem[] = [];
    const fileNames = ['task.xml', 'spec.xml', 'plan.xml'];

    for (const name of fileNames) {
      const filePath = path.join(taskPath, name);
      if (fs.existsSync(filePath)) {
        files.push(new FileItem(name, filePath));
      }
    }

    return files;
  }

  /**
   * Load all tasks from the kanban folder.
   */
  private loadAllTasks(): TaskWithPath[] {
    const tasksDir = path.join(this.kanbanPath, 'tasks');
    if (!fs.existsSync(tasksDir)) {
      return [];
    }

    const tasks: TaskWithPath[] = [];

    try {
      const entries = fs.readdirSync(tasksDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const taskPath = path.join(tasksDir, entry.name);
        const taskXml = path.join(taskPath, 'task.xml');

        if (fs.existsSync(taskXml)) {
          try {
            const content = fs.readFileSync(taskXml, 'utf-8');
            const parsed = parseTaskXml(content);
            tasks.push({ ...parsed, taskPath });
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
}
