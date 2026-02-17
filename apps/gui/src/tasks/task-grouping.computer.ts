/**
 * Task grouping computer - handles task sorting and grouping by column.
 */

import type { Task, TaskColumn, TaskStatus } from './task-types';

/**
 * Return type for the task grouping computer.
 */
export interface CreateTaskGroupingComputerReturn {
  /**
   * Get the default column configuration.
   *
   * @returns Array of column configurations.
   */
  getDefaultColumns(): TaskColumn[];

  /**
   * Group tasks by their status column.
   *
   * @param tasks - The tasks to group.
   * @param columns - The column configuration.
   * @returns Record mapping column ID to tasks.
   */
  groupByColumn(
    tasks: readonly Task[],
    columns: readonly TaskColumn[]
  ): Record<TaskStatus, readonly Task[]>;

  /**
   * Filter columns to only those with tasks.
   *
   * @param columns - The column configuration.
   * @param grouped - The grouped tasks.
   * @returns Columns that have at least one task.
   */
  getVisibleColumns(
    columns: readonly TaskColumn[],
    grouped: Record<TaskStatus, readonly Task[]>
  ): readonly TaskColumn[];
}

/**
 * Create a task grouping computer.
 *
 * @returns The task grouping computer instance.
 */
export function createTaskGroupingComputer(): CreateTaskGroupingComputerReturn {
  function getDefaultColumns(): TaskColumn[] {
    return [
      { id: 'in-progress', name: 'In Progress', open: true },
      { id: 'codecheck', name: 'Code Check', open: true },
      { id: 'qa', name: 'QA', open: true },
      { id: 'update-docs', name: 'Update Docs', open: true },
      { id: 'pr', name: 'PR', open: true },
      { id: 'planned', name: 'Planned', open: true },
      { id: 'scoped', name: 'Scoped', open: true },
      { id: 'refined', name: 'Refined', open: true },
      { id: 'backlog', name: 'Backlog', open: true },
      { id: 'done', name: 'Done', open: false },
    ];
  }

  function groupByColumn(
    tasks: readonly Task[],
    columns: readonly TaskColumn[]
  ): Record<TaskStatus, readonly Task[]> {
    const grouped: Record<string, Task[]> = {};

    for (const col of columns) {
      grouped[col.id] = [];
    }

    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }

    return grouped as Record<TaskStatus, readonly Task[]>;
  }

  function getVisibleColumns(
    columns: readonly TaskColumn[],
    grouped: Record<TaskStatus, readonly Task[]>
  ): readonly TaskColumn[] {
    return columns.filter(col => grouped[col.id]?.length > 0);
  }

  return {
    getDefaultColumns,
    groupByColumn,
    getVisibleColumns,
  };
}
