/**
 * Task type definitions.
 */

export type TaskId = string & { readonly __brand: unique symbol };

export type TaskStatus =
  | 'backlog'
  | 'scoped'
  | 'planned'
  | 'in-progress'
  | 'finalize'
  | 'done';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  status: TaskStatus;
  priority: string;
  title: string;
  labels: string[];
  created: string;
  updated: string;
  taskPath: string;
}

export interface TaskColumn {
  id: TaskStatus;
  name: string;
  open: boolean;
}

export interface TaskAction {
  label: string;
  command: string;
  description: string;
}

export interface TaskFiles {
  hasTask: boolean;
  hasSpec: boolean;
  hasPlan: boolean;
}
