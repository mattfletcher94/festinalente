/**
 * Task domain types for the VSCode extension.
 */

/**
 * Task status representing the kanban workflow stages.
 */
export type TaskStatus =
  | 'backlog'
  | 'scoped'
  | 'planned'
  | 'in-progress'
  | 'codecheck'
  | 'qa'
  | 'update-docs'
  | 'pr'
  | 'done';

/**
 * Task priority levels.
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * A task in the kanban board.
 */
export interface Task {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly priority?: TaskPriority;
  readonly labels?: readonly string[];
  readonly path: string;
}

/**
 * Task action button configuration.
 */
export interface TaskAction {
  readonly label: string;
  readonly command: string;
  readonly description: string;
}

/**
 * Kanban column configuration.
 */
export interface TaskColumn {
  readonly id: TaskStatus;
  readonly name: string;
  readonly open: boolean;
}
