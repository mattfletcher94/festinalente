import type { Task, TaskAction, TaskId } from './task-types';

/**
 * Return type for the task actions computer.
 */
export interface CreateTaskActionsComputerReturn {
  /**
   * Get available actions for a task based on its status.
   *
   * @param task - The task to get actions for.
   * @returns Array of available actions.
   */
  getActions(task: Task): readonly TaskAction[];

  /**
   * Get the badge variant for a task status.
   *
   * @param status - The task status.
   * @returns The badge variant.
   */
  getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline';

  /**
   * Get the badge variant for a label.
   *
   * @param label - The label name.
   * @returns The badge variant.
   */
  getLabelVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline';

  /**
   * Get CSS classes for a priority badge.
   *
   * @param priority - The priority level.
   * @returns CSS class string.
   */
  getPriorityClasses(priority: string): string;

  /**
   * Extract the hook name from a command string.
   *
   * @param command - The command string (e.g., '/kanban-scope 001').
   * @returns The hook name (e.g., 'kanban-scope'), or empty string if not found.
   */
  getHookName(command: string): string;
}

/**
 * Create a task actions computer.
 *
 * @returns The task actions computer instance.
 */
export function createTaskActionsComputer(): CreateTaskActionsComputerReturn {
  /**
   * Build a command string for a task action.
   */
  function buildCommand(action: string, id: TaskId): string {
    return `/kanban-${action} ${id}`;
  }

  function getActions(task: Task): readonly TaskAction[] {
    const id = task.id;

    switch (task.status) {
      case 'backlog':
        return [
          {
            label: 'Scope',
            command: buildCommand('scope', id),
            variant: 'default',
            description: 'Research codebase and create spec',
          },
        ];

      case 'scoped':
        return [
          {
            label: 'Plan',
            command: buildCommand('plan', id),
            variant: 'default',
            description: 'Create implementation plan',
          },
        ];

      case 'planned':
        return [
          {
            label: 'Implement',
            command: buildCommand('implement', id),
            variant: 'default',
            description: 'Execute the plan',
          },
        ];

      case 'in-progress':
        return [
          {
            label: 'Continue',
            command: buildCommand('implement', id),
            variant: 'default',
            description: 'Resume implementation',
          },
          {
            label: 'Save WIP',
            command: buildCommand('save', id),
            variant: 'outline',
            description: 'Commit progress and pause',
          },
        ];

      case 'codecheck':
        return [
          {
            label: 'Run Checks',
            command: buildCommand('codecheck', id),
            variant: 'default',
            description: 'Run tests and linting',
          },
        ];

      case 'qa':
        return [
          {
            label: 'Approve',
            command: buildCommand('approve', id),
            variant: 'default',
            description: 'QA passed, commit code',
          },
          {
            label: 'Rework',
            command: buildCommand('rework', id),
            variant: 'outline',
            description: 'Send back for fixes',
          },
        ];

      case 'update-docs':
        return [
          {
            label: 'Update Docs',
            command: buildCommand('docs', id),
            variant: 'default',
            description: 'Update documentation',
          },
        ];

      case 'pr':
        return [
          {
            label: 'Merge',
            command: buildCommand('merge', id),
            variant: 'default',
            description: 'Merge to main',
          },
          {
            label: 'Rework',
            command: buildCommand('rework', id),
            variant: 'outline',
            description: 'Send back for fixes',
          },
        ];

      case 'done':
        return [];

      default:
        return [];
    }
  }

  function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'in-progress':
      case 'codecheck':
      case 'qa':
        return 'default';
      case 'done':
        return 'secondary';
      default:
        return 'outline';
    }
  }

  function getLabelVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (label) {
      case 'bug':
        return 'destructive';
      case 'feature':
        return 'default';
      default:
        return 'secondary';
    }
  }

  function getPriorityClasses(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  function getHookName(command: string): string {
    // "/kanban-scope 001" -> "kanban-scope"
    const match = command.match(/^\/([^\s]+)/);
    return match ? match[1] : '';
  }

  return {
    getActions,
    getStatusVariant,
    getLabelVariant,
    getPriorityClasses,
    getHookName,
  };
}
