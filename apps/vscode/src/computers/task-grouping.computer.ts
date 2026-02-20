/**
 * Task grouping computer - pure functions for grouping tasks by status.
 */

import type { Task, TaskColumn, TaskStatus } from '../types/task-types';

export interface CreateTaskGroupingComputerReturn {
  getColumns(): readonly TaskColumn[];
  groupByStatus(tasks: readonly Task[]): Map<TaskStatus, Task[]>;
  getVisibleColumns(
    columns: readonly TaskColumn[],
    grouped: Map<TaskStatus, Task[]>
  ): readonly TaskColumn[];
}

export function createTaskGroupingComputer(): CreateTaskGroupingComputerReturn {
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

  function getColumns(): readonly TaskColumn[] {
    return COLUMNS;
  }

  function groupByStatus(tasks: readonly Task[]): Map<TaskStatus, Task[]> {
    const grouped = new Map<TaskStatus, Task[]>();

    for (const col of COLUMNS) {
      grouped.set(col.id, []);
    }

    for (const task of tasks) {
      const list = grouped.get(task.status);
      if (list) {
        list.push(task);
      }
    }

    return grouped;
  }

  function getVisibleColumns(
    columns: readonly TaskColumn[],
    grouped: Map<TaskStatus, Task[]>
  ): readonly TaskColumn[] {
    return columns.filter((col) => {
      const tasks = grouped.get(col.id);
      return tasks && tasks.length > 0;
    });
  }

  return {
    getColumns,
    groupByStatus,
    getVisibleColumns,
  };
}
