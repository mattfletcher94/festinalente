/**
 * Projects view capability - mechanism for VSCode TreeView operations on projects.
 */

import * as vscode from 'vscode';
import type { Project, ProjectStatus } from '../types/project-types';

/**
 * Tree item types for the projects view.
 */
type TreeItem = ProjectItem | ProjectTaskItem;

/**
 * Project tree item showing title, status icon, and progress fraction.
 */
export class ProjectItem extends vscode.TreeItem {
  constructor(public readonly project: Project) {
    super(project.title, vscode.TreeItemCollapsibleState.Collapsed);

    this.description = `${project.completedCount}/${project.taskCount} tasks done`;
    this.contextValue = 'project';
    this.iconPath = ProjectItem.getStatusIcon(project.status);
    this.tooltip = ProjectItem.buildTooltip(project);
  }

  /**
   * Map a project status to a theme icon.
   *
   * @param status - The project status.
   * @returns A VSCode ThemeIcon for the status.
   */
  private static getStatusIcon(status: ProjectStatus): vscode.ThemeIcon {
    switch (status) {
      case 'open':
        return new vscode.ThemeIcon('circle-outline');
      case 'in-progress':
        return new vscode.ThemeIcon('sync');
      case 'done':
        return new vscode.ThemeIcon('check');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }

  /**
   * Build a rich tooltip for the project item.
   *
   * @param project - The project to describe.
   * @returns A MarkdownString tooltip.
   */
  private static buildTooltip(project: Project): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.supportHtml = true;
    md.appendMarkdown(`### ${project.title}\n\n`);
    md.appendMarkdown(`**Status:** ${project.status}\n\n`);
    md.appendMarkdown(`**Progress:** ${project.completedCount}/${project.taskCount} tasks done\n\n`);
    if (project.created) {
      md.appendMarkdown(`---\n*Created: ${project.created}*`);
    }
    return md;
  }
}

/**
 * Child tree item for a task within a project, showing task ID and status.
 */
export class ProjectTaskItem extends vscode.TreeItem {
  constructor(
    public readonly taskId: string,
    public readonly taskTitle: string,
    public readonly taskStatus: string,
    public readonly taskPath: string
  ) {
    const taskNumber = taskId.split('-')[0];
    super(`${taskNumber}: ${taskTitle}`, vscode.TreeItemCollapsibleState.None);

    this.description = taskStatus;
    this.contextValue = 'projectTask';
    this.iconPath = ProjectTaskItem.getStatusIcon(taskStatus);
    this.command = {
      command: 'festinalente.openFile',
      title: 'Open Task',
      arguments: [{ filePath: `${taskPath}/task.xml` }]
    };
  }

  /**
   * Map a task status string to a theme icon.
   *
   * @param status - The task status string.
   * @returns A VSCode ThemeIcon.
   */
  private static getStatusIcon(status: string): vscode.ThemeIcon {
    switch (status) {
      case 'in-progress':
        return new vscode.ThemeIcon('play-circle');
      case 'done':
        return new vscode.ThemeIcon('check');
      case 'planned':
        return new vscode.ThemeIcon('list-ordered');
      case 'scoped':
        return new vscode.ThemeIcon('telescope');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }
}

/**
 * Task info needed by the projects view to display child task items.
 */
export interface ProjectTaskInfo {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly taskPath: string;
}

/**
 * Dependencies for the projects view capability.
 */
export interface ProjectsViewCapabilityDeps {
  /**
   * Load all projects sorted by display order.
   */
  readonly loadProjects: () => readonly Project[];

  /**
   * Load tasks belonging to a specific project.
   *
   * @param projectId - The project ID to filter by.
   */
  readonly loadTasksForProject: (projectId: string) => readonly ProjectTaskInfo[];
}

/**
 * Return type for the projects view capability factory.
 */
export interface CreateProjectsViewCapabilityReturn {
  /**
   * Create a TreeDataProvider for the projects view.
   */
  createTreeDataProvider(): vscode.TreeDataProvider<TreeItem>;

  /**
   * Create a callback to refresh the tree view.
   */
  createRefreshCallback(): () => void;
}

/**
 * Create a projects view capability for rendering projects in a VSCode TreeView.
 *
 * @param deps - Dependencies for loading project and task data.
 * @returns Projects view capability with tree provider and refresh callback.
 */
export function createProjectsViewCapability(deps: ProjectsViewCapabilityDeps): CreateProjectsViewCapabilityReturn {
  const onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined | void>();

  /**
   * Create a TreeDataProvider for the projects view.
   *
   * @returns A VSCode TreeDataProvider for project tree items.
   */
  function createTreeDataProvider(): vscode.TreeDataProvider<TreeItem> {
    return {
      onDidChangeTreeData: onDidChangeTreeData.event,

      getTreeItem(element: TreeItem): vscode.TreeItem {
        return element;
      },

      getChildren(element?: TreeItem): TreeItem[] {
        if (!element) {
          return getProjectItems();
        }

        if (element instanceof ProjectItem) {
          return getTasksForProject(element.project.id);
        }

        return [];
      },

      getParent(element: TreeItem): TreeItem | undefined {
        // ProjectItems are top-level; ProjectTaskItems don't need parent for now
        if (element instanceof ProjectTaskItem) {
          return undefined;
        }
        return undefined;
      }
    };
  }

  /**
   * Build sorted project items: in-progress first, then open, then done.
   */
  function getProjectItems(): ProjectItem[] {
    const projects = deps.loadProjects();
    const statusOrder: Record<ProjectStatus, number> = {
      'in-progress': 0,
      'open': 1,
      'done': 2
    };

    const sorted = [...projects].sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 1;
      const orderB = statusOrder[b.status] ?? 1;
      return orderA - orderB;
    });

    return sorted.map((project) => new ProjectItem(project));
  }

  /**
   * Build child task items for a given project.
   */
  function getTasksForProject(projectId: string): ProjectTaskItem[] {
    const tasks = deps.loadTasksForProject(projectId);
    return tasks.map((t) => new ProjectTaskItem(t.id, t.title, t.status, t.taskPath));
  }

  /**
   * Create a callback that fires the tree change event to refresh the view.
   *
   * @returns A parameterless function to trigger a refresh.
   */
  function createRefreshCallback(): () => void {
    return () => {
      onDidChangeTreeData.fire();
    };
  }

  return {
    createTreeDataProvider,
    createRefreshCallback
  };
}
