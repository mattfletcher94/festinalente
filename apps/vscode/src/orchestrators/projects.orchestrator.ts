/**
 * Projects Orchestrator
 *
 * Policy decisions for project management: loading, viewing, and task counting.
 * Coordinates project-related capabilities and computers.
 */

import * as vscode from 'vscode';

import type { Project } from '../types/project-types';
import type { Task } from '../types/task-types';
import type { ProjectTaskInfo } from '../capabilities/projects-view.capability';
import { createProjectsViewCapability } from '../capabilities/projects-view.capability';
import type { CreateTerminalOrchestratorReturn } from './terminal.orchestrator';
import type { createFileSystemCapability } from '../capabilities/file-system.capability';
import { createProjectParserComputer } from '../computers/project-parser.computer';
import { createTaskParserComputer } from '../computers/task-parser.computer';

/**
 * Dependencies required by the projects orchestrator.
 */
export interface ProjectsOrchestratorDeps {
  readonly fs: ReturnType<typeof createFileSystemCapability>;
  readonly festinalenteDir: string;
  readonly terminal: CreateTerminalOrchestratorReturn;
}

/**
 * Return type for the projects orchestrator factory.
 */
export interface CreateProjectsOrchestratorReturn {
  /**
   * TreeDataProvider for the projects view.
   */
  readonly treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem>;

  /**
   * Refresh the projects view.
   */
  readonly refresh: () => void;

  /**
   * Load all projects from the projects folder.
   */
  readonly loadAllProjects: () => readonly Project[];

  /**
   * Register project-related commands.
   *
   * @param context - Extension context for subscriptions.
   */
  readonly registerCommands: (context: vscode.ExtensionContext) => void;

  /**
   * Create file watcher for project files.
   *
   * @param festinalentePath - Path to the .festinalente folder.
   * @returns Disposable file watcher.
   */
  readonly createFileWatcher: (festinalentePath: string) => vscode.Disposable;
}

/**
 * Create a projects orchestrator for project domain policy.
 *
 * @param deps - Dependencies for the orchestrator.
 * @returns Projects orchestrator with domain policy.
 */
export function createProjectsOrchestrator(deps: ProjectsOrchestratorDeps): CreateProjectsOrchestratorReturn {
  const projectParser = createProjectParserComputer();
  const taskParser = createTaskParserComputer();

  /**
   * Policy: Load all tasks and return them for project-task matching.
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
   * Policy: Load all projects from .festinalente/projects directory.
   * Counts tasks per project by scanning tasks for matching project-id.
   */
  function loadAllProjects(): readonly Project[] {
    const projectsDir = deps.fs.joinPath(deps.festinalenteDir, 'projects');
    if (!deps.fs.exists(projectsDir)) {
      return [];
    }

    const allTasks = loadAllTasks();
    const projects: Project[] = [];

    try {
      const entries = deps.fs.readDir(projectsDir);

      for (const entry of entries) {
        const projectPath = deps.fs.joinPath(projectsDir, entry);
        if (!deps.fs.isDirectory(projectPath)) continue;

        const projectXml = deps.fs.joinPath(projectPath, 'project.xml');
        if (deps.fs.exists(projectXml)) {
          try {
            const content = deps.fs.readFile(projectXml);
            const parsed = projectParser.parseProjectXml(content);

            const projectTasks = allTasks.filter((t) => t.projectId === parsed.id);
            const completedCount = projectTasks.filter((t) => t.status === 'done').length;

            const project = projectParser.parseProjectWithPath(
              content,
              projectPath,
              projectTasks.length,
              completedCount
            );
            projects.push(project);
          } catch (err) {
            console.error(`Failed to parse ${projectXml}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to read projects directory:', err);
    }

    return projects;
  }

  /**
   * Policy: Load tasks belonging to a specific project.
   *
   * @param projectId - The project ID to filter tasks by.
   * @returns Array of task info for the project.
   */
  function loadTasksForProject(projectId: string): readonly ProjectTaskInfo[] {
    const allTasks = loadAllTasks();
    return allTasks
      .filter((t) => t.projectId === projectId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        taskPath: t.taskPath
      }));
  }

  // Initialize view capability with dependencies
  const projectsView = createProjectsViewCapability({
    loadProjects: loadAllProjects,
    loadTasksForProject
  });

  // Create providers
  const treeDataProvider = projectsView.createTreeDataProvider();
  const refreshTree = projectsView.createRefreshCallback();

  /**
   * Refresh the projects tree view.
   */
  function refresh(): void {
    refreshTree();
  }

  /**
   * Register project-related commands.
   *
   * @param context - Extension context for subscriptions.
   */
  function registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.commands.registerCommand('festinalente.refreshProjects', () => {
        refresh();
        vscode.window.showInformationMessage('Festina Lente projects refreshed');
      })
    );
  }

  /**
   * Create file watcher for project and task files.
   *
   * @param festinalentePath - Path to the .festinalente folder.
   * @returns Disposable file watcher.
   */
  function createFileWatcher(festinalentePath: string): vscode.Disposable {
    const projectWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(festinalentePath, 'projects/**/*.xml')
    );
    const taskWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(festinalentePath, 'tasks/**/*.xml')
    );

    projectWatcher.onDidChange(() => refresh());
    projectWatcher.onDidCreate(() => refresh());
    projectWatcher.onDidDelete(() => refresh());

    taskWatcher.onDidChange(() => refresh());
    taskWatcher.onDidCreate(() => refresh());
    taskWatcher.onDidDelete(() => refresh());

    return {
      dispose(): void {
        projectWatcher.dispose();
        taskWatcher.dispose();
      }
    };
  }

  return {
    treeDataProvider,
    refresh,
    loadAllProjects,
    registerCommands,
    createFileWatcher
  };
}
