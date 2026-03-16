/**
 * Project type definitions for the VSCode extension.
 */

/**
 * Valid status values for a project.
 */
export type ProjectStatus = 'open' | 'in-progress' | 'done';

/**
 * A project with metadata and task progress.
 */
export interface Project {
  readonly id: string;
  readonly status: ProjectStatus;
  readonly title: string;
  readonly taskCount: number;
  readonly completedCount: number;
  readonly created: string;
  readonly updated: string;
  readonly projectPath: string;
}
