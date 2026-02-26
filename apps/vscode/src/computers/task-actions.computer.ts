/**
 * Task actions computer - pure functions for computing task actions.
 */

import type { Task, TaskAction, TaskStatus } from '../types/task-types';

export interface CreateTaskActionsComputerReturn {
  getActions(task: Task): readonly TaskAction[];
  buildCommand(action: string, id: string): string;
}

export function createTaskActionsComputer(): CreateTaskActionsComputerReturn {
  function buildCommand(action: string, id: string): string {
    return `/festina-${action} ${id}`;
  }

  function getActions(task: Task): readonly TaskAction[] {
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

      case 'check':
        return [
          {
            label: 'Check',
            command: buildCommand('check', id),
            description: 'Run checks, QA, and commit',
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

  return {
    getActions,
    buildCommand,
  };
}
