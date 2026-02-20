/**
 * Task actions computer - determines available actions based on task status.
 */

import type { Task, TaskAction } from './task-types';

/**
 * Build a command string for a task action.
 */
function buildCommand(action: string, id: string): string {
  return `/kanban-${action} ${id}`;
}

/**
 * Get available actions for a task based on its status.
 */
export function getActions(task: Task): readonly TaskAction[] {
  const id = task.id;

  switch (task.status) {
    case 'backlog':
      return [
        {
          label: 'Scope',
          command: buildCommand('scope', id),
          description: 'Research codebase and create spec',
        },
      ];

    case 'scoped':
      return [
        {
          label: 'Plan',
          command: buildCommand('plan', id),
          description: 'Create implementation plan',
        },
      ];

    case 'planned':
      return [
        {
          label: 'Implement',
          command: buildCommand('implement', id),
          description: 'Execute the plan',
        },
      ];

    case 'in-progress':
      return [
        {
          label: 'Continue',
          command: buildCommand('implement', id),
          description: 'Resume implementation',
        },
        {
          label: 'Save WIP',
          command: buildCommand('save', id),
          description: 'Commit progress and pause',
        },
      ];

    case 'codecheck':
      return [
        {
          label: 'Run Checks',
          command: buildCommand('codecheck', id),
          description: 'Run tests and linting',
        },
      ];

    case 'qa':
      return [
        {
          label: 'Approve',
          command: buildCommand('approve', id),
          description: 'QA passed, commit code',
        },
        {
          label: 'Rework',
          command: buildCommand('rework', id),
          description: 'Send back for fixes',
        },
      ];

    case 'update-docs':
      return [
        {
          label: 'Update Docs',
          command: buildCommand('docs', id),
          description: 'Update documentation',
        },
      ];

    case 'pr':
      return [
        {
          label: 'Merge',
          command: buildCommand('merge', id),
          description: 'Merge to main',
        },
        {
          label: 'Rework',
          command: buildCommand('rework', id),
          description: 'Send back for fixes',
        },
      ];

    case 'done':
      return [];

    default:
      return [];
  }
}

/**
 * Extract the hook name from a command string.
 * "/kanban-scope 001" -> "kanban-scope"
 */
export function getHookName(command: string): string {
  const match = command.match(/^\/([^\s]+)/);
  return match ? match[1] : '';
}
