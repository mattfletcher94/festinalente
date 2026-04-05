/**
 * Project handler - commands for project operations.
 *
 * @module cli/handlers/project
 */

import type { CliCommand, CliResult } from '../types';
import { error, getStringFlag, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { XmlParserComputer } from '../computers/xml-parser.computer';
import { defineCommand } from '../registry';
import slugify from 'slugify';

const PROJECTS_DIR = '.festinalente/projects';
const TASKS_DIR = '.festinalente/tasks';
const MAX_SLUG_LENGTH = 50;

/**
 * Project info result returned by find-project.
 */
export interface ProjectInfo {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly status: string;
  readonly taskCount: number;
}

/**
 * List projects result returned by list-projects.
 */
export interface ListProjectsResult {
  readonly count: number;
  readonly projects: readonly ProjectInfo[];
}

/**
 * Next project ID result returned by next-project-id.
 */
export interface NextProjectIdResult {
  readonly nextId: string;
  readonly currentHighest: number;
  readonly slug: string;
}

/**
 * Project task info returned by get-project-tasks.
 */
export interface ProjectTaskInfo {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly requirements: readonly string[];
}

/**
 * Get project tasks result returned by get-project-tasks.
 */
export interface GetProjectTasksResult {
  readonly count: number;
  readonly tasks: readonly ProjectTaskInfo[];
}

/**
 * Project progress result returned by get-project-progress.
 */
export interface ProjectProgressResult {
  readonly total: number;
  readonly backlog: number;
  readonly scoped: number;
  readonly planned: number;
  readonly inProgress: number;
  readonly finalize: number;
  readonly awaitingCompletion: number;
  readonly done: number;
}

/**
 * Project sibling info returned by get-project-siblings.
 */
export interface ProjectSiblingInfo {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly description: string;
}

/**
 * Get project siblings result returned by get-project-siblings.
 */
export interface GetProjectSiblingsResult {
  readonly projectId: string;
  readonly projectTitle: string;
  readonly siblings: readonly ProjectSiblingInfo[];
}

/**
 * Dependencies for project handler.
 */
export interface ProjectHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly xmlParser: XmlParserComputer;
}

/**
 * Project handler interface.
 */
