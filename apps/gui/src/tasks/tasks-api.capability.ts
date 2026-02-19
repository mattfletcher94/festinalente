/**
 * Tasks API capability - handles Electron IPC for task operations.
 */

import type { Task, TaskFiles, TaskId } from './task-types';

/**
 * Return type for the tasks API capability.
 */
export interface CreateTasksApiCapabilityReturn {
  /**
   * List all tasks in a project.
   *
   * @param projectPath - Path to the project directory.
   * @returns Promise resolving to array of tasks.
   */
  listTasks(projectPath: string): Promise<Task[]>;

  /**
   * Get available files for a task (task.xml, spec.xml, plan.xml).
   *
   * @param projectPath - Path to the project directory.
   * @param taskId - The task ID.
   * @returns Promise resolving to available files.
   */
  getAvailableFiles(projectPath: string, taskId: TaskId): Promise<TaskFiles>;

  /**
   * Read the task.xml content.
   *
   * @param projectPath - Path to the project directory.
   * @param taskId - The task ID.
   * @returns Promise resolving to file content.
   */
  readTaskFile(projectPath: string, taskId: TaskId): Promise<string>;

  /**
   * Read the spec.xml content.
   *
   * @param projectPath - Path to the project directory.
   * @param taskId - The task ID.
   * @returns Promise resolving to file content or empty string.
   */
  readSpecFile(projectPath: string, taskId: TaskId): Promise<string>;

  /**
   * Read the plan.xml content.
   *
   * @param projectPath - Path to the project directory.
   * @param taskId - The task ID.
   * @returns Promise resolving to file content or empty string.
   */
  readPlanFile(projectPath: string, taskId: TaskId): Promise<string>;
}

/**
 * Create a tasks API capability.
 *
 * @returns The tasks API capability instance.
 */
export function createTasksApiCapability(): CreateTasksApiCapabilityReturn {
  async function listTasks(projectPath: string): Promise<Task[]> {
    const result = await window.electronAPI.listTasks(projectPath);
    return result as Task[];
  }

  async function getAvailableFiles(projectPath: string, taskId: TaskId): Promise<TaskFiles> {
    return window.electronAPI.getAvailableTaskFiles(projectPath, taskId);
  }

  async function readTaskFile(projectPath: string, taskId: TaskId): Promise<string> {
    return window.electronAPI.readTaskFile(projectPath, taskId);
  }

  async function readSpecFile(projectPath: string, taskId: TaskId): Promise<string> {
    const content = await window.electronAPI.readSpecFile(projectPath, taskId);
    return content || '';
  }

  async function readPlanFile(projectPath: string, taskId: TaskId): Promise<string> {
    const content = await window.electronAPI.readPlanFile(projectPath, taskId);
    return content || '';
  }

  return {
    listTasks,
    getAvailableFiles,
    readTaskFile,
    readSpecFile,
    readPlanFile,
  };
}
