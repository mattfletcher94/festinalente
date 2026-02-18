/**
 * Tasks orchestrator - coordinates task state and operations.
 */

import { shallowRef, ref, computed, triggerRef, type Ref, type ComputedRef, type ShallowRef } from 'vue';

import type { CreateTaskActionsComputerReturn } from './task-actions.computer';
import type { CreateTaskGroupingComputerReturn } from './task-grouping.computer';
import type { Task, TaskColumn, TaskFiles, TaskId, TaskStatus } from './task-types';
import type { CreateTasksApiCapabilityReturn } from './tasks-api.capability';

/**
 * Options for creating a tasks orchestrator.
 */
export interface CreateTasksOrchestratorOptions {
  /**
   * The tasks API capability.
   */
  readonly tasksApi: CreateTasksApiCapabilityReturn;

  /**
   * The task actions computer.
   */
  readonly actionsComputer: CreateTaskActionsComputerReturn;

  /**
   * The task grouping computer.
   */
  readonly groupingComputer: CreateTaskGroupingComputerReturn;
}

/**
 * Return type for the tasks orchestrator.
 */
export interface CreateTasksOrchestratorReturn {
  // State
  readonly tasks: ShallowRef<readonly Task[]>;
  readonly selectedTask: Ref<Task | null>;
  readonly selectedTaskId: ComputedRef<TaskId | null>;
  readonly columns: Ref<TaskColumn[]>;
  readonly loading: Ref<boolean>;

  // Computed
  readonly tasksByColumn: ComputedRef<Record<TaskStatus, readonly Task[]>>;
  readonly visibleColumns: ComputedRef<readonly TaskColumn[]>;

  // Task content
  readonly taskContent: Ref<string>;
  readonly specContent: Ref<string>;
  readonly planContent: Ref<string>;
  readonly availableFiles: Ref<TaskFiles>;
  readonly contentLoading: Ref<boolean>;

  // Computers (exposed for components)
  readonly actionsComputer: CreateTaskActionsComputerReturn;

  // Actions
  loadTasks(projectPath: string): Promise<void>;
  selectTask(task: Task): void;
  clearSelection(): void;
  loadTaskContent(projectPath: string): Promise<void>;
  refreshSelectedTask(projectPath: string): Promise<void>;
  setAutoplay(taskId: TaskId, enabled: boolean): void;
  isAutoplayEnabled(taskId: TaskId): boolean;
}

/**
 * Create a tasks orchestrator.
 *
 * @param options - Configuration options.
 * @returns The tasks orchestrator instance.
 */
export function createTasksOrchestrator(
  options: CreateTasksOrchestratorOptions
): CreateTasksOrchestratorReturn {
  const { tasksApi, actionsComputer, groupingComputer } = options;

  // Task list state
  const tasks = shallowRef<readonly Task[]>([]);
  const selectedTask = ref<Task | null>(null);
  const columns = ref<TaskColumn[]>(groupingComputer.getDefaultColumns());
  const loading = ref(false);

  // Autoplay state (session-only)
  const autoplayEnabled = ref<Record<TaskId, boolean>>({});

  // Task content state
  const taskContent = ref('');
  const specContent = ref('');
  const planContent = ref('');
  const availableFiles = ref<TaskFiles>({ task: false, spec: false, plan: false });
  const contentLoading = ref(false);

  // Computed
  const selectedTaskId = computed(() => selectedTask.value?.id ?? null);

  const tasksByColumn = computed(() =>
    groupingComputer.groupByColumn(tasks.value, columns.value)
  );

  const visibleColumns = computed(() =>
    groupingComputer.getVisibleColumns(columns.value, tasksByColumn.value)
  );

  // Actions
  async function loadTasks(projectPath: string): Promise<void> {
    loading.value = true;
    try {
      const result = await tasksApi.listTasks(projectPath);
      tasks.value = result;
      triggerRef(tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
    loading.value = false;
  }

  function selectTask(task: Task): void {
    selectedTask.value = task;
  }

  function clearSelection(): void {
    selectedTask.value = null;
    taskContent.value = '';
    specContent.value = '';
    planContent.value = '';
    availableFiles.value = { task: false, spec: false, plan: false };
  }

  async function loadTaskContent(projectPath: string): Promise<void> {
    const task = selectedTask.value;
    if (!task) {
      taskContent.value = '';
      specContent.value = '';
      planContent.value = '';
      availableFiles.value = { task: false, spec: false, plan: false };
      return;
    }

    contentLoading.value = true;
    try {
      // Check which files exist
      availableFiles.value = await tasksApi.getAvailableFiles(projectPath, task.id);

      // Load contents in parallel
      const [taskFile, specFile, planFile] = await Promise.all([
        availableFiles.value.task ? tasksApi.readTaskFile(projectPath, task.id) : Promise.resolve(''),
        availableFiles.value.spec ? tasksApi.readSpecFile(projectPath, task.id) : Promise.resolve(''),
        availableFiles.value.plan ? tasksApi.readPlanFile(projectPath, task.id) : Promise.resolve(''),
      ]);

      taskContent.value = taskFile;
      specContent.value = specFile;
      planContent.value = planFile;
    } catch (err) {
      console.error('Failed to load task content:', err);
      taskContent.value = 'Failed to load task content.';
    }
    contentLoading.value = false;
  }

  async function refreshSelectedTask(projectPath: string): Promise<void> {
    if (!selectedTask.value) return;

    // Reload tasks and find updated version
    await loadTasks(projectPath);
    const updated = tasks.value.find(t => t.id === selectedTask.value?.id);
    if (updated) {
      selectedTask.value = updated;
    }

    // Reload content
    await loadTaskContent(projectPath);
  }

  /**
   * Set autoplay state for a task.
   *
   * @param taskId - The task ID.
   * @param enabled - Whether autoplay is enabled.
   */
  function setAutoplay(taskId: TaskId, enabled: boolean): void {
    autoplayEnabled.value = { ...autoplayEnabled.value, [taskId]: enabled };
  }

  /**
   * Check if autoplay is enabled for a task.
   *
   * @param taskId - The task ID.
   * @returns Whether autoplay is enabled for the task.
   */
  function isAutoplayEnabled(taskId: TaskId): boolean {
    return autoplayEnabled.value[taskId] ?? false;
  }

  return {
    // State
    tasks,
    selectedTask,
    selectedTaskId,
    columns,
    loading,

    // Computed
    tasksByColumn,
    visibleColumns,

    // Task content
    taskContent,
    specContent,
    planContent,
    availableFiles,
    contentLoading,

    // Computers
    actionsComputer,

    // Actions
    loadTasks,
    selectTask,
    clearSelection,
    loadTaskContent,
    refreshSelectedTask,
    setAutoplay,
    isAutoplayEnabled,
  };
}