export interface ProjectHandler {
  /**
   * Get all command definitions for this handler.
   *
   * @returns Array of CLI command definitions.
   */
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a project handler with injected dependencies.
 *
 * @param deps - The dependencies for the project handler.
 * @returns A ProjectHandler instance.
 */
export function createProjectHandler(deps: ProjectHandlerDeps): ProjectHandler {
  const { fs, xmlParser } = deps;

  /**
   * Status-to-progress-key mapping for counting tasks by status.
   */
  const statusKeyMap: Record<string, keyof ProjectProgressResult> = {
    'backlog': 'backlog',
    'scoped': 'scoped',
    'planned': 'planned',
    'in-progress': 'inProgress',
    'finalize': 'finalize',
    'awaiting-completion': 'awaitingCompletion',
    'done': 'done'
  };

  /**
   * Resolve a project folder by ID (exact match or P-prefix-only match).
   *
   * @param id - The project ID or prefix to resolve.
   * @returns The matching folder name and project.xml path, or null.
   */
  function resolveProjectFolder(id: string): { readonly folder: string; readonly projectPath: string } | null {
    if (!fs.exists(PROJECTS_DIR)) return null;
    const dirsResult = fs.listDirectories(PROJECTS_DIR);
    if (!dirsResult.ok) return null;

    const folders = dirsResult.value;

    // Exact match first
    const exact = folders.find((f) => f === id);
    if (exact) {
      const projectPath = fs.joinPath(PROJECTS_DIR, exact, 'project.xml').replace(/\\/g, '/');
      if (fs.exists(projectPath)) return { folder: exact, projectPath };
    }

    // P-prefix-only match (e.g., "P001" matches "P001-user-auth")
    const prefixMatch = folders.find((f) => f.startsWith(id + '-') || f === id);
    if (prefixMatch) {
      const projectPath = fs.joinPath(PROJECTS_DIR, prefixMatch, 'project.xml').replace(/\\/g, '/');
      if (fs.exists(projectPath)) return { folder: prefixMatch, projectPath };
    }

    return null;
  }

  /**
   * Scan all tasks for those matching a given project ID.
   *
   * @param projectId - The project ID to match against task project-id attributes.
   * @returns Array of project task info objects.
   */
  function scanTasksForProject(projectId: string): readonly ProjectTaskInfo[] {
    if (!fs.exists(TASKS_DIR)) return [];

    const dirsResult = fs.listDirectories(TASKS_DIR);
    if (!dirsResult.ok) return [];

    return dirsResult.value
      .map((folder) => {
        const taskPath = fs.joinPath(TASKS_DIR, folder, 'task.xml').replace(/\\/g, '/');
        if (!fs.exists(taskPath)) return null;

        const readResult = fs.readFile(taskPath);
        if (!readResult.ok) return null;

        const parsed = xmlParser.parseTaskXml(readResult.value);
        if (parsed.projectId !== projectId) return null;

        return {
          id: folder,
          title: parsed.title,
          status: parsed.status,
          priority: parsed.priority,
          requirements: parsed.projectRequirements ?? []
        };
      })
      .filter((t): t is ProjectTaskInfo => t !== null);
  }

  /**
   * Get the next available project ID.
   *
   * @param args - Command arguments with --title flag.
   * @returns The next project ID result.
   */
  function nextProjectId(args: string[]): CliResult<NextProjectIdResult> {
    const parsed = parseArgs(args);
    const title = getStringFlag(parsed.flags, 'title');

    if (!title) {
      return error('Usage: next-project-id --title="Project title"');
    }

    const slug = slugify(title, { lower: true, strict: true }).slice(0, MAX_SLUG_LENGTH);
    const padding = 3;

    if (!fs.exists(PROJECTS_DIR)) {
      return success({
        nextId: `P${'1'.padStart(padding, '0')}-${slug}`,
        currentHighest: 0,
        slug
      });
    }

    const dirsResult = fs.listDirectories(PROJECTS_DIR);
    if (!dirsResult.ok || dirsResult.value.length === 0) {
      return success({
        nextId: `P${'1'.padStart(padding, '0')}-${slug}`,
        currentHighest: 0,
        slug
      });
    }

    const highest = dirsResult.value.reduce((max, folderName) => {
      const match = folderName.match(/^P(\d+)/);
      if (!match) return max;
      const num = parseInt(match[1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);

    const paddedNumber = (highest + 1).toString().padStart(padding, '0');

    return success({
      nextId: `P${paddedNumber}-${slug}`,
      currentHighest: highest,
      slug
    });
  }

  /**
   * Find a project by ID.
   *
   * @param args - Command arguments with project ID.
   * @returns The project info result.
   */
  function findProject(args: string[]): CliResult<ProjectInfo> {
    if (args.length === 0) {
      return error('Usage: find-project <id>');
    }

    const id = args[0];

    if (!fs.exists(PROJECTS_DIR)) {
      return error(`${PROJECTS_DIR}/ directory not found.`);
    }

    const resolved = resolveProjectFolder(id);
    if (!resolved) {
      return error(`Project ${id} not found in ${PROJECTS_DIR}/`);
    }

    const readResult = fs.readFile(resolved.projectPath);
    if (!readResult.ok) {
      return error(`Failed to read project file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parseProjectXml(readResult.value);

    return success({
      id: resolved.folder,
      path: resolved.projectPath,
      title: parsed.title,
      status: parsed.status,
      taskCount: parsed.tasks.length
    });
  }

  /**
   * List all projects with optional status filter.
   *
   * @param args - Command arguments with optional --status flag.
   * @returns The list projects result.
   */
  function listProjects(args: string[]): CliResult<ListProjectsResult> {
    const parsed = parseArgs(args);
    const statusFilter = getStringFlag(parsed.flags, 'status');

    if (!fs.exists(PROJECTS_DIR)) {
      return success({ count: 0, projects: [] });
    }

    const dirsResult = fs.listDirectories(PROJECTS_DIR);
    if (!dirsResult.ok) {
      return error(`Failed to read projects directory: ${dirsResult.error.message}`);
    }

    const projects = dirsResult.value
      .sort()
      .map((folder) => {
        const projectPath = fs.joinPath(PROJECTS_DIR, folder, 'project.xml').replace(/\\/g, '/');
        if (!fs.exists(projectPath)) return null;

        const readResult = fs.readFile(projectPath);
        if (!readResult.ok) return null;

        const parsedProject = xmlParser.parseProjectXml(readResult.value);

        if (statusFilter && parsedProject.status !== statusFilter) return null;

        return {
          id: folder,
          path: projectPath,
          title: parsedProject.title,
          status: parsedProject.status,
          taskCount: parsedProject.tasks.length
        };
      })
      .filter((p): p is ProjectInfo => p !== null);

    return success({
      count: projects.length,
      projects
    });
  }

  /**
   * Get all tasks belonging to a project.
   *
   * @param args - Command arguments with project ID.
   * @returns The project tasks result.
   */
  function getProjectTasks(args: string[]): CliResult<GetProjectTasksResult> {
    if (args.length === 0) {
      return error('Usage: get-project-tasks <project-id>');
    }

    const projectId = args[0];

    // Resolve the project to verify it exists
    const resolved = resolveProjectFolder(projectId);
    if (!resolved) {
      return error(`Project ${projectId} not found in ${PROJECTS_DIR}/`);
    }

    const tasks = scanTasksForProject(resolved.folder);

    return success({
      count: tasks.length,
      tasks
    });
  }

  /**
   * Get progress counts for a project.
   *
   * @param args - Command arguments with project ID.
   * @returns The project progress result with counts by status.
   */
  function getProjectProgress(args: string[]): CliResult<ProjectProgressResult> {
    if (args.length === 0) {
      return error('Usage: get-project-progress <project-id>');
    }

    const projectId = args[0];

    const resolved = resolveProjectFolder(projectId);
    if (!resolved) {
      return error(`Project ${projectId} not found in ${PROJECTS_DIR}/`);
    }

    const tasks = scanTasksForProject(resolved.folder);

    const counts: Record<keyof ProjectProgressResult, number> = {
      total: tasks.length,
      backlog: 0,
      scoped: 0,
      planned: 0,
      inProgress: 0,
      finalize: 0,
      awaitingCompletion: 0,
      done: 0
    };

    for (const task of tasks) {
      const key = statusKeyMap[task.status];
      if (key && key !== 'total') {
        counts[key]++;
      }
    }

    return success(counts);
  }

  /**
   * Get sibling tasks for a given task within its project.
   *
   * @param args - Command arguments with task ID.
   * @returns The project siblings result.
   */
  function getProjectSiblings(args: string[]): CliResult<GetProjectSiblingsResult> {
    if (args.length === 0) {
      return error('Usage: get-project-siblings <task-id>');
    }

    const taskId = args[0];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found.`);
    }

    // Resolve the task folder
    const dirsResult = fs.listDirectories(TASKS_DIR);
    if (!dirsResult.ok) {
      return error(`Failed to read tasks directory: ${dirsResult.error.message}`);
    }

    const taskFolder = dirsResult.value.find(
      (f) => f === taskId || f.startsWith(taskId + '-') || (f.match(/^(\d+)/) && f.match(/^(\d+)/)?.[1] === taskId)
    );
    if (!taskFolder) {
      return error(`Task ${taskId} not found in ${TASKS_DIR}/`);
    }

    const taskPath = fs.joinPath(TASKS_DIR, taskFolder, 'task.xml').replace(/\\/g, '/');
    if (!fs.exists(taskPath)) {
      return error(`Task file not found at ${taskPath}`);
    }

    const readResult = fs.readFile(taskPath);
    if (!readResult.ok) {
      return error(`Failed to read task file: ${readResult.error.message}`);
    }

    const parsedTask = xmlParser.parseTaskXml(readResult.value);

    if (!parsedTask.projectId) {
      return error('Task is not part of a project');
    }

    const resolved = resolveProjectFolder(parsedTask.projectId);
    if (!resolved) {
      return error(`Project ${parsedTask.projectId} not found in ${PROJECTS_DIR}/`);
    }

    const projectReadResult = fs.readFile(resolved.projectPath);
    if (!projectReadResult.ok) {
      return error(`Failed to read project file: ${projectReadResult.error.message}`);
    }

    const parsedProject = xmlParser.parseProjectXml(projectReadResult.value);

    // Get all tasks for this project, excluding the input task
    const allTasks = scanTasksForProject(resolved.folder);
    const siblings: readonly ProjectSiblingInfo[] = allTasks
      .filter((t) => t.id !== taskFolder)
      .map((t) => {
        // Read description for compact sibling info
        const siblingPath = fs.joinPath(TASKS_DIR, t.id, 'task.xml').replace(/\\/g, '/');
        const siblingRead = fs.readFile(siblingPath);
        const description = siblingRead.ok ? xmlParser.parseTaskXml(siblingRead.value).description : '';

        return {
          id: t.id,
          title: t.title,
          status: t.status,
          description
        };
      });

    return success({
      projectId: resolved.folder,
      projectTitle: parsedProject.title,
      siblings
    });
  }

  /**
   * Get all command definitions for this handler.
   *
   * @returns Array of CLI command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'next-project-id',
        'Get the next available project ID',
        'next-project-id --title="Project title"',
        nextProjectId
      ),
      defineCommand('find-project', 'Find a project by ID', 'find-project <id>', findProject),
      defineCommand(
        'list-projects',
        'List all projects with optional filtering',
        'list-projects [--status=X]',
        listProjects
      ),
      defineCommand(
        'get-project-tasks',
        'Get all tasks belonging to a project',
        'get-project-tasks <project-id>',
        getProjectTasks
      ),
      defineCommand(
        'get-project-progress',
        'Get progress counts for a project',
        'get-project-progress <project-id>',
        getProjectProgress
      ),
      defineCommand(
        'get-project-siblings',
        'Get sibling tasks for a task within its project',
        'get-project-siblings <task-id>',
        getProjectSiblings
      )
    ];
  }

  return {
    getCommands
  };
}
