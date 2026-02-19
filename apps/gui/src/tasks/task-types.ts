/**
 * Task domain types.
 */

/**
 * Branded type for task identifiers.
 */
export type TaskId = string & { readonly __brand: 'TaskId' };

/**
 * Task status representing the kanban workflow stages.
 */
export type TaskStatus =
  | 'backlog'
  | 'refined'
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
  readonly id: TaskId;
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
  readonly variant: 'default' | 'secondary' | 'destructive' | 'outline';
  readonly description: string;
}

/**
 * Kanban column configuration.
 */
export interface TaskColumn {
  readonly id: TaskStatus;
  readonly name: string;
  open: boolean;
}

/**
 * Available task files (task.xml, spec.xml, plan.xml).
 */
export interface TaskFiles {
  readonly task: boolean;
  readonly spec: boolean;
  readonly plan: boolean;
}
