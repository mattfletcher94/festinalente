/**
 * Tasks feature - task management for the kanban board.
 */

// Types
export type {
  Task,
  TaskAction,
  TaskColumn,
  TaskFiles,
  TaskId,
  TaskPriority,
  TaskStatus,
} from './task-types';

// Computers
export {
  createTaskActionsComputer,
  type CreateTaskActionsComputerReturn,
} from './task-actions.computer';

export {
  createTaskGroupingComputer,
  type CreateTaskGroupingComputerReturn,
} from './task-grouping.computer';

// Capability
export {
  createTasksApiCapability,
  type CreateTasksApiCapabilityReturn,
} from './tasks-api.capability';

// Orchestrator
export {
  createTasksOrchestrator,
  type CreateTasksOrchestratorOptions,
  type CreateTasksOrchestratorReturn,
} from './tasks.orchestrator';

// Provider
export { injectTasks, provideTasks, TASKS_KEY, type TasksContext } from './tasks.provider';
