/**
 * Task handler - commands for task operations.
 *
 * @module cli/handlers/task
 */

import type { CliCommand, CliResult } from '../types';
import { error, getStringFlag, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { XmlParserComputer } from '../computers/xml-parser.computer';
import { defineCommand } from '../registry';
import slugify from 'slugify';

const TASKS_DIR = '.festinalente/tasks';
const MAX_SLUG_LENGTH = 50;

/**
 * Task info result.
 */
export interface TaskInfo {
  readonly id: string;
  readonly filename: string;
  readonly path: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly labels: readonly string[];
}

/**
 * List tasks result.
 */
export interface ListTasksResult {
  readonly count: number;
  readonly tasks: readonly TaskInfo[];
}

/**
 * Next ID result.
 */
export interface NextIdResult {
  readonly nextId: string;
  readonly currentHighest: string | null;
  readonly slug: string;
}

/**
 * Delete task result.
 */
export interface DeleteTaskResult {
  readonly success: true;
  readonly id: string;
  readonly title: string;
  readonly path: string;
}

/**
 * Plan task result.
 */
export interface PlanTaskResult {
  readonly taskId: string;
  readonly name: string;
  readonly files: string;
  readonly requirements: string;
  readonly pattern: string;
  readonly context: readonly string[];
  readonly action: string;
  readonly verify: string;
  readonly done: string;
  readonly completed: boolean;
}

/**
 * Plan task context result.
 */
export interface PlanTaskContextResult {
  readonly taskId: string;
  readonly files: readonly string[];
}

/**
 * Dependencies for task handler.
 */
export interface TaskHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly xmlParser: XmlParserComputer;
}

/**
 * Task handler interface.
 */
