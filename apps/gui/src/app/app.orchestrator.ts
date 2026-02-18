/**
 * App orchestrator - coordinates all features at the application level.
 */

import { computed, watch, type ComputedRef } from 'vue';

import type { CreateSettingsOrchestratorReturn } from '@/settings';
import type { CreateTasksOrchestratorReturn } from '@/tasks';
import type { CreateTerminalOrchestratorReturn } from '@/terminal';

/**
 * Options for creating an app orchestrator.
 */
export interface CreateAppOrchestratorOptions {
  /**
   * The settings orchestrator.
   */
  readonly settings: CreateSettingsOrchestratorReturn;

  /**
   * The tasks orchestrator.
   */
  readonly tasks: CreateTasksOrchestratorReturn;

  /**
   * The terminal orchestrator.
   */
  readonly terminal: CreateTerminalOrchestratorReturn;
}

/**
 * Return type for the app orchestrator.
 */
export interface CreateAppOrchestratorReturn {
  // Sub-orchestrators (exposed for components)
  readonly settings: CreateSettingsOrchestratorReturn;
  readonly tasks: CreateTasksOrchestratorReturn;
  readonly terminal: CreateTerminalOrchestratorReturn;

  // Computed state
  readonly isReady: ComputedRef<boolean>;
  readonly hasProject: ComputedRef<boolean>;

  // Actions
  initialize(): Promise<void>;
  runCommand(command: string): Promise<void>;
  changeProject(): Promise<void>;
  createTask(): void;
  discover(): void;
  handleCommandComplete(exitCode: number): Promise<void>;
}

/**
 * Create an app orchestrator.
 *
 * @param options - Configuration options.
 * @returns The app orchestrator instance.
 */
export function createAppOrchestrator(
  options: CreateAppOrchestratorOptions
): CreateAppOrchestratorReturn {
  const { settings, tasks, terminal } = options;

  // Computed state
  const isReady = computed(() => settings.loaded.value);
  const hasProject = computed(() => settings.projectPath.value !== null);

  // Set up watchers for task selection changes
  watch(
    () => tasks.selectedTask.value,
    () => {
      const projectPath = settings.projectPath.value;
      if (projectPath) {
        tasks.loadTaskContent(projectPath);
      }
    }
  );

  // Actions
  async function initialize(): Promise<void> {
    await settings.load();

    // If we have a project, load tasks
    const projectPath = settings.projectPath.value;
    if (projectPath) {
      await tasks.loadTasks(projectPath);
    }
  }

  async function runCommand(command: string): Promise<void> {
    const projectPath = settings.projectPath.value;
    if (!projectPath || !terminal.isReady.value) return;

    await terminal.runCommand(projectPath, command);
    terminal.resize(80, 24); // Default size, will be updated by component
  }

  async function changeProject(): Promise<void> {
    // Kill any running terminal process
    await terminal.kill();

    // Open folder picker
    const newPath = await settings.openProjectPicker();
    if (!newPath) return;

    // Reset state
    tasks.clearSelection();

    // Update project path and reload tasks
    await settings.setProjectPath(newPath);
    await tasks.loadTasks(newPath);
  }

  function createTask(): void {
    runCommand('/kanban-create');
  }

  function discover(): void {
    runCommand('/kanban-discover');
  }

  /**
   * Handle terminal command completion for autoplay.
   *
   * @param exitCode - The exit code from the command.
   */
  async function handleCommandComplete(exitCode: number): Promise<void> {
    // Only auto-run on successful exit
    if (exitCode !== 0) return;

    // Use terminal's currentTaskId since user may have clicked another task while command ran
    const taskId = terminal.currentTaskId.value;
    if (!taskId) return;

    // Check if autoplay is enabled for this task
    if (!tasks.isAutoplayEnabled(taskId)) return;

    // Get the current task (after refresh) - find from tasks list using currentTaskId
    const currentTask = tasks.tasks.value.find(t => t.id === taskId);
    if (!currentTask) return;

    // Stop at review phases (codecheck, qa, pr)
    const reviewPhases = ['codecheck', 'qa', 'pr'];
    if (reviewPhases.includes(currentTask.status)) return;

    // Get first available action for this task
    const availableActions = tasks.actionsComputer.getActions(currentTask);
    if (availableActions.length === 0) return;

    // Run the next command
    await runCommand(availableActions[0].command);
  }

  return {
    // Sub-orchestrators
    settings,
    tasks,
    terminal,

    // Computed state
    isReady,
    hasProject,

    // Actions
    initialize,
    runCommand,
    changeProject,
    createTask,
    discover,
    handleCommandComplete,
  };
}
