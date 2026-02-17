/**
 * Tasks provider - Vue provide/inject wrapper for tasks orchestrator.
 */

import { createContext } from '@/lib/utils';

import type { CreateTasksOrchestratorReturn } from './tasks.orchestrator';

export const [injectTasks, provideTasks, TASKS_KEY] = createContext<CreateTasksOrchestratorReturn>('Tasks');

export type { CreateTasksOrchestratorReturn as TasksContext };