export interface TaskHandler {
  readonly findTask: (args: string[]) => CliResult<TaskInfo>;
  readonly listTasks: (args: string[]) => CliResult<ListTasksResult>;
  readonly deleteTask: (args: string[]) => CliResult<DeleteTaskResult>;
  readonly nextId: (args: string[]) => CliResult<NextIdResult>;
  readonly getPlanTask: (args: string[]) => CliResult<PlanTaskResult>;
  readonly getPlanTaskContext: (args: string[]) => CliResult<PlanTaskContextResult>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a task handler.
 *
 * @param deps - The dependencies.
 * @returns A TaskHandler instance.
 */
export function createTaskHandler(deps: TaskHandlerDeps): TaskHandler {
  const { fs, xmlParser } = deps;

  /**
   * Find task file by numeric prefix.
   */
  function findTaskFile(id: string): { path: string; folderId: string } | null {
    const numericMatch = id.match(/^(\d+)/);
    if (!numericMatch) {
      return null;
    }
    const numericPrefix = numericMatch[1];

    if (!fs.exists(TASKS_DIR)) {
      return null;
    }

    const result = fs.listDirectories(TASKS_DIR);
    if (!result.ok) {
      return null;
    }

    for (const folder of result.value) {
      const folderMatch = folder.match(/^(\d+)/);
      if (folderMatch && folderMatch[1] === numericPrefix) {
        const taskPath = fs.joinPath(TASKS_DIR, folder, 'task.xml');
        if (fs.exists(taskPath)) {
          return { path: taskPath.replace(/\\/g, '/'), folderId: folder };
        }
      }
    }

    return null;
  }

  /**
   * Find task command.
   */
  function findTask(args: string[]): CliResult<TaskInfo> {
    if (args.length === 0) {
      return error('Usage: find-task <id>');
    }

    const id = args[0];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const found = findTaskFile(id);
    if (!found) {
      return error(`Task ${id} not found in ${TASKS_DIR}/`);
    }

    const readResult = fs.readFile(found.path);
    if (!readResult.ok) {
      return error(`Failed to read task file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parseTaskXml(readResult.value);

    return success({
      id: found.folderId,
      filename: 'task.xml',
      path: found.path,
      title: parsed.title,
      status: parsed.status,
      priority: parsed.priority,
      labels: parsed.labels
    });
  }

  /**
   * List tasks command.
   */
  function listTasks(args: string[]): CliResult<ListTasksResult> {
    const parsed = parseArgs(args);

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const dirsResult = fs.listDirectories(TASKS_DIR);
    if (!dirsResult.ok) {
      return error(`Failed to read tasks directory: ${dirsResult.error.message}`);
    }

    const folders = [...dirsResult.value].sort();
    const tasks: TaskInfo[] = [];

    for (const folderId of folders) {
      const filePath = fs.joinPath(TASKS_DIR, folderId, 'task.xml').replace(/\\/g, '/');

      if (!fs.exists(filePath)) continue;

      const readResult = fs.readFile(filePath);
      if (!readResult.ok) continue;

      const parsedTask = xmlParser.parseTaskXml(readResult.value);

      const task: TaskInfo = {
        id: folderId,
        filename: 'task.xml',
        path: filePath,
        title: parsedTask.title,
        status: parsedTask.status,
        priority: parsedTask.priority,
        labels: parsedTask.labels
      };

      // Apply filters
      const statusFilter = getStringFlag(parsed.flags, 'status');
      const excludeStatus = getStringFlag(parsed.flags, 'exclude-status');
      const priorityFilter = getStringFlag(parsed.flags, 'priority');
      const labelFilter = getStringFlag(parsed.flags, 'label');

      if (statusFilter && task.status !== statusFilter) continue;
      if (excludeStatus && task.status === excludeStatus) continue;
      if (priorityFilter && task.priority !== priorityFilter) continue;
      if (labelFilter && !task.labels.includes(labelFilter)) continue;

      tasks.push(task);
    }

    return success({
      count: tasks.length,
      tasks
    });
  }

  /**
   * Delete task command.
   */
  function deleteTask(args: string[]): CliResult<DeleteTaskResult> {
    if (args.length === 0) {
      return error('Usage: delete-task <id>');
    }

    const id = args[0];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const taskPath = fs.joinPath(TASKS_DIR, id, 'task.xml').replace(/\\/g, '/');

    if (!fs.exists(taskPath)) {
      return error(`Task ${id} not found in ${TASKS_DIR}/${id}/`);
    }

    const readResult = fs.readFile(taskPath);
    if (!readResult.ok) {
      return error(`Failed to read task file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parseTaskXml(readResult.value);

    // Validate status - only backlog allowed
    if (parsed.status !== 'backlog') {
      return error(`Cannot delete task in ${parsed.status} status. Only backlog allowed.`);
    }

    // Delete the entire task folder using fs.rmSync equivalent
    // Note: We can't use deleteFile for directories, so we need to handle this specially
    // For now, return success and let the caller handle the actual deletion via shell
    return success({
      success: true,
      id,
      title: parsed.title,
      path: taskPath
    });
  }

  /**
   * Next ID command.
   */
  function nextId(args: string[]): CliResult<NextIdResult> {
    const parsed = parseArgs(args);
    const title = getStringFlag(parsed.flags, 'title');

    if (!title) {
      return error('Usage: next-id --title="Task title"');
    }

    const padding = 3;

    // Generate slug from title
    const slug = slugify(title, { lower: true, strict: true }).slice(0, MAX_SLUG_LENGTH);

    if (!fs.exists(TASKS_DIR)) {
      const paddedNumber = '1'.padStart(padding, '0');
      return success({
        nextId: `${paddedNumber}-${slug}`,
        currentHighest: null,
        slug
      });
    }

    const dirsResult = fs.listDirectories(TASKS_DIR);
    if (!dirsResult.ok || dirsResult.value.length === 0) {
      const paddedNumber = '1'.padStart(padding, '0');
      return success({
        nextId: `${paddedNumber}-${slug}`,
        currentHighest: null,
        slug
      });
    }

    // Find highest ID
    let highest = 0;

    for (const folderName of dirsResult.value) {
      const match = folderName.match(/^(\d+)/);
      if (match) {
        const id = parseInt(match[1], 10);
        if (!isNaN(id) && id > highest) {
          highest = id;
        }
      }
    }

    const paddedNumber = (highest + 1).toString().padStart(padding, '0');
    const currentHighest = highest.toString().padStart(padding, '0');

    return success({
      nextId: `${paddedNumber}-${slug}`,
      currentHighest,
      slug
    });
  }

  /**
   * Get a single task from plan.xml by task ID.
   *
   * @param args - Command arguments: [festina-task-id, plan-task-id].
   * @returns The plan task details or an error.
   */
  function getPlanTask(args: string[]): CliResult<PlanTaskResult> {
    if (args.length < 2) {
      return error('Usage: get-plan-task <festina-task-id> <plan-task-id>');
    }

    const festinaTaskId = args[0];
    const planTaskId = args[1];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const found = findTaskFile(festinaTaskId);
    if (!found) {
      return error(`Task ${festinaTaskId} not found in ${TASKS_DIR}/`);
    }

    const planPath = fs.joinPath(TASKS_DIR, found.folderId, 'plan.xml').replace(/\\/g, '/');

    if (!fs.exists(planPath)) {
      return error(`Plan file not found at ${planPath}`);
    }

    const readResult = fs.readFile(planPath);
    if (!readResult.ok) {
      return error(`Failed to read plan file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parsePlanTask(readResult.value, planTaskId);

    if (!parsed) {
      return error(`Task ${planTaskId} not found in plan.xml`);
    }

    return success({
      taskId: parsed.taskId,
      name: parsed.name,
      files: parsed.files,
      requirements: parsed.requirements,
      pattern: parsed.pattern,
      context: parsed.context,
      action: parsed.action,
      verify: parsed.verify,
      done: parsed.done,
      completed: parsed.completed
    });
  }

  /**
   * Get the context files for a task from plan.xml.
   *
   * @param args - Command arguments: [festina-task-id, plan-task-id].
   * @returns The context file paths or an error.
   */
  function getPlanTaskContext(args: string[]): CliResult<PlanTaskContextResult> {
    if (args.length < 2) {
      return error('Usage: get-plan-task-context <festina-task-id> <plan-task-id>');
    }

    const festinaTaskId = args[0];
    const planTaskId = args[1];

    if (!fs.exists(TASKS_DIR)) {
      return error(`${TASKS_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const found = findTaskFile(festinaTaskId);
    if (!found) {
      return error(`Task ${festinaTaskId} not found in ${TASKS_DIR}/`);
    }

    const planPath = fs.joinPath(TASKS_DIR, found.folderId, 'plan.xml').replace(/\\/g, '/');

    if (!fs.exists(planPath)) {
      return error(`Plan file not found at ${planPath}`);
    }

    const readResult = fs.readFile(planPath);
    if (!readResult.ok) {
      return error(`Failed to read plan file: ${readResult.error.message}`);
    }

    const parsed = xmlParser.parsePlanTaskContext(readResult.value, planTaskId);

    if (!parsed) {
      return error(`Task ${planTaskId} not found in plan.xml`);
    }

    return success({
      taskId: parsed.taskId,
      files: parsed.files
    });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand('find-task', 'Find a task by ID', 'find-task <id>', findTask),
      defineCommand(
        'list-tasks',
        'List all tasks with optional filtering',
        'list-tasks [--status=X] [--exclude-status=X] [--label=X] [--priority=X]',
        listTasks
      ),
      defineCommand('delete-task', 'Delete a task (backlog status only)', 'delete-task <id>', deleteTask),
      defineCommand('next-id', 'Get the next available task ID', 'next-id --title="Task title"', nextId),
      defineCommand(
        'get-plan-task',
        'Get a single task from plan.xml by task ID',
        'get-plan-task <festina-task-id> <plan-task-id>',
        getPlanTask
      ),
      defineCommand(
        'get-plan-task-context',
        'Get context files for a task from plan.xml',
        'get-plan-task-context <festina-task-id> <plan-task-id>',
        getPlanTaskContext
      )
    ];
  }

  return {
    findTask,
    listTasks,
    deleteTask,
    nextId,
    getPlanTask,
    getPlanTaskContext,
    getCommands
  };
}
